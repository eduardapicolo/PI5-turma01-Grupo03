# Aumigos

Sistema de recomendação de pets para adoção.

## Estrutura

```text
backend/
  src/          API Node/Express
  fastapi_app/  IA/recomendação com FastAPI
  docs/         documentação do projeto
  notebooks/    notebooks de estudo
  scripts/      scripts auxiliares

frontend/
  src/          aplicação React
  public/       imagens públicas
```

## Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

## Rodar o backend Node

```bash
cd backend
npm install
npm run dev
```

## Rodar a IA com FastAPI

```bash
cd backend/fastapi_app
pip install -r requirements.txt
uvicorn main:app --reload
```
