import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)
PKL_DIR = os.path.join(os.path.dirname(__file__), "model", "pkl")


def carregar_modelos():
    nomes = [
        "scaler_cachorro", "scaler_gato",
        "pca_cachorro", "pca_gato",
        "df_pca_cachorro", "df_pca_gato",
        "orig_cachorro", "orig_gato",
        "feat_cols",
    ]

    modelos = {}
    for nome in nomes:
        path = os.path.join(PKL_DIR, f"{nome}.pkl")
        modelos[nome] = joblib.load(path)
        logger.info(f"✅ {nome}.pkl carregado")

    return modelos


def _prefs_para_vetor(prefs, feat_cols):
    vec = {c: 0.0 for c in feat_cols}

    vec["porte"] = {"pequeno": 0, "médio": 1, "grande": 2}.get(prefs.get("porte"), 1)
    vec["idade"] = {
        "filhote": 0.5,
        "jovem": 2,
        "adulto": 4.5,
        "idoso": 7,
    }.get(prefs.get("idade"), 4)

    if prefs.get("criancas") and "sociavel_crianças" in vec:
        vec["sociavel_crianças"] = 1

    for pet in prefs.get("outros_pets", []):
        key = f"sociavel_{pet}"
        if key in vec:
            vec[key] = 1

    moradia = prefs.get("moradia", "ambos")
    if moradia == "apartamento" and "vive_apartamento" in vec:
        vec["vive_apartamento"] = 1
    elif moradia == "casa com quintal" and "vive_casa com quintal" in vec:
        vec["vive_casa com quintal"] = 1

    return np.array([[vec[c] for c in feat_cols]])


def recomendar(tipo, prefs, modelos, n=15):
    s = "cachorro" if tipo == "cachorro" else "gato"
    logger.info(f"Buscando recomendações para {s} com prefs: {prefs}")

    scaler = modelos[f"scaler_{s}"]
    pca = modelos[f"pca_{s}"]
    df_pca = modelos[f"df_pca_{s}"]
    df_orig = modelos[f"orig_{s}"]
    feat_cols = modelos["feat_cols"]

    vetor = _prefs_para_vetor(prefs, feat_cols)
    v_scaled = scaler.transform(vetor)
    v_pca = pca.transform(v_scaled)

    pc_cols = [c for c in df_pca.columns if c != "cluster"]

    sims = cosine_similarity(v_pca, df_pca[pc_cols].values)[0]
    top_idx = np.argsort(sims)[::-1][:n]

    results = []
    other_clusters = []

    for i in top_idx:
        row = df_orig.iloc[i]
        d = _row_dict(row)
        d["similarity"] = round(float(sims[i]), 4)
        results.append(d)
        logger.debug(f"  Recomendado: {d['nome']} (cluster {d['cluster']}, sim={d['similarity']})")

    # cold-start: 1 aleatório de cada cluster não recomendado
    recommended_clusters = set(r["cluster"] for r in results)
    all_clusters = set(df_orig["cluster"].unique())
    other_cluster_ids = all_clusters - recommended_clusters

    for cluster_id in sorted(other_cluster_ids):
        try:
            pet = df_orig[df_orig["cluster"] == cluster_id].sample(1).iloc[0]
            d = _row_dict(pet)
            d["cluster"] = int(cluster_id)
            other_clusters.append(d)
        except Exception as e:
            logger.warning(f"Não foi possível amostrar cluster {cluster_id}: {e}")

    logger.info(f"Retornando {len(results)} recomendações + {len(other_clusters)} exploratórios")
    return {"recommendations": results, "other_clusters": other_clusters}


def cold_start(tipo, modelos):
    df = modelos["orig_cachorro"] if tipo == "cachorro" else modelos["orig_gato"]

    return [
        _row_dict(df[df["cluster"] == c].sample(1).iloc[0])
        for c in sorted(df["cluster"].unique())
    ]


def _row_dict(row):
    def s(k):
        return str(row[k]) if k in row and pd.notna(row[k]) else ""

    try:
        return {
            "url": s("url"),
            "nome": s("nome"),
            "porte": s("porte"),
            "idade": s("idade"),
            "cluster": int(row["cluster"]) if "cluster" in row else -1,
            "imagem": s("imagem"),
            "raca": s("raca"),
            "sexo": s("sexo"),
            "temperamento": s("temperamento"),
            "sociavel_com": s("sociavel_com"),
            "localizacao": s("localizacao"),
        }
    except Exception as e:
        logger.error(f"Erro ao processar pet: {e}, row={row.to_dict() if hasattr(row, 'to_dict') else row}")
        raise