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


# esse arquivo tem a logica principal da recomendacao
# ele foi escrito parecido com um notebook: primeiro prepara dados, depois aplica pca, depois calcula distancia

# pasta onde os modelos pkl ficam salvos
# cada tipo de pet tem um arquivo separado para ficar mais facil de entender
PASTA_MODELOS = Path(__file__).parent / 'models'

# versao simples para saber se o pkl foi criado por esta versao do codigo
# quando esse numero muda, a api ignora o pkl antigo e treina outro
VERSAO_MODELO = 2

# transforma o texto do sexo em numero
# femea fica perto de 0 e macho fica perto de 1
MAPA_SEXO = {
    'femea': 0.0,
    'f': 0.0,
    'female': 0.0,
    'macho': 1.0,
    'm': 1.0,
    'male': 1.0,
}

# transforma o texto do porte em numero
# pequeno, medio e grande viram valores em ordem crescente
MAPA_PORTE = {
    'pequeno': 0.0,
    'medio': 1.0,
    'grande': 2.0,
    'p': 0.0,
    'm': 1.0,
    'g': 2.0,
}

# transforma o texto da idade do banco em numero
# idades menores recebem numeros menores
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

# transforma a resposta simples do usuario em uma idade parecida com a idade dos pets
# isso e usado porque o questionario pergunta filhote, adulto ou senior
MAPA_IDADE_USUARIO = {
    'filhote': 'abaixo de 2 meses',
    'adulto': '3 anos',
    'senior': '6 ou mais anos',
}

# define quanto os likes do usuario influenciam a recomendacao
# quanto mais likes o usuario tiver, maior pode ser o peso dos likes
PESOS_LIKES = [
    (5, 0.00),
    (10, 0.15),
    (15, 0.30),
    (20, 0.40),
    (25, 0.50),
    (30, 0.70),
]


def caminho_modelo(tipo: str) -> Path:
    # monta o caminho do arquivo pkl usando o tipo do animal
    # exemplo: cachorro vira modelo_cachorro.pkl
    tipo_limpo = texto(tipo) or 'geral'
    return PASTA_MODELOS / f'modelo_{tipo_limpo}.pkl'


def status_modelos_pkl() -> dict:
    # mostra se os arquivos pkl principais existem e onde eles ficam
    # essa funcao e usada pela rota /health
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
    # transforma qualquer valor em texto minusculo sem espacos nas pontas
    # isso evita erro quando o banco vem com letra maiuscula ou valor vazio
    texto_original = str(valor or '').lower().strip()
    return unicodedata.normalize('NFKD', texto_original).encode('ascii', 'ignore').decode('ascii')


def separar_lista(valor) -> list:
    # alguns campos vem como texto separado por virgula
    # exemplo: "castrado, vacinado"
    # essa funcao transforma esse texto em uma lista de palavras
    partes = texto(valor).replace(';', ',').split(',')
    return [parte.strip() for parte in partes if parte.strip() and parte.strip() != 'nan']


def juntar_por_booleanos(pet: dict, campo_texto: str, campos_booleanos: dict) -> str:
    # primeiro tenta usar o campo de texto que ja existe no banco
    # se ele estiver vazio, monta o texto usando campos booleanos true ou false
    valores = separar_lista(pet.get(campo_texto))

    if valores:
        # se ja existe texto no banco, usa esse texto
        return ', '.join(valores)

    marcados = []

    for campo, nome in campos_booleanos.items():
        # se o campo booleano for verdadeiro, adiciona o nome na lista
        if pet.get(campo):
            marcados.append(nome)

    # devolve os nomes juntos em um texto separado por virgula
    return ', '.join(marcados)


