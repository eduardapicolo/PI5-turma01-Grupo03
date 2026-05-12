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

from pet_transformers import MultiLabelTransformer

load_dotenv(Path(__file__).parent.parent / '.env')

MONGO_URI = os.getenv('MONGO_URI', '')
MODELS_DIR = Path(os.getenv('MODELS_DIR', str(Path(__file__).parent / 'models')))

MAPA_SEXO = {'fêmea': 0.0, 'femea': 0.0, 'macho': 1.0}
MAPA_PORTE = {'pequeno': 0.0, 'médio': 1.0, 'medio': 1.0, 'grande': 2.0}
MAPA_IDADE = {
    'abaixo de 2 meses': 0.0, '2 a 6 meses': 1.0, '7 a 11 meses': 2.0,
    '1 ano': 3.0, '2 anos': 4.0, '3 anos': 5.0,
    '4 anos': 6.0, '5 anos': 7.0, '6 ou mais anos': 8.0,
}

COLUNAS_FEATURES = ['sexo', 'porte', 'idade', 'pelagem',
                     'cuidados_veterinarios', 'vive_bem_com', 'sociavel_com']

pipelines = {}
cache_vetores_pets = {}


def _carregar_pipelines():
    for tipo in ('cachorro', 'gato'):
        caminho = MODELS_DIR / f'pipeline_{tipo}.pkl'
        if not caminho.exists():
            print(f'[AVISO] Pipeline não encontrado: {caminho}')
            continue
        pipelines[tipo] = joblib.load(caminho)
        pca = pipelines[tipo].named_steps['pca']
        print(f'[OK] Pipeline {tipo}: {pca.n_components_} componentes PCA')


def _carregar_vetores_pets():
    cliente = MongoClient(MONGO_URI)
    db = cliente['PetMatch']

    for tipo in ('cachorro', 'gato'):
        documentos = list(db['pets'].find(
            {
                'tipo_animal': {'$regex': f'^{tipo}$', '$options': 'i'},
                'disponibilidade': 'Disponível',
                'vetor_pca': {'$exists': True, '$ne': []},
            },
            {'_id': 1, 'vetor_pca': 1},
        ))

        cache_vetores_pets[tipo] = [
            {'_id': str(d['_id']), 'vetor': np.array(d['vetor_pca'], dtype=float)}
            for d in documentos if d.get('vetor_pca')
        ]
        print(f'[OK] {len(cache_vetores_pets[tipo])} vetores de {tipo} em memória')

    cliente.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _carregar_pipelines()
    _carregar_vetores_pets()
    yield


app = FastAPI(title='PetMatch ML', version='2.0.0', lifespan=lifespan)


class RequisicaoRecomendacao(BaseModel):
    respostas: dict
    vetores_curtidos: Optional[list] = None
    ids_excluidos: Optional[list] = None
    top_n: int = 20
    pular: int = 0


class ItemRecomendacao(BaseModel):
    pet_id: str
    score: int
    distancia: float


# converte categorias do questionário para faixas do treinamento
MAPA_IDADE_QUESTIONARIO = {'filhote': 'abaixo de 2 meses', 'adulto': '3 anos', 'sênior': '6 ou mais anos'}

CAMPOS_NEUTROS = {'pelagem', 'cuidados_veterinarios'}

def _respostas_para_dataframe(respostas: dict) -> pd.DataFrame:
    raw = str(respostas.get('cuidados', '')).lower().strip()
    if raw in ('tanto_faz', 'depois'):
        cuidados = ''
    else:
        cuidados = raw

    local = ''
    if respostas.get('local') == 'Apartamento':
        local = 'apartamento'
    elif respostas.get('local') == 'Casa com quintal':
        local = 'casa com quintal'

    sociavel_raw = str(respostas.get('sociavel', '')).lower().strip()
    sociavel = 'crianças, outros animais' if sociavel_raw == 'sim' else ''

    sexo_lower = str(respostas.get('sexo', '')).lower().strip()
    porte_lower = str(respostas.get('porte', '')).lower().strip()
    idade_category = str(respostas.get('idade', '')).lower().strip()
    idade_str = MAPA_IDADE_QUESTIONARIO.get(idade_category, '')

    neutralizar = set()
    if not cuidados:
        neutralizar.add('cuidados_veterinarios')
    neutralizar.add('pelagem')
    sexo_ambos = sexo_lower == 'ambos'
    if sexo_ambos:
        neutralizar.add('sexo')
    if sociavel_raw == 'nao':
        neutralizar.add('sociavel_com')

    df = pd.DataFrame([{
        'sexo': 0.5 if sexo_ambos else MAPA_SEXO.get(sexo_lower, 0.0),
        'porte': MAPA_PORTE.get(porte_lower, 0.0),
        'idade': MAPA_IDADE.get(idade_str, 0.0),
        'pelagem': '',
        'cuidados_veterinarios': cuidados,
        'vive_bem_com': local,
        'sociavel_com': sociavel,
    }])
    return df, neutralizar


def _transformar_com_neutro(pipeline, df, neutralizar: set) -> np.ndarray:
    prep = pipeline.named_steps['prep']
    scaler = pipeline.named_steps['scaler']
    pca = pipeline.named_steps['pca']

    features = prep.transform(df)
    if isinstance(features, np.matrix):
        features = np.asarray(features)
    features = features.astype(float)

    nomes = list(prep.get_feature_names_out())

    for i, nome in enumerate(nomes):
        for campo in neutralizar:
            if campo in nome:
                features[0, i] = 0.5

    scaled = scaler.transform(features)
    return pca.transform(scaled)[0]


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'pipelines': list(pipelines.keys()),
        'cache': {t: len(v) for t, v in cache_vetores_pets.items()},
    }


