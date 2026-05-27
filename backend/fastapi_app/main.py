from fastapi import FastAPI, HTTPException

from database import buscar_pets_disponiveis, buscar_todos_pets, contar_pets_disponiveis
from recomendacao import (
    recomendar_pets,
    status_modelos_pkl,
    transformar_pet_em_vetor,
    treinar_e_salvar_modelo,
)
from schemas import ItemRecomendacao, RequisicaoRecomendacao, RequisicaoVectorizar

app = FastAPI(title='PetMatch IA simples', version='3.0.0')


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'modelo': 'PCA simples carregado de arquivo .pkl',
        'pets_disponiveis': contar_pets_disponiveis(),
        'modelos_pkl': status_modelos_pkl(),
    }


@app.post('/refresh')
def refresh():
    resultados = {}
    todos_pets = buscar_todos_pets()

    for tipo in ('cachorro', 'gato'):
        pets = [pet for pet in todos_pets if pet.get('tipo_animal') == tipo]

        resultados[tipo] = treinar_e_salvar_modelo(tipo, pets)

    return {
        'status': 'ok',
        'message': 'Arquivos .pkl atualizados.',
        'total_colecao_pets': len(todos_pets),
        'modelos': resultados,
    }


@app.post('/vectorize')
def vectorizar(req: RequisicaoVectorizar):
    vetor = transformar_pet_em_vetor(req.pet)

    if vetor is None:
        raise HTTPException(422, 'Campos sexo, porte ou idade ausentes ou invalidos.')

    return {'dados_transformados': vetor}


@app.post('/recommend', response_model=list[ItemRecomendacao])
def recomendar(req: RequisicaoRecomendacao):
    tipo = str(req.respostas.get('tipo', '')).lower().strip()

    if tipo not in ('cachorro', 'gato'):
        raise HTTPException(400, "Tipo deve ser 'cachorro' ou 'gato'.")

    pets = buscar_pets_disponiveis(tipo)

    return recomendar_pets(
        respostas=req.respostas,
        pets=pets,
        ids_curtidos=req.ids_curtidos,
        ids_excluidos=req.ids_excluidos,
        quantidade=req.top_n,
        pular=req.pular,
    )