def transformar_pet_em_vetor(pet: dict):
    # transforma um pet do banco em um dicionario simples
    # esse dicionario depois vira uma linha da tabela usada no pca
    sexo = MAPA_SEXO.get(texto(pet.get('sexo')))
    porte = MAPA_PORTE.get(texto(pet.get('porte')))
    idade = pegar_idade_pet(pet)

    if None in (sexo, porte, idade):
        # se faltar sexo, porte ou idade, esse pet nao entra na recomendacao
        return None

    return {
        # guarda o id para saber qual pet aquela linha representa
        '_id': str(pet.get('_id')),

        # campos numericos principais usados na comparacao
        'sexo': sexo,
        'porte': porte,
        'idade': idade,

        # campos de texto que depois vao virar colunas 0 ou 1
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
    # tenta pegar a idade escrita, como "3 anos" ou "6 ou mais anos"
    idade_texto = texto(pet.get('idade_display') or pet.get('idade'))

    if idade_texto in MAPA_IDADE:
        # se encontrou no mapa, devolve o numero correspondente
        return MAPA_IDADE[idade_texto]

    idade_calculada = idade_livre_para_numero(idade_texto)

    if idade_calculada is not None:
        # se a idade veio de importacao, tenta converter mesmo assim
        return idade_calculada

    # se nao tiver texto conhecido, tenta usar a idade ordinal salva no banco
    idade_ordinal = pet.get('idade_ordinal')

    if idade_ordinal is None:
        # sem idade nao da para comparar corretamente
        return None

    return float(idade_ordinal)


def idade_livre_para_numero(idade_texto: str):
    # converte idades importadas, como "1 ano(s) e 3 mes(es)"
    # o retorno usa a mesma escala simples do mapa de idades
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
    # transforma todos os pets em uma tabela do pandas
    # essa tabela e parecida com a tabela criada no notebook
    linhas = []

    for pet in pets:
        # cada pet vira uma linha simples
        linha = transformar_pet_em_vetor(pet)

        if linha is not None:
            # so entra na tabela se os dados principais estiverem validos
            linhas.append(linha)

    if not linhas:
        # se nenhum pet for valido, devolve tabela vazia
        return pd.DataFrame()

    # cria uma tabela com as linhas de pets
    tabela = pd.DataFrame(linhas)

    # cria colunas 0 e 1 para cada texto encontrado
    # isso e parecido com str.get_dummies usado no notebook
    tabela_pelagem = criar_colunas_de_texto(tabela, 'pelagem', 'pelagem')
    tabela_cuidados = criar_colunas_de_texto(tabela, 'cuidados_veterinarios', 'cuidados')
    tabela_vive = criar_colunas_de_texto(tabela, 'vive_bem_com', 'vive')
    tabela_sociavel = criar_colunas_de_texto(tabela, 'sociavel_com', 'sociavel')

    # junta colunas numericas com colunas de texto transformadas em 0 e 1
    tabela_final = pd.concat([
        tabela[['_id', 'sexo', 'porte', 'idade']],
        tabela_pelagem,
        tabela_cuidados,
        tabela_vive,
        tabela_sociavel,
    ], axis=1)

    # troca valores vazios por 0 para evitar erro na normalizacao e no pca
    return tabela_final.fillna(0)


def criar_colunas_de_texto(tabela: pd.DataFrame, coluna: str, prefixo: str) -> pd.DataFrame:
    # cria varias colunas a partir de um campo de texto
    # exemplo: "castrado, vacinado" vira cuidados_castrado=1 e cuidados_vacinado=1
    dummies = tabela[coluna].fillna('').astype(str).str.get_dummies(sep=', ')

    # remove colunas vazias ou invalidas
    colunas_validas = [coluna for coluna in dummies.columns if coluna and coluna != 'nan']
    dummies = dummies[colunas_validas]

    # coloca prefixo para ficar claro de onde veio cada coluna
    dummies.columns = [f'{prefixo}_{coluna}' for coluna in dummies.columns]
    return dummies


def treinar_modelo_pca(tabela_pets: pd.DataFrame) -> dict:
    # cria um modelo simples com colunas, normalizador e pca
    # esse modelo depois pode ser salvo em pkl e reutilizado pela api
    dados = tabela_pets.drop(columns=['_id']).fillna(0)
    colunas = list(dados.columns)

    # o normalizador aprende os menores e maiores valores de cada coluna
    # depois ele consegue transformar pets e usuario na mesma escala
    normalizador = MinMaxScaler()
    dados_normalizados = normalizador.fit_transform(dados)

    # pca comeca vazio porque nem sempre existe dado suficiente para usar pca
    pca = None

    if len(dados) > 1 and len(colunas) > 1:
        # aplica pca igual no notebook
        # n_components=0.9 significa manter 90 por cento da variacao dos dados
        pca = PCA(n_components=0.9)
        pca.fit(dados_normalizados)

    return {
        'versao': VERSAO_MODELO,
        'colunas': colunas,
        'normalizador': normalizador,
        'pca': pca,
    }


def salvar_modelo_pkl(tipo: str, modelo: dict):
    # cria a pasta models se ela ainda nao existir
    PASTA_MODELOS.mkdir(parents=True, exist_ok=True)

    # salva o modelo em um arquivo pkl simples
    # pickle e uma biblioteca padrao do python para salvar objetos em arquivo
    with caminho_modelo(tipo).open('wb') as arquivo:
        pickle.dump(modelo, arquivo)


def carregar_modelo_pkl(tipo: str):
    # tenta carregar o pkl do tipo escolhido
    caminho = caminho_modelo(tipo)

    if not caminho.exists():
        # se o arquivo ainda nao existe, a api vai treinar um novo
        return None

    try:
        with caminho.open('rb') as arquivo:
            modelo = pickle.load(arquivo)
    except Exception:
        # se o pkl estiver quebrado, a api ignora e cria outro
        return None

    if not modelo_valido(modelo):
        # se o arquivo nao tem o formato esperado, cria outro
        return None

    return modelo


def modelo_valido(modelo) -> bool:
    # confere se o pkl tem as informacoes minimas que a recomendacao precisa
    if not isinstance(modelo, dict):
        return False

    return (
        modelo.get('versao') == VERSAO_MODELO
        and isinstance(modelo.get('colunas'), list)
        and modelo.get('normalizador') is not None
    )


def carregar_ou_treinar_modelo(tipo: str, tabela_pets: pd.DataFrame) -> dict:
    # primeiro tenta usar o pkl ja salvo
    modelo = carregar_modelo_pkl(tipo)

    if modelo is not None:
        return modelo

    # se nao existe pkl, treina um modelo simples com os pets atuais
    modelo = treinar_modelo_pca(tabela_pets)

    # salva o modelo para a proxima recomendacao nao precisar treinar de novo
    salvar_modelo_pkl(tipo, modelo)
    return modelo


def alinhar_tabela_com_modelo(tabela_pets: pd.DataFrame, colunas: list) -> pd.DataFrame:
    # separa apenas as colunas numericas porque _id nao entra no calculo
    dados = tabela_pets.drop(columns=['_id']).copy()

    # se o pkl espera uma coluna que nao existe nos pets atuais, cria com zero
    for coluna in colunas:
        if coluna not in dados.columns:
            dados[coluna] = 0.0

    # se os pets atuais tiverem colunas novas, elas so entram depois de treinar de novo
    # isso deixa o pkl estavel e evita erro de quantidade de colunas
    return dados[colunas].fillna(0)


def aplicar_modelo_nos_pets(tabela_pets: pd.DataFrame, modelo: dict) -> list:
    # transforma todos os pets usando o normalizador e o pca que vieram do pkl
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
        # junta o id do pet com o vetor final calculado para ele
        pets_com_vetor.append({
            'pet_id': pet_id,
            'vetor': dados_finais[indice],
        })

    return pets_com_vetor


def aplicar_pca_nos_pets(tabela_pets: pd.DataFrame, tipo: str):
    # carrega o modelo pkl ou cria um novo se ainda nao existir
    modelo = carregar_ou_treinar_modelo(tipo, tabela_pets)

    # aplica o modelo salvo nos pets atuais
    pets_com_vetor = aplicar_modelo_nos_pets(tabela_pets, modelo)

    return pets_com_vetor, modelo['colunas'], modelo['normalizador'], modelo.get('pca')


def treinar_e_salvar_modelo(tipo: str, pets: list) -> dict:
    # essa funcao e chamada pela rota /refresh
    # ela recria o pkl usando os pets atuais do banco
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
    # cria uma linha vazia para o usuario com as mesmas colunas dos pets
    # isso e importante porque usuario e pet precisam ter vetores do mesmo tamanho
    linha = {coluna: 0.0 for coluna in colunas}

    # pega as respostas do questionario
    sexo = texto(respostas.get('sexo'))
    porte = texto(respostas.get('porte'))
    idade = texto(respostas.get('idade'))
    local = respostas.get('local')
    cuidados = texto(respostas.get('cuidados'))
    sociavel = texto(respostas.get('sociavel'))

    # transforma respostas principais em numeros
    # se o usuario aceitar ambos os sexos, coloca 0.5 para ficar no meio
    linha['sexo'] = 0.5 if sexo == 'ambos' else MAPA_SEXO.get(sexo, 0.0)
    linha['porte'] = MAPA_PORTE.get(porte, 0.0)
    linha['idade'] = idade_usuario_para_numero(idade)

    # marca o tipo de moradia escolhido se essa coluna existir na tabela
    marcar_opcao(linha, 'vive', texto(local))

    if cuidados and cuidados not in ('tanto_faz', 'depois'):
        # marca os cuidados escolhidos pelo usuario
        for cuidado in separar_lista(cuidados):
            marcar_opcao(linha, 'cuidados', cuidado)
    else:
        # se tanto faz, deixa essas colunas neutras para nao pesar contra nenhum pet
        deixar_colunas_neutras(linha, 'cuidados')

    if sociavel == 'sim':
        # se o usuario tem criancas ou animais, marca as duas opcoes como desejadas
        marcar_opcao(linha, 'sociavel', 'crianças')
        marcar_opcao(linha, 'sociavel', 'outros animais')
    else:
        # se nao tem, deixa sociabilidade neutra
        deixar_colunas_neutras(linha, 'sociavel')

    # o questionario nao pergunta pelagem, entao pelagem fica neutra
    deixar_colunas_neutras(linha, 'pelagem')

    # transforma a linha do usuario em tabela para usar o mesmo normalizador dos pets
    tabela_usuario = pd.DataFrame([linha], columns=colunas)
    usuario_normalizado = normalizador.transform(tabela_usuario)

    if pca is None:
        # se nao foi possivel usar pca, usa o vetor normalizado
        return usuario_normalizado[0]

    # aplica no usuario o mesmo pca calculado com os pets
    return pca.transform(usuario_normalizado)[0]


def idade_usuario_para_numero(idade: str) -> float:
    # converte filhote, adulto ou senior para uma idade numerica usada pelos pets
    idade_do_pet = MAPA_IDADE_USUARIO.get(idade, '')
    return MAPA_IDADE.get(idade_do_pet, 0.0)


def marcar_opcao(linha: dict, prefixo: str, opcao: str):
    # monta o nome da coluna que queremos marcar
    # exemplo: prefixo vive e opcao apartamento vira vive_apartamento
    opcao = texto(opcao)
    coluna = f'{prefixo}_{opcao}'

    if coluna in linha:
        # coloca 1 quando o usuario escolheu aquela caracteristica
        linha[coluna] = 1.0


def deixar_colunas_neutras(linha: dict, prefixo: str):
    # deixa um grupo de colunas com valor 0.5
    # isso significa que o usuario nao quer forcar nem sim nem nao para esse tema
    inicio = f'{prefixo}_'

    for coluna in linha:
        if coluna.startswith(inicio):
            linha[coluna] = 0.5


def calcular_distancia(vetor_usuario, vetor_pet) -> float:
    # calcula distancia euclidiana entre usuario e pet
    # quanto menor o resultado, mais parecido o pet e com o usuario
    return float(np.linalg.norm(vetor_usuario - vetor_pet))


def calcular_peso_likes(total_likes: int) -> float:
    # define quanto os pets curtidos devem influenciar o vetor do usuario
    for limite, peso in PESOS_LIKES:
        if total_likes < limite:
            return peso

    # se tiver muitos likes, usa o peso maximo
    return 0.9


def misturar_com_likes(vetor_usuario, pets_com_vetor: list, ids_curtidos: list):
    # transforma os ids curtidos em texto para comparar com os ids dos pets
    ids = {str(pet_id) for pet_id in (ids_curtidos or [])}
    vetores_curtidos = []

    for pet in pets_com_vetor:
        # pega o vetor dos pets que o usuario ja curtiu
        if pet['pet_id'] in ids:
            vetores_curtidos.append(pet['vetor'])

    if not vetores_curtidos:
        # se nao tem likes, usa apenas o questionario
        return vetor_usuario

    # calcula a media dos vetores curtidos
    vetor_likes = np.array(vetores_curtidos, dtype=float).mean(axis=0)

    # mistura questionario e likes usando o peso escolhido
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
    # funcao principal da recomendacao
    # ela e chamada pela rota /recommend do fastapi

    # transforma os pets do banco em uma tabela numerica
    tabela_pets = transformar_pets_em_tabela(pets)

    if tabela_pets.empty:
        # se nao existem pets validos, nao tem recomendacao
        return []

    # pega o tipo para saber qual arquivo pkl deve ser usado
    tipo = texto(respostas.get('tipo'))

    # carrega o pkl, normaliza os dados, aplica pca e cria o vetor de cada pet
    pets_com_vetor, colunas, normalizador, pca = aplicar_pca_nos_pets(tabela_pets, tipo)

    # cria o vetor do usuario usando as mesmas colunas dos pets
    vetor_usuario = transformar_usuario_em_vetor(respostas, colunas, normalizador, pca)

    # se o usuario ja curtiu pets, mistura essa informacao no vetor final
    vetor_usuario = misturar_com_likes(vetor_usuario, pets_com_vetor, ids_curtidos or [])

    # ids bloqueados nao devem aparecer na resposta
    ids_bloqueados = {str(pet_id) for pet_id in (ids_excluidos or [])}
    pets_com_distancia = []

    for pet in pets_com_vetor:
        if pet['pet_id'] in ids_bloqueados:
            # pula pet que ja foi excluido da recomendacao
            continue

        # calcula o quanto esse pet e parecido com o usuario
        distancia = calcular_distancia(vetor_usuario, pet['vetor'])

        # guarda o id e a distancia para ordenar depois
        pets_com_distancia.append({
            'pet_id': pet['pet_id'],
            'distancia': distancia,
        })

    # ordena do mais parecido para o menos parecido
    pets_ordenados = sorted(pets_com_distancia, key=lambda item: item['distancia'])

    # adiciona 2 pets exploratorios bem longe a cada 10 recomendacoes
    recomendacoes = adicionar_recomendacao_exploratoria(pets_ordenados)

    # aplica paginacao para devolver somente a parte pedida
    pagina = recomendacoes[pular:pular + quantidade]

    # transforma a resposta no formato esperado pela api
    return [
        ItemRecomendacao(
            pet_id=item['pet_id'],
            distancia=round(item['distancia'], 4),
        )
        for item in pagina
    ]


def adicionar_recomendacao_exploratoria(recomendacoes: list) -> list:
    # monta a lista final em grupos de 10 pets
    # em cada grupo entram 8 pets parecidos e 2 pets exploratorios bem longe
    resultado = []
    pets_usados = set()
    indice = 0

    while indice < len(recomendacoes):
        total_parecidos = 0

        while indice < len(recomendacoes) and total_parecidos < 8:
            pet = recomendacoes[indice]
            indice += 1

            if pet['pet_id'] in pets_usados:
                # evita repetir o mesmo pet
                continue

            # adiciona recomendacao principal baseada na distancia
            resultado.append(pet)
            pets_usados.add(pet['pet_id'])
            total_parecidos += 1

        total_exploratorios = 0

        while total_exploratorios < 2:
            pet_exploratorio = escolher_pet_exploratorio_longe(recomendacoes, pets_usados)

            if pet_exploratorio is None:
                break

            # adiciona recomendacao exploratoria usando um pet bem distante
            resultado.append(pet_exploratorio)
            pets_usados.add(pet_exploratorio['pet_id'])
            total_exploratorios += 1

    return resultado


def escolher_pet_exploratorio_longe(todos_pets: list, pets_usados: set):
    # escolhe um pet distante que ainda nao apareceu na lista final
    # como a lista ja esta ordenada por distancia, o ultimo pet livre e o mais longe possivel
    for pet in reversed(todos_pets):
        if pet['pet_id'] not in pets_usados:
            # esse pet ainda nao foi usado, entao pode ser exploratorio
            return pet

    # se nao sobrou candidato, nao adiciona exploratorio
    return None
