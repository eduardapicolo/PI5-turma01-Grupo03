import pickle
import random
import re
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler

from schemas import ItemRecomendacao


PASTA_MODELOS = Path(__file__).parent / 'models'

VERSAO_MODELO = 2

MAPA_SEXO = {
    'femea': 0.0,
    'f': 0.0,
    'female': 0.0,
    'macho': 1.0,
    'm': 1.0,
    'male': 1.0,
}

MAPA_PORTE = {
    'pequeno': 0.0,
    'medio': 1.0,
    'grande': 2.0,
    'p': 0.0,
    'm': 1.0,
    'g': 2.0,
}

MAPA_IDADE = {
    'abaixo de 2 meses': 0.0,
    '2 a 6 meses': 1.0,
    '7 a 11 meses': 2.0,
    '1 ano': 3.0,
    '2 anos': 4.0,
    '3 anos': 5.0,
    '4 anos': 6.0,
    '5 anos': 7.0,
    '6 ou mais anos': 8.0,
}

MAPA_IDADE_USUARIO = {
    'filhote': 'abaixo de 2 meses',
    'adulto': '3 anos',
    'senior': '6 ou mais anos',
}

PESOS_LIKES = [
    (5, 0.00),
    (10, 0.15),
    (15, 0.30),
    (20, 0.40),
    (25, 0.50),
    (30, 0.70),
]


def caminho_modelo(tipo: str) -> Path:
    tipo_limpo = texto(tipo) or 'geral'
    return PASTA_MODELOS / f'modelo_{tipo_limpo}.pkl'


def status_modelos_pkl() -> dict:
    return {
        'pasta': str(PASTA_MODELOS),
        'cachorro': {
            'existe': caminho_modelo('cachorro').exists(),
            'arquivo': str(caminho_modelo('cachorro')),
        },
        'gato': {
            'existe': caminho_modelo('gato').exists(),
            'arquivo': str(caminho_modelo('gato')),
        },
    }


def texto(valor) -> str:
    texto_original = str(valor or '').lower().strip()
    return unicodedata.normalize('NFKD', texto_original).encode('ascii', 'ignore').decode('ascii')


def separar_lista(valor) -> list:
    partes = texto(valor).replace(';', ',').split(',')
    return [parte.strip() for parte in partes if parte.strip() and parte.strip() != 'nan']


def juntar_por_booleanos(pet: dict, campo_texto: str, campos_booleanos: dict) -> str:
    valores = separar_lista(pet.get(campo_texto))

    if valores:
        return ', '.join(valores)

    marcados = []

    for campo, nome in campos_booleanos.items():
        if pet.get(campo):
            marcados.append(nome)

    return ', '.join(marcados)


def transformar_pet_em_vetor(pet: dict):
    sexo = MAPA_SEXO.get(texto(pet.get('sexo')))
    porte = MAPA_PORTE.get(texto(pet.get('porte')))
    idade = pegar_idade_pet(pet)

    if None in (sexo, porte, idade):
        return None

    return {
        '_id': str(pet.get('_id')),
        'sexo': sexo,
        'porte': porte,
        'idade': idade,
        'pelagem': texto(pet.get('pelagem')),
        'cuidados_veterinarios': juntar_por_booleanos(pet, 'cuidados_veterinarios', {
            'castrado': 'castrado',
            'vacinado': 'vacinado',
            'vermifugado': 'vermifugado',
            'precisa_cuidados_especiais': 'precisa de cuidados especiais',
        }),
        'vive_bem_com': juntar_por_booleanos(pet, 'vive_bem_com', {
            'aceita_apartamento': 'apartamento',
            'aceita_casa_quintal': 'casa com quintal',
        }),
        'sociavel_com': juntar_por_booleanos(pet, 'sociavel_com', {
            'sociavel_criancas': 'crianças',
            'sociavel_animais': 'outros animais',
        }),
    }


def pegar_idade_pet(pet: dict):
    idade_texto = texto(pet.get('idade_display') or pet.get('idade'))

    if idade_texto in MAPA_IDADE:
        return MAPA_IDADE[idade_texto]

    idade_calculada = idade_livre_para_numero(idade_texto)

    if idade_calculada is not None:
        return idade_calculada

    idade_ordinal = pet.get('idade_ordinal')

    if idade_ordinal is None:
        return None

    return float(idade_ordinal)


