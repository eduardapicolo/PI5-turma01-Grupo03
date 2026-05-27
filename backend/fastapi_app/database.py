import os
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv(Path(__file__).parent.parent / '.env')

MONGO_URI = os.getenv('MONGO_URI', '')

NOME_BANCO = 'PetMatch'

STATUS_BLOQUEADOS = ['Adotado', 'adotado']

CAMPOS_PET = {
    '_id': 1,
    'nome': 1,
    'Nome': 1,
    'tipo_animal': 1,
    'Especie': 1,
    'especie': 1,
    'sexo': 1,
    'Sexo': 1,
    'porte': 1,
    'Porte': 1,
    'idade': 1,
    'Idade': 1,
    'idade_display': 1,
    'idade_ordinal': 1,
    'pelagem': 1,
    'Pelagem': 1,
    'raca': 1,
    'Raca': 1,
    'descricao': 1,
    'Biografia': 1,
    'imagem': 1,
    'Foto': 1,
    'url': 1,
    'Link_adocao': 1,
    'localizacao': 1,
    'Cidade': 1,
    'Estado': 1,
    'disponibilidade': 1,
    'cuidados_veterinarios': 1,
    'vive_bem_com': 1,
    'sociavel_com': 1,
    'castrado': 1,
    'vacinado': 1,
    'vermifugado': 1,
    'precisa_cuidados_especiais': 1,
    'aceita_apartamento': 1,
    'aceita_casa_quintal': 1,
    'sociavel_criancas': 1,
    'sociavel_animais': 1,
}


def regex_tipo(tipo: str) -> dict:
    tipo = (tipo or '').lower().strip()

    if tipo == 'cachorro':
        return {'$regex': '^(cachorro|cao|cão|dog|canino)$', '$options': 'i'}

    if tipo == 'gato':
        return {'$regex': '^(gato|cat|felino)$', '$options': 'i'}

    return {'$regex': f'^{tipo}$', '$options': 'i'}


def texto_simples(valor) -> str:
    texto = str(valor or '').lower().strip()
    texto = unicodedata.normalize('NFD', texto)
    texto = ''.join(letra for letra in texto if unicodedata.category(letra) != 'Mn')
    return texto


def tipo_pet_normalizado(valor: str) -> str:
    valor = texto_simples(valor)

    if valor in ('cachorros', 'caes'):
        return 'cachorro'

    if valor in ('gatos',):
        return 'gato'

    if valor in ('cachorro', 'cao', 'cão', 'dog', 'canino'):
        return 'cachorro'

    if valor in ('gato', 'cat', 'felino'):
        return 'gato'

    return valor


def montar_filtro_pets(tipo: str) -> dict:
    return {
        '$and': [
            {
                '$or': [
                    {'tipo_animal': regex_tipo(tipo)},
                    {'Especie': regex_tipo(tipo)},
                    {'especie': regex_tipo(tipo)},
                ],
            },
            {
                '$or': [
                    {'disponibilidade': {'$nin': STATUS_BLOQUEADOS}},
                    {'disponibilidade': {'$exists': False}},
                    {'disponibilidade': None},
                    {'disponibilidade': ''},
                ],
            },
        ],
    }


def montar_filtro_pets_nao_adotados() -> dict:
    return {
        '$or': [
            {'disponibilidade': {'$nin': STATUS_BLOQUEADOS}},
            {'disponibilidade': {'$exists': False}},
            {'disponibilidade': None},
            {'disponibilidade': ''},
        ],
    }


def primeiro_valor(pet: dict, *campos):
    for campo in campos:
        valor = pet.get(campo)

        if valor not in (None, ''):
            return valor

    return ''


def normalizar_pet(pet: dict) -> dict:
    cidade = primeiro_valor(pet, 'Cidade')
    estado = primeiro_valor(pet, 'Estado')
    localizacao = primeiro_valor(pet, 'localizacao')

    if not localizacao and (cidade or estado):
        localizacao = f'{cidade} - {estado}'.strip(' -')

    pet['_id'] = str(pet.get('_id'))
    pet['nome'] = primeiro_valor(pet, 'nome', 'Nome')
    pet['tipo_animal'] = tipo_pet_normalizado(primeiro_valor(pet, 'tipo_animal', 'Especie', 'especie'))
    pet['sexo'] = primeiro_valor(pet, 'sexo', 'Sexo')
    pet['porte'] = primeiro_valor(pet, 'porte', 'Porte')
    pet['idade_display'] = primeiro_valor(pet, 'idade_display', 'idade', 'Idade')
    pet['pelagem'] = primeiro_valor(pet, 'pelagem', 'Pelagem')
    pet['raca'] = primeiro_valor(pet, 'raca', 'Raca')
    pet['descricao'] = primeiro_valor(pet, 'descricao', 'Biografia')
    pet['imagem'] = primerio_valor(pet, 'imagem', 'Foto') if 'primerio_valor' not in globals() else primeiro_valor(pet, 'imagem', 'Foto')
    pet['imagem_principal'] = primeiro_valor(pet, 'imagem_principal', 'Foto', 'imagem')
    pet['url'] = primeiro_valor(pet, 'url', 'Link_adocao')
    pet['localizacao'] = localizacao
    pet['disponibilidade'] = primeiro_valor(pet, 'disponibilidade') or 'Disponível'

    return pet


def conectar_banco():
    cliente = MongoClient(MONGO_URI)
    return cliente, cliente[NOME_BANCO]


def buscar_pets_disponiveis(tipo: str) -> list:
    cliente, db = conectar_banco()

    try:
        documentos = db['pets'].find(montar_filtro_pets_nao_adotados(), CAMPOS_PET)
        pets = []

        for pet in documentos:
            pet_normalizado = normalizar_pet(pet)

            if pet_normalizado.get('tipo_animal') == tipo:
                pets.append(pet_normalizado)

        return pets
    finally:
        cliente.close()


def buscar_todos_pets() -> list:
    cliente, db = conectar_banco()

    try:
        documentos = db['pets'].find({}, CAMPOS_PET)
        pets = []

        for pet in documentos:
            pets.append(normalizar_pet(pet))

        return pets
    finally:
        cliente.close()


def contar_pets_disponiveis() -> dict:
    cliente, db = conectar_banco()

    try:
        documentos = db['pets'].find(montar_filtro_pets_nao_adotados(), CAMPOS_PET)
        pets = [normalizar_pet(pet) for pet in documentos]

        return {
            'total_colecao_pets': db['pets'].count_documents({}),
            'cachorro': len([pet for pet in pets if pet.get('tipo_animal') == 'cachorro']),
            'gato': len([pet for pet in pets if pet.get('tipo_animal') == 'gato']),
        }
    finally:
        cliente.close()