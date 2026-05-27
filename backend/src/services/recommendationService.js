const petRepository = require('../repositories/petRepository');
const userRepository = require('../repositories/userRepository');
const Like = require('../models/Like');

// endereco da api fastapi que faz o calculo da recomendacao
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// valores aceitos no questionario
// isso evita mandar resposta errada para a ia
const VALORES_VALIDOS = {
  tipo: ['Cachorro', 'Gato'],
  porte: ['Pequeno', 'Médio', 'Grande'],
  idade: ['Filhote', 'Adulto', 'Sênior'],
  local: ['Apartamento', 'Casa com quintal'],
  sociavel: ['sim', 'nao'],
  sexo: ['Macho', 'Fêmea', 'Ambos'],
};

// campos do pet que voltam para o frontend junto com a recomendacao
const CAMPOS_PET = [
  '_id', 'nome', 'tipo_animal', 'raca', 'porte', 'sexo', 'idade_display',
  'descricao', 'fotos', 'imagem_principal', 'imagem', 'url', 'localizacao',
  'sociavel_criancas', 'sociavel_animais',
];

function primeiroValor(pet, ...campos) {
  // pega o primeiro campo preenchido
  // isso ajuda quando o pet veio importado com nomes de campos diferentes
  for (const campo of campos) {
    const valor = pet[campo];

    if (valor !== undefined && valor !== null && valor !== '') {
      return valor;
    }
  }

  return '';
}

function montarLocalizacao(pet) {
  // monta localizacao para pets importados que tem cidade e estado separados
  const localizacao = primeiroValor(pet, 'localizacao');
  if (localizacao) return localizacao;

  const cidade = primeiroValor(pet, 'Cidade');
  const estado = primeiroValor(pet, 'Estado');

  return [cidade, estado].filter(Boolean).join(' - ');
}

function normalizarTipoAnimal(valor) {
  // deixa cachorro, cao e gato em um formato unico para comparar
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
  // cria um erro com status http para o controller responder corretamente
  const erro = new Error(message);
  erro.statusCode = statusCode;
  return erro;
}

function validarRespostas({ tipo, porte, idade, local, cuidados, sociavel, sexo }) {
  // junta as respostas principais em um objeto para validar campo por campo
  const respostas = { tipo, porte, idade, local, cuidados, sociavel, sexo };

  for (const [campo, validos] of Object.entries(VALORES_VALIDOS)) {
    // verifica se o campo existe e se esta dentro dos valores permitidos
    const valor = respostas[campo];

    if (!valor || !validos.includes(valor)) {
      return `${campo} invalido`;
    }
  }

  // cuidados pode vir vazio, mas se vier precisa ser texto
  if (cuidados !== undefined && typeof cuidados !== 'string') {
    return 'cuidados deve ser uma string';
  }

  // se nao encontrou problema, devolve null
  return null;
}

function montarRespostas(body) {
  // pega do body somente os campos que fazem parte do questionario
  const { tipo, porte, idade, local, cuidados, sociavel, sexo } = body;
  return { tipo, porte, idade, local, cuidados, sociavel, sexo };
}

async function buscarPreferenciasDoUsuario(user, tipo) {
  // se nao tem usuario logado, nao existe historico de likes
  if (!user) {
    return { ids_curtidos: [], ids_excluidos: [] };
  }

  // busca todos os likes do usuario
  const likes = await Like.find({ user: user._id }).select('pet').lean();

  // cria uma lista apenas com os ids dos pets curtidos
  const likedPetIds = likes.map((like) => like.pet);

  if (likedPetIds.length === 0) {
    // se nao tem likes, devolve listas vazias
    return { ids_curtidos: [], ids_excluidos: [] };
  }

  // busca os pets curtidos para filtrar pelo mesmo tipo escolhido no questionario
  const likedPets = await petRepository.findByIds(likedPetIds, 'tipo_animal Especie especie');

  // ids_curtidos ajudam a ia a misturar o gosto do usuario na recomendacao
  const ids_curtidos = likedPets
    .filter((pet) => normalizarTipoAnimal(primeiroValor(pet, 'tipo_animal', 'Especie')) === normalizarTipoAnimal(tipo))
    .map((pet) => pet._id.toString());

  return {
    ids_curtidos,

    // ids_excluidos impedem que pets ja curtidos aparecam de novo
    ids_excluidos: likedPetIds.map(String),
  };
}

async function buscarRankingNaFastApi(respostas, preferencias, topN, skip) {
  // chama a api fastapi que calcula pca, distancia e ranking
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
    // se a fastapi responder erro, tenta ler a mensagem e transforma em erro do node
    const erro = await fastapiRes.json().catch(() => ({}));
    throw new Error(erro.detail || `FastAPI respondeu ${fastapiRes.status}`);
  }

  // devolve a lista de ids e distancias retornada pela ia
  return fastapiRes.json();
}

function selecionarCamposPet(pet) {
  // monta um objeto novo somente com os campos que o frontend precisa
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
  // ranked vem da fastapi com pet_id e distancia
  // aqui buscamos os dados completos desses pets no mongodb
  const pets = await petRepository.findByIds(ranked.map((item) => item.pet_id));

  // cria um mapa para encontrar pet pelo id rapidamente
  const petMap = Object.fromEntries(pets.map((pet) => [pet._id.toString(), pet]));

  // monta a lista final mantendo a ordem recebida da ia
  return ranked
    .filter((item) => petMap[item.pet_id])
    .map(({ pet_id, distancia }) => ({
      pet: selecionarCamposPet(petMap[pet_id]),
      distancia,
    }));
}

async function gerarRecomendacao(body, user) {
  // topN e a quantidade de pets pedida
  // skip e usado para buscar a proxima pagina de recomendacoes
  const { topN = 5, skip = 0 } = body;

  // separa somente as respostas do questionario
  const respostas = montarRespostas(body);

  // valida as respostas antes de chamar a ia
  const erro = validarRespostas(respostas);

  if (erro) {
    throw criarErro(400, erro);
  }

  // busca likes e ids que devem ser excluidos
  const preferencias = await buscarPreferenciasDoUsuario(user, respostas.tipo);

  // pede para a fastapi calcular o ranking
  const ranked = await buscarRankingNaFastApi(respostas, preferencias, topN, skip);

  // transforma ids em dados completos de pets
  const recomendacoes = await montarRecomendacoes(ranked);

  if (user) {
    // salva o ultimo questionario para carregar mais recomendacoes depois
    userRepository.updateById(user._id, { lastQuestionnaireAnswers: respostas }).catch(() => {});
  }

  // resposta final enviada para o controller
  return {
    tipo: respostas.tipo,
    total: recomendacoes.length,
    recomendacoes,
  };
}

module.exports = {
  // exporta a funcao principal usada pelo controller de recomendacao
  gerarRecomendacao,
};
