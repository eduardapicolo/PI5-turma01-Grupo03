from typing import Optional

from pydantic import BaseModel


# esse arquivo guarda os formatos de dados que entram e saem da api fastapi
# ele ajuda a api a saber quais campos esperar em cada rota


class RequisicaoRecomendacao(BaseModel):
    # respostas vem do questionario do frontend
    respostas: dict

    # ids_curtidos sao os pets que o usuario ja curtiu
    # eles ajudam a ajustar o vetor final do usuario
    ids_curtidos: Optional[list] = None

    # ids_excluidos sao pets que nao devem voltar na recomendacao
    # normalmente sao pets que o usuario ja curtiu ou que ja apareceram
    ids_excluidos: Optional[list] = None

    # top_n define quantos pets a api deve devolver
    top_n: int = 20

    # pular e usado para paginacao
    # exemplo: se ja mostrou 5 pets, a proxima chamada pode pular 5
    pular: int = 0


class ItemRecomendacao(BaseModel):
    # id do pet recomendado
    pet_id: str

    # distancia entre o vetor do usuario e o vetor do pet
    # quanto menor a distancia, mais parecido o pet e com o perfil do usuario
    distancia: float


class RequisicaoVectorizar(BaseModel):
    # pet usado na rota /vectorize para testar a transformacao de um pet
    pet: dict
