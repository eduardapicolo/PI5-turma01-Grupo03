"""
Treina e salva o pipeline ML para recomendação de pets.

Arquitetura:
    ColumnTransformer(
        ('num',      passthrough,           [sexo, porte, idade])
        ('pelagem',  MultiLabelTransformer, ['pelagem'])
        ('cuidados', MultiLabelTransformer, ['cuidados_veterinarios'])
        ('vive',     MultiLabelTransformer, ['vive_bem_com'])
        ('sociavel', MultiLabelTransformer, ['sociavel_com'])
    )
    → MinMaxScaler
    → PCA(n_components=0.9)

Saída:
    fastapi_app/models/pipeline_cachorro.pkl
    fastapi_app/models/pipeline_gato.pkl

Uso:
    python backend/ml/init_pipeline.py
"""

import os
import sys
import warnings
from pathlib import Path
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')
warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')

import numpy as np
import pandas as pd
import joblib
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler

# Importa do módulo compartilhado com o FastAPI para que joblib
# serialize o caminho correto (pet_transformers.MultiLabelTransformer)
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fastapi_app'))
from pet_transformers import MultiLabelTransformer  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

MONGO_URI  = os.getenv('MONGO_URI', 'mongodb+srv://admin:1234@clusterpipet.iwrz3ye.mongodb.net/')
MODELS_DIR = Path(__file__).resolve().parents[1] / 'fastapi_app' / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

client = MongoClient(MONGO_URI)
db     = client['PetMatch']


# ── Mapeamentos de domínio ────────────────────────────────────────────────────

SEXO_MAP  = {'fêmea': 0.0, 'femea': 0.0, 'macho': 1.0}
PORTE_MAP = {'pequeno': 0.0, 'médio': 1.0, 'medio': 1.0, 'grande': 2.0}
IDADE_MAP = {
    'abaixo de 2 meses': 0.0, '2 a 6 meses': 1.0, '7 a 11 meses': 2.0,
    '1 ano': 3.0, '2 anos': 4.0, '3 anos': 5.0,
    '4 anos': 6.0, '5 anos': 7.0, '6 ou mais anos': 8.0,
}


# ── Normalização de documento pet → registro uniforme ────────────────────────

def pet_to_record(pet: dict) -> dict | None:
    """Converte documento do MongoDB em registro com dtypes consistentes.
    Suporta schema legado (strings) e schema novo (booleanos).
    Retorna None se campos obrigatórios estiverem ausentes.
    """
    sexo_val  = SEXO_MAP.get(str(pet.get('sexo', '')).lower().strip())
    porte_val = PORTE_MAP.get(str(pet.get('porte', '')).lower().strip())
    idade_str = str(pet.get('idade_display') or pet.get('idade', '')).lower().strip()
    idade_val = IDADE_MAP.get(idade_str)

    if None in (sexo_val, porte_val, idade_val):
        return None

    # cuidados_veterinarios: legado = string, novo = booleanos
    cuidados_str = str(pet.get('cuidados_veterinarios', '')).lower().strip()
    if not cuidados_str or cuidados_str == 'nan':
        parts = []
        if pet.get('castrado'):                   parts.append('castrado')
        if pet.get('vacinado'):                   parts.append('vacinado')
        if pet.get('vermifugado'):                parts.append('vermifugado')
        if pet.get('precisa_cuidados_especiais'): parts.append('precisa de cuidados especiais')
        cuidados_str = ', '.join(parts)

    # vive_bem_com
    vive_str = str(pet.get('vive_bem_com', '')).lower().strip()
    if not vive_str or vive_str == 'nan':
        parts = []
        if pet.get('aceita_apartamento'):  parts.append('apartamento')
        if pet.get('aceita_casa_quintal'): parts.append('casa com quintal')
        vive_str = ', '.join(parts)

    # sociavel_com
    sociavel_str = str(pet.get('sociavel_com', '')).lower().strip()
    if not sociavel_str or sociavel_str == 'nan':
        parts = []
        if pet.get('sociavel_criancas'): parts.append('crianças')
        if pet.get('sociavel_animais'):  parts.append('outros animais')
        sociavel_str = ', '.join(parts)

    return {
        'sexo':                  sexo_val,
        'porte':                 porte_val,
        'idade':                 idade_val,
        'pelagem':               str(pet.get('pelagem', '')).lower().strip(),
        'cuidados_veterinarios': cuidados_str,
        'vive_bem_com':          vive_str,
        'sociavel_com':          sociavel_str,
    }


