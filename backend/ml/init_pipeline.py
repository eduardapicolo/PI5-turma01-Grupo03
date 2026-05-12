import os
import sys
import warnings
from pathlib import Path
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')
warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')

import pandas as pd
import joblib
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fastapi_app'))
from pet_transformers import MultiLabelTransformer

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

MONGO_URI = os.getenv('MONGO_URI', '')
MODELOS_DIR = Path(__file__).resolve().parents[1] / 'fastapi_app' / 'models'
MODELOS_DIR.mkdir(parents=True, exist_ok=True)

cliente = MongoClient(MONGO_URI)
db = cliente['PetMatch']

MAPA_SEXO = {'fêmea': 0.0, 'femea': 0.0, 'macho': 1.0}
MAPA_PORTE = {'pequeno': 0.0, 'médio': 1.0, 'medio': 1.0, 'grande': 2.0}
MAPA_IDADE = {
    'abaixo de 2 meses': 0.0, '2 a 6 meses': 1.0, '7 a 11 meses': 2.0,
    '1 ano': 3.0, '2 anos': 4.0, '3 anos': 5.0,
    '4 anos': 6.0, '5 anos': 7.0, '6 ou mais anos': 8.0,
}

def normalizar_pet(pet: dict) -> dict | None:
    sexo_val = MAPA_SEXO.get(str(pet.get('sexo', '')).lower().strip())
    porte_val = MAPA_PORTE.get(str(pet.get('porte', '')).lower().strip())
    idade_str = str(pet.get('idade_display') or pet.get('idade', '')).lower().strip()
    idade_val = MAPA_IDADE.get(idade_str)

    if None in (sexo_val, porte_val, idade_val):
        return None
    

    cuidados_str = str(pet.get('cuidados_veterinarios', '')).lower().strip()
    if not cuidados_str or cuidados_str == 'nan':
        partes = []
        if pet.get('castrado'):
            partes.append('castrado')
        if pet.get('vacinado'):
            partes.append('vacinado')
        if pet.get('vermifugado'):
            partes.append('vermifugado')
        if pet.get('precisa_cuidados_especiais'):
            partes.append('precisa de cuidados especiais')
        cuidados_str = ', '.join(partes)


    vive_str = str(pet.get('vive_bem_com', '')).lower().strip()
    if not vive_str or vive_str == 'nan':
        partes = []
        if pet.get('aceita_apartamento'):
            partes.append('apartamento')
        if pet.get('aceita_casa_quintal'):
            partes.append('casa com quintal')
        vive_str = ', '.join(partes)

 
    sociavel_str = str(pet.get('sociavel_com', '')).lower().strip()
    if not sociavel_str or sociavel_str == 'nan':
        partes = []
        if pet.get('sociavel_criancas'):
            partes.append('crianças')
        if pet.get('sociavel_animais'):
            partes.append('outros animais')
        sociavel_str = ', '.join(partes)

    return {
        'sexo': sexo_val,
        'porte': porte_val,
        'idade': idade_val,
        'pelagem': str(pet.get('pelagem', '')).lower().strip(),
        'cuidados_veterinarios': cuidados_str,
        'vive_bem_com': vive_str,
        'sociavel_com': sociavel_str,
    }

def construir_pipeline() -> Pipeline:
    preprocessador = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', ['sexo', 'porte', 'idade']),
            ('pelagem', MultiLabelTransformer(), ['pelagem']),
            ('cuidados', MultiLabelTransformer(), ['cuidados_veterinarios']),
            ('vive', MultiLabelTransformer(), ['vive_bem_com']),
            ('sociavel', MultiLabelTransformer(), ['sociavel_com']),
        ],
        remainder='drop',
    )
    return Pipeline([
        ('prep', preprocessador),
        ('scaler', MinMaxScaler()),
        ('pca', PCA(n_components=0.9)),
    ])



pets_brutos = list(db['pets'].find({'disponibilidade': 'Disponível'}))

registros = []
for pet in pets_brutos:
    registro = normalizar_pet(pet)
    if registro is None:
        continue
    registro['_id'] = pet['_id']
    registro['tipo_animal'] = str(pet.get('tipo_animal', '')).lower().strip()
    registros.append(registro)

df_todos = pd.DataFrame(registros)


df_cachorro = df_todos[df_todos['tipo_animal'] == 'cachorro'].reset_index(drop=True)
df_gato = df_todos[df_todos['tipo_animal'] == 'gato'].reset_index(drop=True)


COLUNAS_FEATURES = ['sexo', 'porte', 'idade', 'pelagem',
                    'cuidados_veterinarios', 'vive_bem_com', 'sociavel_com']


pipeline_cachorro = construir_pipeline()
pipeline_gato = construir_pipeline()

print('\n[4] Treinando pipelines...')
pipeline_cachorro.fit(df_cachorro[COLUNAS_FEATURES])
pipeline_gato.fit(df_gato[COLUNAS_FEATURES])

pca_cachorro = pipeline_cachorro.named_steps['pca']
pca_gato = pipeline_gato.named_steps['pca']

features_antes_cachorro = pipeline_cachorro.named_steps['prep'].transform(df_cachorro[COLUNAS_FEATURES]).shape[1]
features_antes_gato = pipeline_gato.named_steps['prep'].transform(df_gato[COLUNAS_FEATURES]).shape[1]

print(f'Cachorro: {features_antes_cachorro} features → {pca_cachorro.n_components_} componentes PCA ({pca_cachorro.explained_variance_ratio_.cumsum()[-1]:.2%} variância)')
print(f'Gato: {features_antes_gato} features → {pca_gato.n_components_} componentes PCA ({pca_gato.explained_variance_ratio_.cumsum()[-1]:.2%} variância)')

joblib.dump(pipeline_cachorro, MODELOS_DIR / 'pipeline_cachorro.pkl')
joblib.dump(pipeline_gato, MODELOS_DIR / 'pipeline_gato.pkl')
print(f'\n[7] PKLs salvos: {MODELOS_DIR}')




total_ok = 0
total_err = 0
lote = []
TAMANHO_LOTE = 500
agora = datetime.now(timezone.utc)

for _, linha in df_todos.iterrows():
    tipo = linha['tipo_animal']
    pipeline = pipeline_cachorro if tipo == 'cachorro' else pipeline_gato

    try:
        df_feat = pd.DataFrame([linha[COLUNAS_FEATURES].to_dict()])
        vetor = pipeline.transform(df_feat)[0].tolist()
    except Exception:
        total_err += 1
        continue

    lote.append(UpdateOne(
        {'_id': linha['_id']},
        {'$set': {'vetor_pca': vetor, 'vetor_calculado_em': agora}},
    ))
    total_ok += 1

    if len(lote) >= TAMANHO_LOTE:
        db['pets'].bulk_write(lote, ordered=False)
        lote.clear()
        print(f'  ... {total_ok} vetores', flush=True)

if lote:
    db['pets'].bulk_write(lote, ordered=False)

print(f'\n {total_ok} OK | {total_err} erros')

cliente.close()
