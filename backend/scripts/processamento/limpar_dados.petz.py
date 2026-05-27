import json
import csv
from datetime import datetime, date

# esse script transforma um json detalhado da petz em arquivos mais simples
# ele gera um json limpo e tambem um csv para analise

# abre o arquivo json bruto coletado antes
with open("pets_petz_detalhado.json", "r", encoding="utf-8") as f:
    dados = json.load(f)

def calcular_idade(data_nascimento):
    # calcula idade aproximada do pet usando a data de nascimento
    if not data_nascimento:
        return ""

    nascimento = datetime.strptime(data_nascimento, "%Y-%m-%d").date()
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

# guarda a data e hora em que o processamento foi feito
acesso_em = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# lista final que vai receber os pets limpos
resultado = []

for pet in dados:
    # alguns jsons vem dentro de data, outros ja vem direto no objeto
    item = pet.get("data", pet)

    # separa partes internas do json para facilitar leitura
    unidade = item.get("unit", {})
    cidade = unidade.get("city", {})
    ong = item.get("ngo", {})
    imagem = item.get("image", {})
    raca = item.get("breed", {})

    # ids usados para montar o link de adocao
    moura_id = item.get("mouraId", "")
    documento_unidade = unidade.get("document", "")

    # link publico para a pagina de adocao do pet
    link = f"https://www.adotepetz.com.br/quero-adotar?idPet={moura_id}&cnpjUnidade={documento_unidade}"

    # monta um pet em formato simples
    novo_pet = {
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

    # adiciona o pet limpo na lista final
    resultado.append(novo_pet)

# salva os dados limpos em json
with open("Petz.json", "w", encoding="utf-8") as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)

# colunas usadas no csv final
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

# salva os mesmos dados em csv
with open("Petz.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=campos)
    writer.writeheader()
    writer.writerows(resultado)