# ── Construção do pipeline ────────────────────────────────────────────────────

def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ('num',      'passthrough',            ['sexo', 'porte', 'idade']),
            ('pelagem',  MultiLabelTransformer(),   ['pelagem']),
            ('cuidados', MultiLabelTransformer(),   ['cuidados_veterinarios']),
            ('vive',     MultiLabelTransformer(),   ['vive_bem_com']),
            ('sociavel', MultiLabelTransformer(),   ['sociavel_com']),
        ],
        remainder='drop',
    )
    return Pipeline([
        ('prep',   preprocessor),
        ('scaler', MinMaxScaler()),
        ('pca',    PCA(n_components=0.9)),
    ])


# ── Carrega e normaliza dados ─────────────────────────────────────────────────

print('Carregando pets do MongoDB...')
raw_pets = list(db['pets'].find())

records = []
for p in raw_pets:
    r = pet_to_record(p)
    if r is None:
        continue
    r['_id']        = p['_id']
    r['tipo_animal'] = str(p.get('tipo_animal', '')).lower().strip()
    records.append(r)

df_all = pd.DataFrame(records)
print(f'  Registros válidos: {len(df_all)} / {len(raw_pets)}')

df_cachorro = df_all[df_all['tipo_animal'] == 'cachorro'].reset_index(drop=True)
df_gato     = df_all[df_all['tipo_animal'] == 'gato'].reset_index(drop=True)
print(f'  Cachorros: {len(df_cachorro)} | Gatos: {len(df_gato)}')

FEATURE_COLS = ['sexo', 'porte', 'idade', 'pelagem',
                'cuidados_veterinarios', 'vive_bem_com', 'sociavel_com']


# ── Treinamento ───────────────────────────────────────────────────────────────

print('\nTreinando pipelines...')

pipeline_cachorro = build_pipeline()
pipeline_gato     = build_pipeline()

pipeline_cachorro.fit(df_cachorro[FEATURE_COLS])
pipeline_gato.fit(df_gato[FEATURE_COLS])

pca_c = pipeline_cachorro.named_steps['pca']
pca_g = pipeline_gato.named_steps['pca']

print(f'  cachorro: {pca_c.n_components_} componentes PCA '
      f'({pca_c.explained_variance_ratio_.cumsum()[-1]:.2%} variância)')
print(f'  gato:     {pca_g.n_components_} componentes PCA '
      f'({pca_g.explained_variance_ratio_.cumsum()[-1]:.2%} variância)')


# ── Salva pkl ─────────────────────────────────────────────────────────────────

joblib.dump(pipeline_cachorro, MODELS_DIR / 'pipeline_cachorro.pkl')
joblib.dump(pipeline_gato,     MODELS_DIR / 'pipeline_gato.pkl')
print(f'\n[OK] PKLs salvos em: {MODELS_DIR}')


# ── Calcula e salva vetores PCA de todos os pets ──────────────────────────────

print('\nCalculando vetores PCA...')

total_ok  = 0
total_err = 0
batch     = []
BATCH_SIZE = 500
now = datetime.now(timezone.utc)

for _, row in df_all.iterrows():
    tipo = row['tipo_animal']
    pipe = pipeline_cachorro if tipo == 'cachorro' else pipeline_gato if tipo == 'gato' else None
    if pipe is None:
        continue

    try:
        feat  = pd.DataFrame([row[FEATURE_COLS].to_dict()])
        vetor = pipe.transform(feat)[0].tolist()
    except Exception as e:
        total_err += 1
        continue

    batch.append(UpdateOne(
        {'_id': row['_id']},
        {'$set': {'vetor_pca': vetor, 'vetor_calculado_em': now}},
    ))
    total_ok += 1

    if len(batch) >= BATCH_SIZE:
        db['pets'].bulk_write(batch, ordered=False)
        batch.clear()
        print(f'  ... {total_ok} vetores gravados', flush=True)

if batch:
    db['pets'].bulk_write(batch, ordered=False)

print(f'  Vetores: {total_ok} OK | {total_err} erros')
print('\nPipeline inicializado com sucesso!')
client.close()