def idade_livre_para_numero(idade_texto: str):
    if not idade_texto:
        return None

    if 'filhote' in idade_texto:
        return 0.0

    if 'adulto' in idade_texto:
        return 5.0

    if 'senior' in idade_texto:
        return 8.0

    anos = re.search(r'(\d+)\s*ano', idade_texto)

    if anos:
        total_anos = int(anos.group(1))

        if total_anos <= 1:
            return 3.0

        if total_anos == 2:
            return 4.0

        if total_anos == 3:
            return 5.0

        if total_anos == 4:
            return 6.0

        if total_anos == 5:
            return 7.0

        return 8.0

    meses = re.search(r'(\d+)\s*mes', idade_texto)

    if meses:
        total_meses = int(meses.group(1))

        if total_meses < 2:
            return 0.0

        if total_meses <= 6:
            return 1.0

        return 2.0

    return None


def transformar_pets_em_tabela(pets: list) -> pd.DataFrame:
    linhas = []

    for pet in pets:
        linha = transformar_pet_em_vetor(pet)

        if linha is not None:
            linhas.append(linha)

    if not linhas:
        return pd.DataFrame()

    tabela = pd.DataFrame(linhas)

    tabela_pelagem = criar_colunas_de_texto(tabela, 'pelagem', 'pelagem')
    tabela_cuidados = criar_colunas_de_texto(tabela, 'cuidados_veterinarios', 'cuidados')
    tabela_vive = criar_colunas_de_texto(tabela, 'vive_bem_com', 'vive')
    tabela_sociavel = criar_colunas_de_texto(tabela, 'sociavel_com', 'sociavel')

    tabela_final = pd.concat([
        tabela[['_id', 'sexo', 'porte', 'idade']],
        tabela_pelagem,
        tabela_cuidados,
        tabela_vive,
        tabela_sociavel,
    ], axis=1)

    return tabela_final.fillna(0)


def criar_colunas_de_texto(tabela: pd.DataFrame, coluna: str, prefixo: str) -> pd.DataFrame:
    dummies = tabela[coluna].fillna('').astype(str).str.get_dummies(sep=', ')

    colunas_validas = [coluna for coluna in dummies.columns if coluna and coluna != 'nan']
    dummies = dummies[colunas_validas]

    dummies.columns = [f'{prefixo}_{coluna}' for coluna in dummies.columns]
    return dummies


def treinar_modelo_pca(tabela_pets: pd.DataFrame) -> dict:
    dados = tabela_pets.drop(columns=['_id']).fillna(0)
    colunas = list(dados.columns)

    normalizador = MinMaxScaler()
    dados_normalizados = normalizador.fit_transform(dados)

    pca = None

    if len(dados) > 1 and len(colunas) > 1:
        pca = PCA(n_components=0.9)
        pca.fit(dados_normalizados)

    return {
        'versao': VERSAO_MODELO,
        'colunas': colunas,
        'normalizador': normalizador,
        'pca': pca,
    }


def salvar_modelo_pkl(tipo: str, modelo: dict):
    PASTA_MODELOS.mkdir(parents=True, exist_ok=True)

    with caminho_modelo(tipo).open('wb') as arquivo:
        pickle.dump(modelo, arquivo)


def carregar_modelo_pkl(tipo: str):
    caminho = caminho_modelo(tipo)

    if not caminho.exists():
        return None

    try:
        with caminho.open('rb') as arquivo:
            modelo = pickle.load(arquivo)
    except Exception:
        return None

    if not modelo_valido(modelo):
        return None

    return modelo


def modelo_valido(modelo) -> bool:
    if not isinstance(modelo, dict):
        return False

    return (
        modelo.get('versao') == VERSAO_MODELO
        and isinstance(modelo.get('colunas'), list)
        and modelo.get('normalizador') is not None
    )


def carregar_ou_treinar_modelo(tipo: str, tabela_pets: pd.DataFrame) -> dict:
    modelo = carregar_modelo_pkl(tipo)

    if modelo is not None:
        return modelo

    modelo = treinar_modelo_pca(tabela_pets)

    salvar_modelo_pkl(tipo, modelo)
    return modelo


