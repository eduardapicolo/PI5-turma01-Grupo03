"""
FastAPI Microservice — Recomendação de Pets

POST /recommend  → recebe respostas do questionário + vetores de likes curtidos,
                   retorna pets ranqueados por distância euclidiana.
POST /refresh    → recarrega vetores de pets do MongoDB em memória.
GET  /health     → health check.

Variáveis de ambiente:
    MONGO_URI   — URI do MongoDB
    MODELS_DIR  — diretório com os pkl (padrão: ./models)
    PORT        — porta (Railway injeta automaticamente)

Uso local:
    uvicorn main:app --reload --port 8000
"""

import os
import numpy as np
import joblib
import pandas as pd
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
from pet_transformers import MultiLabelTransformer  # noqa: F401 — necessário para joblib desserializar

load_dotenv(Path(__file__).parent.parent / '.env')

MONGO_URI  = os.getenv('MONGO_URI',   'mongodb+srv://admin:1234@clusterpipet.iwrz3ye.mongodb.net/')
MODELS_DIR = Path(os.getenv('MODELS_DIR', str(Path(__file__).parent / 'models')))

# ── Mapeamentos: respostas do questionário → schema de pet ───────────────────

SEXO_MAP  = {'Macho': 1.0, 'Fêmea': 0.0, 'Ambos': 0.5}
PORTE_MAP = {'Pequeno': 0.0, 'Médio': 1.0, 'Grande': 2.0}
IDADE_MAP = {'Filhote': 1.0, 'Adulto': 5.0, 'Sênior': 8.0}

FEATURE_COLS = ['sexo', 'porte', 'idade', 'pelagem',
                'cuidados_veterinarios', 'vive_bem_com', 'sociavel_com']


# ── Estado global ─────────────────────────────────────────────────────────────

pipelines: dict = {}   # tipo → sklearn.Pipeline
pet_cache: dict = {}   # tipo → [{_id: str, vetor: np.ndarray}]


def _load_pipelines():
    for tipo in ('cachorro', 'gato'):
        path = MODELS_DIR / f'pipeline_{tipo}.pkl'
        if not path.exists():
            print(f'[WARN] Pipeline não encontrado: {path}')
            continue
        pipelines[tipo] = joblib.load(path)
        pca = pipelines[tipo].named_steps['pca']
        print(f'[OK] Pipeline {tipo}: {pca.n_components_} componentes PCA')


def _load_pet_vectors():
    client = MongoClient(MONGO_URI)
    db     = client['PetMatch']
    for tipo in ('cachorro', 'gato'):
        docs = list(db['pets'].find(
            {
                'tipo_animal':    {'$regex': f'^{tipo}$', '$options': 'i'},
                'disponibilidade': 'Disponível',
                'vetor_pca':      {'$exists': True, '$ne': []},
            },
            {'_id': 1, 'vetor_pca': 1},
        ))
        pet_cache[tipo] = [
            {'_id': str(d['_id']), 'vetor': np.array(d['vetor_pca'], dtype=float)}
            for d in docs if d.get('vetor_pca')
        ]
        print(f'[OK] {len(pet_cache[tipo])} vetores de {tipo} em memória')
    client.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_pipelines()
    _load_pet_vectors()
    yield


app = FastAPI(title='PetMatch ML', version='2.0.0', lifespan=lifespan)


# ── Schemas ───────────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    respostas:     dict
    liked_vetores: Optional[list] = None
    excluded_ids:  Optional[list] = None   # IDs de pets já curtidos — não exibir
    top_n:         int = 20
    skip:          int = 0


class RecommendItem(BaseModel):
    pet_id:    str
    score:     int
    distancia: float


# ── Helper: respostas → DataFrame no mesmo formato dos pets ──────────────────

def _respostas_to_df(respostas: dict) -> pd.DataFrame:
    cuidados_str = ''
    if respostas.get('cuidados') == 'completo':
        cuidados_str = 'castrado, vacinado, vermifugado'
    elif respostas.get('cuidados') == 'depois':
        cuidados_str = 'precisa de cuidados especiais'

    vive_str = ''
    if respostas.get('local') == 'Apartamento':
        vive_str = 'apartamento'
    elif respostas.get('local') == 'Casa com quintal':
        vive_str = 'casa com quintal'

    sociavel_str = 'crianças, outros animais' if respostas.get('sociavel') == 'sim' else ''

    return pd.DataFrame([{
        'sexo':                  SEXO_MAP.get(respostas.get('sexo', ''), 0.0),
        'porte':                 PORTE_MAP.get(respostas.get('porte', ''), 0.0),
        'idade':                 IDADE_MAP.get(respostas.get('idade', ''), 0.0),
        'pelagem':               '',           # usuário não especifica pelagem
        'cuidados_veterinarios': cuidados_str,
        'vive_bem_com':          vive_str,
        'sociavel_com':          sociavel_str,
    }])


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get('/health')
def health():
    return {
        'status':    'ok',
        'pipelines': list(pipelines.keys()),
        'cache':     {t: len(v) for t, v in pet_cache.items()},
    }


@app.post('/refresh')
def refresh():
    """Recarrega vetores de pets do MongoDB (use após init_pipeline.py)."""
    pet_cache.clear()
    _load_pet_vectors()
    return {'status': 'ok', 'cache': {t: len(v) for t, v in pet_cache.items()}}


