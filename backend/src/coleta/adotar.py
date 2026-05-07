import requests
from bs4 import BeautifulSoup
import json
import csv
import re
import time
from urllib.parse import urljoin

BASE_URL = "https://adotar.com.br"
URL_BASE_LISTAGEM = "https://adotar.com.br/adocao-de-animais"
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}
ARQUIVO_CSV = "animais_adotar.csv"


def limpar_texto(txt):
    if not txt:
        return ""
    return re.sub(r"\s+", " ", txt).strip()


def get_soup(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")


def extrair_json_ld(soup):
    scripts = soup.find_all("script", {"type": "application/ld+json"})
    for script in scripts:
        conteudo = script.string or script.get_text(strip=True)
        if not conteudo:
            continue
        try:
            obj = json.loads(conteudo)
            if isinstance(obj, dict) and obj.get("name"):
                return obj
        except:
            continue
    return {}


def props_para_dict(additional_property):
    dados = {}
    if not isinstance(additional_property, list):
        return dados

    for item in additional_property:
        nome = item.get("name", "")
        valor = item.get("value", "")
        if nome:
            dados[nome] = valor
    return dados


def extrair_historia(soup):
    h3s = soup.find_all("h3")
    for h3 in h3s:
        texto = limpar_texto(h3.get_text(" ", strip=True)).lower()
        if "história" in texto or "historia" in texto:
            card = h3.find_parent("div", class_="card")
            if card:
                ps = card.find_all("p")
                return limpar_texto(" ".join(p.get_text(" ", strip=True) for p in ps))
    return ""


def extrair_badges_por_rotulo(soup, rotulo):
    fortes = soup.find_all("strong")
    for strong in fortes:
        texto = limpar_texto(strong.get_text(" ", strip=True)).lower()
        if texto.startswith(rotulo.lower()):
            bloco = strong.find_next("div")
            if bloco:
                spans = bloco.find_all("span")
                valores = [limpar_texto(span.get_text(" ", strip=True)) for span in spans]
                valores = [v for v in valores if v]
                return ", ".join(valores)
    return ""


def extrair_contato(soup):
    contato = {
        "contato_nome": "",
        "telefone": "",
        "email": ""
    }

    cards = soup.find_all("div", class_="card")
    for card in cards:
        texto = card.get_text(" ", strip=True)
        if "Contato sobre o animal" in texto:
            nome_div = card.find("div", class_="mb-2")
            if nome_div:
                contato["contato_nome"] = limpar_texto(nome_div.get_text(" ", strip=True))

            whatsapp = card.find("a", href=re.compile(r"api\.whatsapp\.com/send\?phone="))
            if whatsapp:
                contato["telefone"] = limpar_texto(whatsapp.get_text(" ", strip=True))

            email_btn = card.find("a", href=re.compile(r"/cdn-cgi/l/email-protection"))
            if email_btn:
                contato["email"] = limpar_texto(email_btn.get_text(" ", strip=True))
            break

    return contato


def extrair_campos_visuais(soup):
    dados = {
        "titulo": "",
        "sexo": "",
        "porte": "",
        "idade": "",
        "raca": "",
        "localizacao": "",
        "codigo": "",
        "imagem": ""
    }

    h1 = soup.find("h1")
    if h1:
        dados["titulo"] = limpar_texto(h1.get_text(" ", strip=True))

    div_dados = soup.find("div", class_="divDados")
    if div_dados:
        h2s = div_dados.find_all("h2")
        if len(h2s) >= 3:
            dados["sexo"] = limpar_texto(h2s[0].get_text(" ", strip=True))
            dados["porte"] = limpar_texto(h2s[1].get_text(" ", strip=True))
            dados["idade"] = limpar_texto(h2s[2].get_text(" ", strip=True))

    img = soup.select_one(".div1FotoAnimal img")
    if img:
        dados["imagem"] = img.get("src", "")

    cols = soup.find_all("div", class_="col")
    for col in cols:
        span = col.find("span", class_="titRaca")
        h2 = col.find("h2")
        if span and h2:
            chave = limpar_texto(span.get_text(" ", strip=True)).lower()
            valor = limpar_texto(h2.get_text(" ", strip=True))

            if chave == "raça":
                dados["raca"] = valor
            elif chave == "localização":
                dados["localizacao"] = valor
            elif chave == "código":
                dados["codigo"] = valor

    return dados


def extrair_detalhes_animal(url):
    soup = get_soup(url)

    visual = extrair_campos_visuais(soup)
    json_ld = extrair_json_ld(soup)
    props = props_para_dict(json_ld.get("additionalProperty", []))
    contato = extrair_contato(soup)

    pelagem = props.get("Pelagem", "") or extrair_badges_por_rotulo(soup, "Pelagem")
    cuidados = extrair_badges_por_rotulo(soup, "Cuidados Veterinários")
    temperamento = extrair_badges_por_rotulo(soup, "Temperamento")
    vive_bem_com = extrair_badges_por_rotulo(soup, "Vive bem com")
    sociavel_com = extrair_badges_por_rotulo(soup, "Sociável com")

    return {
        "url": url,
        "nome": json_ld.get("name", ""),
        "titulo": visual["titulo"],
        "tipo_animal": props.get("Tipo de Animal", ""),
        "sexo": props.get("Gênero", "") or visual["sexo"],
        "porte": props.get("Tamanho", "") or visual["porte"],
        "idade": props.get("Idade", "") or visual["idade"],
        "raca": props.get("Raça", "") or visual["raca"],
        "pelagem": pelagem,
        "localizacao": visual["localizacao"],
        "codigo": visual["codigo"],
        "descricao": limpar_texto(json_ld.get("description", "")),
        "historia": extrair_historia(soup),
        "imagem": json_ld.get("image", "") or visual["imagem"],
        "data_publicacao": props.get("Data de Publicação", ""),
        "data_modificacao": props.get("Data de Modificação", ""),
        "disponibilidade": props.get("Disponibilidade", ""),
        "cuidados_veterinarios": cuidados,
        "temperamento": temperamento,
        "vive_bem_com": vive_bem_com,
        "sociavel_com": sociavel_com,
        "contato_nome": contato["contato_nome"],
        "telefone": contato["telefone"],
        "email": contato["email"]
    }


def extrair_links_animais_da_pagina(url):
    soup = get_soup(url)
    links = []

    for a in soup.select("a.listaAnimal"):
        href = a.get("href")
        if href:
            link = urljoin(BASE_URL, href)
            if link not in links:
                links.append(link)

    if not links:
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            if "/adocao/" in href and href.count("/") >= 5:
                link = urljoin(BASE_URL, href)
                if link not in links:
                    links.append(link)

    return links


def carregar_urls_existentes_csv(nome_arquivo):
    urls = set()
    try:
        with open(nome_arquivo, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("url"):
                    urls.add(row["url"])
    except FileNotFoundError:
        pass
    return urls


def salvar_incremental_csv(nome_arquivo, dados, cabecalho_escrito):
    colunas = [
        "url", "nome", "titulo", "tipo_animal", "sexo", "porte", "idade",
        "raca", "pelagem", "localizacao", "codigo", "descricao", "historia",
        "imagem", "data_publicacao", "data_modificacao", "disponibilidade",
        "cuidados_veterinarios", "temperamento", "vive_bem_com", "sociavel_com",
        "contato_nome", "telefone", "email"
    ]

    modo = "a" if cabecalho_escrito else "w"
    with open(nome_arquivo, modo, encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        if not cabecalho_escrito:
            writer.writeheader()
        writer.writerow(dados)


def montar_url_pagina(numero_pagina):
    if numero_pagina == 1:
        return URL_BASE_LISTAGEM
    return f"{URL_BASE_LISTAGEM}?p={numero_pagina}"


def main():
    urls_existentes = carregar_urls_existentes_csv(ARQUIVO_CSV)
    cabecalho_escrito = len(urls_existentes) > 0

    pagina = 1
    total_novos = 0
    links_pagina_anterior = None

    while True:
        pagina_url = montar_url_pagina(pagina)
        print(f"\nLendo página {pagina}: {pagina_url}")

        try:
            links_animais = extrair_links_animais_da_pagina(pagina_url)
        except Exception as e:
            print(f"Erro ao ler a página {pagina}: {e}")
            break

        print(f"Links encontrados: {len(links_animais)}")

        if not links_animais:
            print("Página sem resultados. Encerrando.")
            break

        conjunto_atual = tuple(sorted(links_animais))

        if links_pagina_anterior is not None and conjunto_atual == links_pagina_anterior:
            print("A página atual repetiu exatamente os mesmos links da página anterior. Encerrando.")
            break

        novos_na_pagina = 0

        for link in links_animais:
            if link in urls_existentes:
                continue

            try:
                animal = extrair_detalhes_animal(link)
                salvar_incremental_csv(ARQUIVO_CSV, animal, cabecalho_escrito)
                cabecalho_escrito = True
                urls_existentes.add(link)
                novos_na_pagina += 1
                total_novos += 1
                print(f"Novo animal salvo: {animal.get('nome', '')} | {link}")
                time.sleep(1)
            except Exception as e:
                print(f"Erro ao coletar animal {link}: {e}")

        if novos_na_pagina == 0:
            print("Nenhum animal novo adicionado nessa página.")
        else:
            print(f"{novos_na_pagina} novos animais adicionados nessa página.")

        links_pagina_anterior = conjunto_atual
        pagina += 1
        time.sleep(1)

    if total_novos == 0:
        print("\nNenhum novo animal foi adicionado.")
    else:
        print(f"\nFinalizado. Total de novos animais adicionados: {total_novos}")


if __name__ == "__main__":
    main()