def alinhare_tabela_com_modelo(tabela_pets: pd.DataFrame, colunas: list) -> pd.DataFrame:
    if 'alinhar_tabela_com_modelo' in globals():
        return alinhar_tabela_com_modelo(tabela_pets, colunas)
    dados = tabela_pets.drop(columns=['_id']).copy()

    for coluna in colunas:
        if coluna not in dados.columns:
            dados[coluna] = 0.0

    return dados[colunas].fillna(0)


def alinhar_tabela_com_modelo(tabela_pets: pd.DataFrame, colunas: list) -> pd.DataFrame:
    dados = tabela_pets.drop(columns=['_id']).copy()

    for coluna in colunas:
        if coluna not in dados.columns:
            dados[coluna] = 0.0

    return dados[colunas].fillna(0)


def aplicar_modelo_nos_pets(tabela_pets: pd.DataFrame, modelo: dict) -> list:
    ids = tabela_pets['_id'].astype(str).tolist()
    colunas = modelo['colunas']
    normalizador = modelo['normalizador']
    pca = modelo.get('pca')

    dados = alinhar_tabela_com_modelo(tabela_pets, colunas)
    dados_normalizados = normalizador.transform(dados)

    if pca is None:
        dados_finais = dados_normalizados
    else:
        dados_finais = pca.transform(dados_normalizados)

    pets_com_vetor = []

    for indice, pet_id in enumerate(ids):
        pets_com_vetor.append({
            'pet_id': pet_id,
            'vetor': dados_finais[indice],
        })

    return pets_com_vetor


def aplicar_pca_nos_pets(tabela_pets: pd.DataFrame, tipo: str):
    modelo = carregar_ou_treinar_modelo(tipo, tabela_pets)

    pets_com_vetor = aplicar_modelo_nos_pets(tabela_pets, modelo)

    return pets_com_vetor, modelo['colunas'], modelo['normalizador'], modelo.get('pca')


def treinar_e_salvar_modelo(tipo: str, pets: list) -> dict:
    total_buscados = len(pets)
    tabela_pets = transformar_pets_em_tabela(pets)

    if tabela_pets.empty:
        return {
            'status': 'sem_pets',
            'arquivo': str(caminho_modelo(tipo)),
            'total_pets_buscados': total_buscados,
            'total_colunas': 0,
        }

    modelo = treinar_modelo_pca(tabela_pets)
    salvar_modelo_pkl(tipo, modelo)

    pca = modelo.get('pca')

    if pca is None:
        total_componentes = len(modelo['colunas'])
    else:
        total_componentes = int(pca.n_components_)

    return {
        'status': 'ok',
        'arquivo': str(caminho_modelo(tipo)),
        'total_pets_buscados': total_buscados,
        'total_pets_treinados': int(len(tabela_pets)),
        'total_colunas': int(len(modelo['colunas'])),
        'total_componentes_pca': total_componentes,
    }


def transformar_usuario_em_vetor(respostas: dict, colunas: list, normalizador, pca):
    linha = {coluna: 0.0 for coluna in colunas}

    sexo = texto(respostas.get('sexo'))
    porte = texto(respostas.get('porte'))
    idade = texto(respostas.get('idade'))
    local = respostas.get('local')
    cuidados = texto(respostas.get('cuidados'))
    sociavel = texto(respostas.get('sociavel'))

    linha['sexo'] = 0.5 if sexo == 'ambos' else MAPA_SEXO.get(sexo, 0.0)
    linha['porte'] = MAPA_PORTE.get(porte, 0.0)
    linha['idade'] = idade_usuario_para_numero(idade)

    marcar_opcao(linha, 'vive', texto(local))

    if cuidados and cuidados not in ('tanto_faz', 'depois'):
        for cuidado in separar_lista(cuidados):
            marcar_opcao(linha, 'cuidados', cuidado)
    else:
        deixar_colunas_neutras(linha, 'cuidados')

    if sociavel == 'sim':
        marcar_opcao(linha, 'sociavel', 'crianças')
        marcar_opcao(linha, 'sociavel', 'outros animais')
    else:
        deixar_colunas_neutras(linha, 'sociavel')

    deixar_colunas_neutras(linha, 'pelagem')

    tabela_usuario = pd.DataFrame([linha], columns=colunas)
    usuario_normalizado = normalizador.transform(tabela_usuario)

    if pca is None:
        return usuario_normalizado[0]

    return pca.transform(usuario_normalizado)[0]


