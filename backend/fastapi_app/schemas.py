from typing import Optional

from pydantic import BaseModel

class RequisicaoRecomendacao(BaseModel):
    respostas: dict

    ids_curtidos: Optional[list] = None
    ids_excluidos: Optional[list] = None

    top_n: int = 20

    pular: int = 0


class ItemRecomendacao(BaseModel):
    pet_id: str

    distancia: float


class RequisicaoVectorizar(BaseModel):
    pet: dict