class VectorizeRequest(BaseModel):
    pet: dict


@app.post('/vectorize')
def vectorize(req: VectorizeRequest):
    """Calcula o vetor PCA de um único pet (chamado pelo Node após create/update)."""
    pet  = req.pet
    tipo = str(pet.get('tipo_animal', '')).lower().strip()

    if tipo not in pipelines:
        raise HTTPException(
            status_code=400,
            detail=f"Pipeline para '{tipo}' não carregado.",
        )

    pipe = pipelines[tipo]

    sexo_map  = {'fêmea': 0.0, 'femea': 0.0, 'macho': 1.0}
    porte_map = {'pequeno': 0.0, 'médio': 1.0, 'medio': 1.0, 'grande': 2.0}
    idade_map = {
        'abaixo de 2 meses': 0.0, '2 a 6 meses': 1.0, '7 a 11 meses': 2.0,
        '1 ano': 3.0, '2 anos': 4.0, '3 anos': 5.0,
        '4 anos': 6.0, '5 anos': 7.0, '6 ou mais anos': 8.0,
    }

    sexo_val  = sexo_map.get(str(pet.get('sexo', '')).lower().strip())
    porte_val = porte_map.get(str(pet.get('porte', '')).lower().strip())
    idade_str = str(pet.get('idade_display') or pet.get('idade', '')).lower().strip()
    idade_val = idade_map.get(idade_str)

    if None in (sexo_val, porte_val, idade_val):
        raise HTTPException(status_code=422, detail='Campos sexo/porte/idade ausentes ou inválidos.')

    # Reconstrói strings de cuidados/vive/sociavel a partir de booleanos
    cuidados_str = str(pet.get('cuidados_veterinarios', '')).lower().strip()
    if not cuidados_str or cuidados_str == 'nan':
        parts = []
        if pet.get('castrado'):                   parts.append('castrado')
        if pet.get('vacinado'):                   parts.append('vacinado')
        if pet.get('vermifugado'):                parts.append('vermifugado')
        if pet.get('precisa_cuidados_especiais'): parts.append('precisa de cuidados especiais')
        cuidados_str = ', '.join(parts)

    vive_str = str(pet.get('vive_bem_com', '')).lower().strip()
    if not vive_str or vive_str == 'nan':
        parts = []
        if pet.get('aceita_apartamento'):  parts.append('apartamento')
        if pet.get('aceita_casa_quintal'): parts.append('casa com quintal')
        vive_str = ', '.join(parts)

    sociavel_str = str(pet.get('sociavel_com', '')).lower().strip()
    if not sociavel_str or sociavel_str == 'nan':
        parts = []
        if pet.get('sociavel_criancas'): parts.append('crianças')
        if pet.get('sociavel_animais'):  parts.append('outros animais')
        sociavel_str = ', '.join(parts)

    df = pd.DataFrame([{
        'sexo':                  sexo_val,
        'porte':                 porte_val,
        'idade':                 idade_val,
        'pelagem':               str(pet.get('pelagem', '')).lower().strip(),
        'cuidados_veterinarios': cuidados_str,
        'vive_bem_com':          vive_str,
        'sociavel_com':          sociavel_str,
    }])

    vetor = pipe.transform(df)[0].tolist()
    return {'vetor_pca': vetor}


@app.post('/recommend', response_model=list[RecommendItem])
def recommend(req: RecommendRequest):
    tipo = req.respostas.get('tipo', '').lower()   # 'cachorro' | 'gato'

    if tipo not in pipelines:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Pipeline para '{tipo}' não carregado. "
                "Execute: python backend/ml/init_pipeline.py"
            ),
        )

    pipe = pipelines[tipo]

    # Vetor do questionário via pipeline oficial
    user_df        = _respostas_to_df(req.respostas)
    v_questionario = pipe.transform(user_df)[0]

    # Blending: média simples entre questionário e likes (sem pesos)
    if req.liked_vetores and len(req.liked_vetores) > 0:
        liked_arr = np.array(req.liked_vetores, dtype=float)
        v_likes   = liked_arr.mean(axis=0)
        # só blend se dimensões baterem
        if v_likes.shape == v_questionario.shape:
            v_final = (v_questionario + v_likes) / 2.0
        else:
            v_final = v_questionario
    else:
        v_final = v_questionario

    # Filtra pets com dimensão compatível e remove já curtidos
    n_dims     = len(v_final)
    excluded   = set(req.excluded_ids or [])
    candidates = [
        p for p in pet_cache.get(tipo, [])
        if len(p['vetor']) == n_dims and p['_id'] not in excluded
    ]

    if not candidates:
        return []

    # Distância euclidiana
    dists = [
        (p['_id'], float(np.linalg.norm(v_final - p['vetor'])))
        for p in candidates
    ]
    dists.sort(key=lambda x: x[1])

    max_dist = dists[-1][1] if dists else 1.0

    result = []
    for pet_id, dist in dists[req.skip: req.skip + req.top_n]:
        score = round((1.0 - dist / max_dist) * 100) if max_dist > 0 else 100
        result.append(RecommendItem(
            pet_id=pet_id,
            score=score,
            distancia=round(dist, 4),
        ))

    return result
