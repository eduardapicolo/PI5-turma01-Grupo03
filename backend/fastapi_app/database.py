import os
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


# carrega o arquivo .env do backend para conseguir ler a url do mongodb
load_dotenv(Path(__file__).parent.parent / '.env')

# guarda a url do banco que vem das variaveis de ambiente
MONGO_URI = os.getenv('MONGO_URI', '')

# nome do banco usado pelo projeto no mongodb
NOME_BANCO = 'PetMatch'

# textos que indicam que o pet nao deve aparecer na recomendacao
# se o pet antigo nao tiver status, ele entra como disponivel
STATUS_BLOQUEADOS = ['Adotado', 'adotado']

# lista os campos do pet que a ia precisa ler para montar a recomendacao
# o valor 1 significa: traga esse campo na busca do mongodb
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
    # monta um regex simples para encontrar cachorro ou gato em formatos diferentes
    # isso ajuda quando alguns pets vieram de importacao com nomes de campos diferentes
    tipo = (tipo or '').lower().strip()

    if tipo == 'cachorro':
        return {'$regex': '^(cachorro|cao|cão|dog|canino)$', '$options': 'i'}

    if tipo == 'gato':
        return {'$regex': '^(gato|cat|felino)$', '$options': 'i'}

    return {'$regex': f'^{tipo}$', '$options': 'i'}


def texto_simples(valor) -> str:
    # transforma texto em minusculo e tira acentos
    # isso ajuda quando o banco tem cao, caes ou textos parecidos
    texto = str(valor or '').lower().strip()
    texto = unicodedata.normalize('NFD', texto)
    texto = ''.join(letra for letra in texto if unicodedata.category(letra) != 'Mn')
    return texto


def tipo_pet_normalizado(valor: str) -> str:
    # transforma nomes diferentes de especie em cachorro ou gato
    # isso ajuda pets cadastrados e pets importados a entrarem no mesmo treino
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
    # monta o filtro usado para buscar pets na colecao pets
    # ele pega somente cachorro ou gato, de acordo com o questionario
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
    # monta um filtro simples para tirar apenas pets adotados
    # o tipo do pet sera separado no python depois da normalizacao
    return {
        '$or': [
            {'disponibilidade': {'$nin': STATUS_BLOQUEADOS}},
            {'disponibilidade': {'$exists': False}},
            {'disponibilidade': None},
            {'disponibilidade': ''},
        ],
    }


def primeiro_valor(pet: dict, *campos):
    # procura o primeiro campo preenchido dentro do pet
    # isso deixa o codigo aceitar tanto campos novos quanto campos importados
    for campo in campos:
        valor = pet.get(campo)

        if valor not in (None, ''):
            return valor

    return ''


def normalizar_pet(pet: dict) -> dict:
    # transforma documentos antigos/importados para o formato que a ia espera
    # assim a recomendacao nao depende apenas dos pets cadastrados pelo administrador
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
    pet['imagem'] = primeiro_valor(pet, 'imagem', 'Foto')
    pet['imagem_principal'] = primeiro_valor(pet, 'imagem_principal', 'Foto', 'imagem')
    pet['url'] = primeiro_valor(pet, 'url', 'Link_adocao')
    pet['localizacao'] = localizacao
    pet['disponibilidade'] = primeiro_valor(pet, 'disponibilidade') or 'Disponível'

    return pet


def conectar_banco():
    # cria uma conexao com o mongodb usando a url configurada no .env
    cliente = MongoClient(MONGO_URI)

    # devolve o cliente e tambem o banco petmatch ja selecionado
    # o cliente e usado depois para fechar a conexao
    return cliente, cliente[NOME_BANCO]


def buscar_pets_disponiveis(tipo: str) -> list:
    # essa funcao e usada pela rota /recommend antes de calcular a recomendacao
    # ela busca todos os pets disponiveis do tipo escolhido pelo usuario
    cliente, db = conectar_banco()

    try:
        # acessa a tabela pets do mongodb e tira apenas pets adotados
        # depois o codigo normaliza cada pet e separa cachorro ou gato em python
        documentos = db['pets'].find(montar_filtro_pets_nao_adotados(), CAMPOS_PET)

        # aqui vamos montar uma lista simples de pets para usar na ia
        pets = []

        for pet in documentos:
            # normaliza o pet antes de mandar para a ia
            pet_normalizado = normalizar_pet(pet)

            if pet_normalizado.get('tipo_animal') == tipo:
                pets.append(pet_normalizado)

        return pets
    finally:
        # fecha a conexao mesmo se acontecer erro durante a busca
        cliente.close()


def buscar_todos_pets() -> list:
    # busca todos os documentos da colecao pets
    # essa funcao e usada no /refresh para treinar o pkl com a base completa
    cliente, db = conectar_banco()

    try:
        documentos = db['pets'].find({}, CAMPOS_PET)
        pets = []

        for pet in documentos:
            # normaliza campos novos e antigos antes de treinar o modelo
            pets.append(normalizar_pet(pet))

        return pets
    finally:
        # fecha a conexao depois de ler a colecao pets
        cliente.close()


def contar_pets_disponiveis() -> dict:
    # essa funcao e usada na rota /health para mostrar se existem pets no banco
    cliente, db = conectar_banco()

    try:
        # conta separadamente quantos cachorros e gatos disponiveis existem
        documentos = db['pets'].find(montar_filtro_pets_nao_adotados(), CAMPOS_PET)
        pets = [normalizar_pet(pet) for pet in documentos]

        return {
            'total_colecao_pets': db['pets'].count_documents({}),
            'cachorro': len([pet for pet in pets if pet.get('tipo_animal') == 'cachorro']),
            'gato': len([pet for pet in pets if pet.get('tipo_animal') == 'gato']),
        }
    finally:
        # fecha a conexao com o banco depois de contar os pets
        cliente.close()
