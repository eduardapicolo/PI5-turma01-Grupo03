export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const RECOMMENDATION_BATCH_SIZE = 10;

export interface RecommendationPayload {
  tipo: string;
  porte: string;
  idade: string;
  local: string;
  cuidados: string;
  sociavel: string;
  sexo: string;
  topN: number;
  skip?: number;
}

export interface RecomendacaoPet {
  pet: {
    _id: string;
    nome: string;
    tipo_animal: string;
    raca?: string;
    porte: string;
    sexo: string;
    idade_display: string;
    descricao?: string;
    imagem?: string;
    imagem_principal?: string;
    fotos?: string[];
    url?: string;
    localizacao?: string;
    sociavel_criancas?: boolean;
    sociavel_animais?: boolean;
  };
  distancia: number;
}

export interface RecommendationResponse {
  tipo: string;
  total: number;
  recomendacoes: RecomendacaoPet[];
}

export async function buscarRecomendacoes(
  payload: RecommendationPayload,
  token = localStorage.getItem("petmatch_token")
): Promise<RecommendationResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}/recomendacao`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    throw new Error("Falha na recomendação");
  }

  return resposta.json();
}

export async function buscarIdsCurtidos(token: string): Promise<string[]> {
  const resposta = await fetch(`${API_URL}/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resposta.ok) {
    return [];
  }

  const dados = await resposta.json();
  return dados.petIds ?? [];
}

export async function alternarLikePet(petId: string, token: string | null) {
  if (!token) {
    throw new Error("Usuario nao autenticado");
  }

  const resposta = await fetch(`${API_URL}/likes/${petId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resposta.ok) {
    throw new Error("Falha ao atualizar like");
  }

  return resposta.json();
}
