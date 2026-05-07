import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml import carregar_modelos, recomendar, cold_start

ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Carregando modelos...")
    app.state.modelos = carregar_modelos()
    logger.info("Pronto ✅")
    yield

app = FastAPI(title="PetMatch API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token ausente")

    token = authorization.split(" ", 1)[1]

    async with httpx.AsyncClient() as c:
        r = await c.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )

    if r.status_code != 200:
        raise HTTPException(401, "Token inválido")

    return r.json()

class PrefsRequest(BaseModel):
    tipo: str
    porte: Optional[str] = "indiferente"
    idade: Optional[str] = "indiferente"
    moradia: Optional[str] = "ambos"
    criancas: Optional[bool] = False
    outros_pets: Optional[List[str]] = []
    n: Optional[int] = 15

@app.get("/health")
def health(req: Request):
    return {"status": "ok", "modelos": len(req.app.state.modelos)}

@app.get("/api/cold-start/{tipo}")
async def route_cold_start(tipo: str, req: Request, user=Depends(get_user)):
    if tipo not in ("cachorro", "gato"):
        raise HTTPException(400, "tipo deve ser 'cachorro' ou 'gato'")
    return cold_start(tipo, req.app.state.modelos)

@app.post("/api/recommend")
async def route_recommend(body: PrefsRequest, req: Request, user=Depends(get_user)):
    if body.tipo not in ("cachorro", "gato"):
        raise HTTPException(400, "tipo deve ser 'cachorro' ou 'gato'")

    prefs = body.model_dump(exclude={"tipo", "n"})
    return recomendar(body.tipo, prefs, req.app.state.modelos, body.n)