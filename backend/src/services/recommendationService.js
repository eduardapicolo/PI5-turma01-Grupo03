const petRepository = require('../repositories/petRepository');
const userRepository = require('../repositories/userRepository');
const Like = require('../models/Like');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';


const VALORES_VALIDOS = {
  tipo: ['Cachorro', 'Gato'],
  porte: ['Pequeno', 'Médio', 'Grande'],
  idade: ['Filhote', 'Adulto', 'Sênior'],
  local: ['Apartamento', 'Casa com quintal'],
  sociavel: ['sim', 'nao'],
  sexo: ['Macho', 'Fêmea', 'Ambos'],
};

const CAMPOS_PET = [
  '_id', 'nome', 'tipo_animal', 'raca', 'porte', 'sexo', 'idade_display',
  'descricao', 'fotos', 'imagem_principal', 'imagem', 'url', 'localizacao',
  'sociavel_criancas', 'sociavel_animais',
];

function primeiroValor(pet, ...campos) {
  for (const campo of campos) {
    const valor = pet[campo];

    if (valor !== undefined && valor !== null && valor !== '') {
      return valor;
    }
  }

  return '';
}

function montarLocalizacao(pet) {
  const localizacao = primeiroValor(pet, 'localizacao');
  if (localizacao) return localizacao;

  const cidade = primeiroValor(pet, 'Cidade');
  const estado = primeiroValor(pet, 'Estado');

  return [cidade, estado].filter(Boolean).join(' - ');
}

function normalizarTipoAnimal(valor) {
  const texto = String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (['cachorro', 'cao', 'dog'].includes(texto)) {
    return 'cachorro';
  }

  if (['gato', 'cat'].includes(texto)) {
    return 'gato';
  }

  return texto;
}

function criarErro(statusCode, message) {
  const erro = new Error(message);
  erro.statusCode = statusCode;
  return erro;
}

function validarRespostas({ tipo, porte, idade, local, cuidados, sociavel, sexo }) {
  const respostas = { tipo, porte, idade, local, cuidados, sociavel, sexo };

  for (const [campo, validos] of Object.entries(VALORES_VALIDOS)) {
    const valor = respostas[campo];

    if (!valor || !validos.includes(valor)) {
      return `${campo} invalido`;
    }
  }

  if (cuidados !== undefined && typeof cuidados !== 'string') {
    return 'cuidados deve ser uma string';
  }

  return null;
}

function montarRespostas(body) {
  const { tipo, porte, idade, local, cuidados, sociavel, sexo } = body;
  return { tipo, porte, idade, local, cuidados, sociavel, sexo };
}

async function buscarPreferenciasDoUsuario(user, tipo) {
  if (!user) {
    return { ids_curtidos: [], ids_excluidos: [] };
  }

  const likes = await Like.find({ user: user._id }).select('pet').lean();

  const likedPetIds = likes.map((like) => like.pet);

  if (likedPetIds.length === 0) {
    return { ids_curtidos: [], ids_excluidos: [] };
  }

  const likedPets = await petRepository.findByIds(likedPetIds, 'tipo_animal Especie especie');

  const ids_curtidos = likedPets
    .filter((pet) => normalizarTipoAnimal(primeiroValor(pet, 'tipo_animal', 'Especie')) === normalizarTipoAnimal(tipo))
    .map((pet) => pet._id.toString());

  return {
    ids_curtidos,

    ids_excluidos: likedPetIds.map(String),
  };
}

async function buscarRankingNaFastApi(respostas, preferencias, topN, skip) {
  const fastapiRes = await fetch(`${FASTAPI_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      respostas,
      ids_curtidos: preferencias.ids_curtidos,
      ids_excluidos: preferencias.ids_excluidos,
      top_n: Number(topN),
      pular: Number(skip),
    }),
  });

  if (!fastapiRes.ok) {
    const erro = await fastapiRes.json().catch(() => ({}));
    throw new Error(erro.detail || `FastAPI respondeu ${fastapiRes.status}`);
  }

  return fastapiRes.json();
}

function selecionarCamposPet(pet) {
  const dados = {};

  for (const campo of CAMPOS_PET) {
    dados[campo] = pet[campo];
  }

  dados._id = String(pet._id);
  dados.nome = primeiroValor(pet, 'nome', 'Nome');
  dados.tipo_animal = primeiroValor(pet, 'tipo_animal', 'Especie');
  dados.raca = primeiroValor(pet, 'raca', 'Raca');
  dados.porte = primeiroValor(pet, 'porte', 'Porte');
  dados.sexo = primeiroValor(pet, 'sexo', 'Sexo');
  dados.idade_display = primeiroValor(pet, 'idade_display', 'idade', 'Idade');
  dados.descricao = primeiroValor(pet, 'descricao', 'Biografia');
  dados.imagem = primeiroValor(pet, 'imagem', 'Foto');
  dados.imagem_principal = primeiroValor(pet, 'imagem_principal', 'Foto', 'imagem');
  dados.url = primeiroValor(pet, 'url', 'Link_adocao');
  dados.localizacao = montarLocalizacao(pet);
  dados.disponibilidade = primeiroValor(pet, 'disponibilidade') || 'Disponível';

  return dados;
}

async function montarRecomendacoes(ranked) {

  const pets = await petRepository.findByIds(ranked.map((item) => item.pet_id));

  const petMap = Object.fromEntries(pets.map((pet) => [pet._id.toString(), pet]));

  return ranked
    .filter((item) => petMap[item.pet_id])
    .map(({ pet_id, distancia }) => ({
      pet: selecionarCamposPet(petMap[pet_id]),
      distancia,
    }));
}

async function gerarRecomendacao(body, user) {
  const { topN = 5, skip = 0 } = body;

  const respostas = montarRespostas(body);

  const erro = validarRespostas(respostas);

  if (erro) {
    throw criarErro(400, erro);
  }

  const preferencias = await buscarPreferenciasDoUsuario(user, respostas.tipo);

  const ranked = await buscarRankingNaFastApi(respostas, preferencias, topN, skip);

  const recomendacoes = await montarRecomendacoes(ranked);

  if (user) {
    userRepository.updateById(user._id, { lastQuestionnaireAnswers: respostas }).catch(() => {});
  }

  return {
    tipo: respostas.tipo,
    total: recomendacoes.length,
    recomendacoes,
  };
}

module.exports = {
  gerarRecomendacao,
};
