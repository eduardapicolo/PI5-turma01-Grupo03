from fastapi import FastAPI, HTTPException

from database import buscar_pets_disponiveis, buscar_todos_pets, contar_pets_disponiveis
from recomendacao import (
    recomendar_pets,
    status_modelos_pkl,
    transformar_pet_em_vetor,
    treinar_e_salvar_modelo,
)
from schemas import ItemRecomendacao, RequisicaoRecomendacao, RequisicaoVectorizar


# cria a aplicacao fastapi
# esse objeto app e o que o uvicorn usa para colocar a api no ar
app = FastAPI(title='PetMatch IA simples', version='3.0.0')


@app.get('/health')
def health():
    # rota simples para testar se a api de ia esta funcionando
    # tambem mostra quantos pets disponiveis existem no banco
    return {
        'status': 'ok',
        'modelo': 'PCA simples carregado de arquivo .pkl',
        'pets_disponiveis': contar_pets_disponiveis(),
        'modelos_pkl': status_modelos_pkl(),
    }


@app.post('/refresh')
def refresh():
    # essa rota recria os arquivos pkl usando os pets atuais do banco
    # use quando cadastrar muitos pets novos ou mudar caracteristicas importantes
    resultados = {}
    todos_pets = buscar_todos_pets()

    for tipo in ('cachorro', 'gato'):
        # separa os pets por tipo depois de ler a colecao inteira
        pets = [pet for pet in todos_pets if pet.get('tipo_animal') == tipo]

        # treina e salva o pkl daquele tipo
        resultados[tipo] = treinar_e_salvar_modelo(tipo, pets)

    return {
        'status': 'ok',
        'message': 'Arquivos .pkl atualizados.',
        'total_colecao_pets': len(todos_pets),
        'modelos': resultados,
    }


@app.post('/vectorize')
def vectorizar(req: RequisicaoVectorizar):
    # essa rota recebe um pet e mostra como ele fica depois da transformacao inicial
    # ela ajuda a testar a logica, mas a recomendacao principal usa a rota /recommend
    vetor = transformar_pet_em_vetor(req.pet)

    if vetor is None:
        # se sexo, porte ou idade estiverem errados, o pet nao pode virar vetor
        raise HTTPException(422, 'Campos sexo, porte ou idade ausentes ou invalidos.')

    return {'dados_transformados': vetor}


@app.post('/recommend', response_model=list[ItemRecomendacao])
def recomendar(req: RequisicaoRecomendacao):
    # pega o tipo escolhido no questionario
    # a recomendacao so trabalha com cachorro ou gato
    tipo = str(req.respostas.get('tipo', '')).lower().strip()

    if tipo not in ('cachorro', 'gato'):
        # se vier outro tipo, a api responde erro para evitar recomendacao errada
        raise HTTPException(400, "Tipo deve ser 'cachorro' ou 'gato'.")

    # busca no mongodb os pets disponiveis daquele tipo
    pets = buscar_pets_disponiveis(tipo)

    # chama a funcao principal da ia
    # ela transforma os dados em tabela, aplica pca, calcula distancia e retorna ids
    return recomendar_pets(
        respostas=req.respostas,
        pets=pets,
        ids_curtidos=req.ids_curtidos,
        ids_excluidos=req.ids_excluidos,
        quantidade=req.top_n,
        pular=req.pular,
    )
