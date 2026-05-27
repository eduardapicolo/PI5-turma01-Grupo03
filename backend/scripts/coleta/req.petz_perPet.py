import requests
import csv
import time
import os
from datetime import datetime, date

# esse script coleta pets da api da petz e salva em csv
# ele e auxiliar e nao roda junto com o servidor

# url da api que lista pets disponiveis na petz
url_lista = "https://apis.petz.digital/adote/v1/pets"

# headers simulam uma chamada feita pelo navegador
# access token e client id devem vir das variaveis de ambiente
headers = {
    "accept": "application/json, text/plain, */*",
    "access_token": os.getenv("PETZ_ACCESS_TOKEN", ""),
    "client_id": os.getenv("PETZ_CLIENT_ID", ""),
    "origin": "https://www.adotepetz.com.br",
    "referer": "https://www.adotepetz.com.br/",
    "user-agent": "Mozilla/5.0"
}

# caminho do arquivo csv onde os pets serao salvos
arquivo_csv = "PI5-turma01-Grupo03/data/Petz.csv"

# colunas que serao gravadas no csv final
campos = [
    "Id",
    "Nome",
    "Unidade",
    "Cidade",
    "Estado",
    "Ong",
    "Sexo",
    "Porte",
    "Foto",
    "Data_nascimento",
    "Idade",
    "Peso",
    "Especie",
    "Raca",
    "Biografia",
    "Link_adocao",
    "Acesso_em"
]

def calcular_idade(data_nascimento):
    # calcula idade aproximada usando a data de nascimento do pet
    if not data_nascimento:
        return ""

    try:
        nascimento = datetime.strptime(data_nascimento, "%Y-%m-%d").date()
    except ValueError:
        return ""

    hoje = date.today()

    anos = hoje.year - nascimento.year
    meses = hoje.month - nascimento.month
    dias = hoje.day - nascimento.day

    if dias < 0:
        meses -= 1

    if meses < 0:
        anos -= 1
        meses += 12

    if anos > 0:
        return f"{anos} ano(s) e {meses} mes(es)"
    return f"{meses} mes(es)"

def ler_ids_existentes(nome_arquivo):
    # le ids que ja estao no csv para evitar duplicidade
    ids_existentes = set()

    if not os.path.exists(nome_arquivo):
        return ids_existentes

    with open(nome_arquivo, "r", encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f)
        for linha in leitor:
            ids_existentes.add(str(linha["Id"]))

    return ids_existentes


def montar_pet(item):
    # transforma o json da api da petz em um dicionario simples para o csv
    unidade = item.get("unit", {})
    cidade = unidade.get("city", {})
    ong = item.get("ngo", {})
    imagem = item.get("image", {})
    raca = item.get("breed", {})

    moura_id = item.get("mouraId", "")
    documento_unidade = unidade.get("document", "")
    acesso_em = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    link = f"https://www.adotepetz.com.br/quero-adotar?idPet={moura_id}&cnpjUnidade={documento_unidade}"

    return {
        "Id": moura_id,
        "Nome": item.get("name", ""),
        "Unidade": unidade.get("companyName", ""),
        "Cidade": cidade.get("name", ""),
        "Estado": unidade.get("state", ""),
        "Ong": ong.get("name", ""),
        "Sexo": item.get("gender", ""),
        "Porte": item.get("size", ""),
        "Foto": imagem.get("photo", ""),
        "Data_nascimento": item.get("birthDate", ""),
        "Idade": calcular_idade(item.get("birthDate", "")),
        "Peso": item.get("weight", ""),
        "Especie": item.get("specie", ""),
        "Raca": raca.get("name", ""),
        "Biografia": item.get("biography", ""),
        "Link_adocao": link,
        "Acesso_em": acesso_em
    }


# le o csv antes de coletar para saber o que ja foi salvo
ids_existentes = ler_ids_existentes(arquivo_csv)

# verifica se precisa escrever cabecalho no csv
arquivo_existe = os.path.exists(arquivo_csv)
arquivo_vazio = (not arquivo_existe) or os.path.getsize(arquivo_csv) == 0

# conta quantos pets novos foram adicionados nessa execucao
novos = 0

with open(arquivo_csv, "a", encoding="utf-8-sig", newline="") as f:

    # cria o escritor csv
    writer = csv.DictWriter(f, fieldnames=campos)

    if arquivo_vazio:
        writer.writeheader()

    page = 1
    limit = 12

    while True:
        # monta parametros de paginacao da api
        # page muda a pagina e limit define quantidade por pagina

        params = {
            "page": page,
            "limit": limit
        }

        # chama a api de listagem
        r = requests.get(url_lista, headers=headers, params=params)

        if r.status_code != 200:
            break

        # pega a lista de pets dentro da resposta json
        data = r.json()
        pets = data["data"]["pets"]

        if not pets:
            break

        for pet in pets:

            # pega ids usados pela api da petz
            moura_id = str(pet["mouraId"])
            unit_document = pet["unit"]["document"]

            if moura_id in ids_existentes:
                # pula pet que ja existe no csv
                continue

            # chama endpoint de detalhe para pegar mais dados de um pet
            url_detalhe = f"https://apis.petz.digital/adote/v1/pets/{moura_id}"

            params_detalhe = {
                "unitDocument": unit_document
            }

            try:
                r2 = requests.get(url_detalhe, headers=headers, params=params_detalhe)

                if r2.status_code == 200:

                    # transforma resposta da api em linha de csv
                    detalhe = r2.json()
                    item = detalhe.get("data", detalhe)

                    novo_pet = montar_pet(item)

                    # salva o pet no csv imediatamente
                    writer.writerow(novo_pet)
                    f.flush()

                    ids_existentes.add(moura_id)

                    novos += 1

                    print(f"Novo pet adicionado: {moura_id}")

                # pequena pausa para nao chamar a api rapido demais
                time.sleep(0.2)

            except:
                # se um pet der erro, o script continua com os proximos
                pass

        # vai para a proxima pagina
        page += 1
        time.sleep(0.3)


if novos == 0:
    print("Nenhum pet novo encontrado.")
else:
    print(f"{novos} novos pets adicionados ao Petz.csv.")