@app.post('/refresh')
def refresh():
    cache_vetores_pets.clear()
    _carregar_vetores_pets()
    return {'status': 'ok', 'cache': {t: len(v) for t, v in cache_vetores_pets.items()}}


class RequisicaoVectorizar(BaseModel):
    pet: dict


@app.post('/vectorize')
def vectorizar(requisicao: RequisicaoVectorizar):
    pet = requisicao.pet
    tipo = str(pet.get('tipo_animal', '')).lower().strip()

    if tipo not in pipelines:
        raise HTTPException(status_code=400, detail=f"Pipeline para '{tipo}' não carregado.")

    pipeline = pipelines[tipo]

    mapa_sexo = {'fêmea': 0.0, 'femea': 0.0, 'macho': 1.0}
    mapa_porte = {'pequeno': 0.0, 'médio': 1.0, 'medio': 1.0, 'grande': 2.0}
    mapa_idade = {
        'abaixo de 2 meses': 0.0, '2 a 6 meses': 1.0, '7 a 11 meses': 2.0,
        '1 ano': 3.0, '2 anos': 4.0, '3 anos': 5.0,
        '4 anos': 6.0, '5 anos': 7.0, '6 ou mais anos': 8.0,
    }

    sexo_valor = mapa_sexo.get(str(pet.get('sexo', '')).lower().strip())
    porte_valor = mapa_porte.get(str(pet.get('porte', '')).lower().strip())
    idade_string = str(pet.get('idade_display') or pet.get('idade', '')).lower().strip()
    idade_valor = mapa_idade.get(idade_string)

    if None in (sexo_valor, porte_valor, idade_valor):
        raise HTTPException(status_code=422, detail='Campos sexo/porte/idade ausentes ou inválidos.')

    cuidados = str(pet.get('cuidados_veterinarios', '')).lower().strip()
    if not cuidados or cuidados == 'nan':
        partes = []
        if pet.get('castrado'):
            partes.append('castrado')
        if pet.get('vacinado'):
            partes.append('vacinado')
        if pet.get('vermifugado'):
            partes.append('vermifugado')
        if pet.get('precisa_cuidados_especiais'):
            partes.append('precisa de cuidados especiais')
        cuidados = ', '.join(partes)

    vive = str(pet.get('vive_bem_com', '')).lower().strip()
    if not vive or vive == 'nan':
        partes = []
        if pet.get('aceita_apartamento'):
            partes.append('apartamento')
        if pet.get('aceita_casa_quintal'):
            partes.append('casa com quintal')
        vive = ', '.join(partes)

    sociavel = str(pet.get('sociavel_com', '')).lower().strip()
    if not sociavel or sociavel == 'nan':
        partes = []
        if pet.get('sociavel_criancas'):
            partes.append('crianças')
        if pet.get('sociavel_animais'):
            partes.append('outros animais')
        sociavel = ', '.join(partes)

    df = pd.DataFrame([{
        'sexo': sexo_valor,
        'porte': porte_valor,
        'idade': idade_valor,
        'pelagem': str(pet.get('pelagem', '')).lower().strip(),
        'cuidados_veterinarios': cuidados,
        'vive_bem_com': vive,
        'sociavel_com': sociavel,
    }])

    vetor = pipeline.transform(df)[0].tolist()
    return {'vetor_pca': vetor}


@app.post('/recommend', response_model=list[ItemRecomendacao])
def recomendar(requisicao: RequisicaoRecomendacao):
    tipo = requisicao.respostas.get('tipo', '').lower()

    if tipo not in pipelines:
        raise HTTPException(
            status_code=400,
            detail=f"Pipeline para '{tipo}' não carregado. Execute: python backend/ml/init_pipeline.py"
        )

    pipeline = pipelines[tipo]

    df_usuario, neutralizar = _respostas_para_dataframe(requisicao.respostas)
    vetor_questionario = _transformar_com_neutro(pipeline, df_usuario, neutralizar)

    FAIXAS_PESO = [
        (5,  0.00),
        (10, 0.15),
        (15, 0.30),
        (20, 0.40),
        (25, 0.50),
        (30, 0.70),
    ]
    PESO_MAX = 0.90

    if requisicao.vetores_curtidos and len(requisicao.vetores_curtidos) > 0:
        vetores_array = np.array(requisicao.vetores_curtidos, dtype=float)
        vetor_likes = vetores_array.mean(axis=0)
        if vetor_likes.shape == vetor_questionario.shape:
            n = len(requisicao.vetores_curtidos)
            peso_likes = PESO_MAX
            for limite, peso in FAIXAS_PESO:
                if n < limite:
                    peso_likes = peso
                    break
            vetor_final = (1 - peso_likes) * vetor_questionario + peso_likes * vetor_likes
        else:
            vetor_final = vetor_questionario
    else:
        vetor_final = vetor_questionario

    num_dimensoes = len(vetor_final)
    excluidos = set(requisicao.ids_excluidos or [])
    candidatos = [
        p for p in cache_vetores_pets.get(tipo, [])
        if len(p['vetor']) == num_dimensoes and p['_id'] not in excluidos
    ]

    if not candidatos:
        return []

    distancias = [
        (p['_id'], float(np.linalg.norm(vetor_final - p['vetor'])))
        for p in candidatos
    ]
    distancias.sort(key=lambda x: x[1])

    max_distancia = distancias[-1][1] if distancias else 1.0

    resultado = []
    for pet_id, dist in distancias[requisicao.pular: requisicao.pular + requisicao.top_n]:
        score = round((1.0 - dist / max_distancia) * 100) if max_distancia > 0 else 100
        resultado.append(ItemRecomendacao(
            pet_id=pet_id,
            score=score,
            distancia=round(dist, 4),
        ))

    return resultado