def idade_usuario_para_numero(idade: str) -> float:
    idade_do_pet = MAPA_IDADE_USUARIO.get(idade, '')
    return MAPA_IDADE.get(idade_do_pet, 0.0)


def marcar_opcao(linha: dict, prefixo: str, opcao: str):
    opcao = texto(opcao)
    coluna = f'{prefixo}_{opcao}'

    if coluna in linha:
        linha[coluna] = 1.0


def deixar_colunas_neutras(linha: dict, prefixo: str):
    inicio = f'{prefixo}_'

    for coluna in linha:
        if coluna.startswith(inicio):
            linha[coluna] = 0.5


def calcular_distancia(vetor_usuario, vetor_pet) -> float:
    return float(np.linalg.norm(vetor_usuario - vetor_pet))


def calcular_peso_likes(total_likes: int) -> float:
    for limite, peso in PESOS_LIKES:
        if total_likes < limite:
            return peso

    return 0.9


def misturar_com_likes(vetor_usuario, pets_com_vetor: list, ids_curtidos: list):
    ids = {str(pet_id) for pet_id in (ids_curtidos or [])}
    vetores_curtidos = []

    for pet in pets_com_vetor:
        if pet['pet_id'] in ids:
            vetores_curtidos.append(pet['vetor'])

    if not vetores_curtidos:
        return vetor_usuario

    vetor_likes = np.array(vetores_curtidos, dtype=float).mean(axis=0)

    peso = calcular_peso_likes(len(vetores_curtidos))
    return (1 - peso) * vetor_usuario + peso * vetor_likes


def recomendar_pets(
    respostas: dict,
    pets: list,
    ids_curtidos: list | None = None,
    ids_excluidos: list | None = None,
    quantidade: int = 20,
    pular: int = 0,
) -> list:
    tabela_pets = transformar_pets_em_tabela(pets)

    if tabela_pets.empty:
        return []

    tipo = texto(respostas.get('tipo'))

    pets_com_vetor, colunas, normalizador, pca = aplicar_pca_nos_pets(tabela_pets, tipo)

    vetor_usuario = transformar_usuario_em_vetor(respostas, colunas, normalizador, pca)

    vetor_usuario = misturar_com_likes(vetor_usuario, pets_com_vetor, ids_curtidos or [])

    ids_bloqueados = {str(pet_id) for pet_id in (ids_excluidos or [])}
    pets_com_distancia = []

    for pet in pets_com_vetor:
        if pet['pet_id'] in ids_bloqueados:
            continue

        distancia = calcular_distancia(vetor_usuario, pet['vetor'])

        pets_com_distancia.append({
            'pet_id': pet['pet_id'],
            'distancia': distancia,
        })

    pets_ordenados = sorted(pets_com_distancia, key=lambda item: item['distancia'])

    recomendacoes = adicionar_recomendacao_exploratoria(pets_ordenados)

    pagina = recomendacoes[pular:pular + quantidade]

    return [
        ItemRecomendacao(
            pet_id=item['pet_id'],
            distancia=round(item['distancia'], 4),
        )
        for item in pagina
    ]


def adicionar_recomendacao_exploratoria(recomendacoes: list) -> list:
    resultado = []
    pets_usados = set()
    indice = 0

    while indice < len(recomendacoes):
        total_parecidos = 0

        while indice < len(recomendacoes) and total_parecidos < 8:
            pet = recomendacoes[indice]
            indice += 1

            if pet['pet_id'] in pets_usados:
                continue

            resultado.append(pet)
            pets_usados.add(pet['pet_id'])
            total_parecidos += 1

        total_exploratorios = 0

        while total_exploratorios < 2:
            pet_exploratorio = escolher_pet_exploratorio_longe(recomendacoes, pets_usados)

            if pet_exploratorio is None:
                break

            resultado.append(pet_exploratorio)
            pets_usados.add(pet_exploratorio['pet_id'])
            total_exploratorios += 1

    return resultado


def escolher_pet_exploratorio_longe(todos_pets: list, pets_usados: set):
    for pet in reversed(todos_pets):
        if pet['pet_id'] not in pets_usados:
            return pet

    return None