const Pet = require('../models/Pet');
const mongoose = require('mongoose');

// campos que normalmente sao enviados para o frontend quando lista pets
// isso evita mandar dados desnecessarios do banco
const CAMPOS_LISTAGEM = [
  'nome', 'tipo_animal', 'raca', 'porte', 'sexo', 'idade_display', 'descricao',
  'fotos', 'imagem_principal', 'imagem', 'url', 'localizacao',
  'castrado', 'vacinado', 'vermifugado', 'precisa_cuidados_especiais',
  'sociavel_criancas', 'sociavel_animais', 'aceita_apartamento', 'aceita_casa_quintal',
  'Nome', 'Especie', 'Raca', 'Porte', 'Sexo', 'Idade', 'Biografia',
  'Foto', 'Link_adocao', 'Cidade', 'Estado', 'disponibilidade',
].join(' ');

function montarIdsParaBusca(ids) {
  // monta ids em dois formatos: texto e objectid
  // isso permite encontrar pets cadastrados pelo sistema e pets importados no banco
  const idsBusca = [];

  for (const id of ids || []) {
    const idTexto = String(id);
    idsBusca.push(idTexto);

    if (mongoose.Types.ObjectId.isValid(idTexto)) {
      idsBusca.push(new mongoose.Types.ObjectId(idTexto));
    }
  }

  return idsBusca;
}

function montarProjecao(select) {
  // transforma uma string de campos em projection do mongodb
  if (!select) {
    return undefined;
  }

  const projection = {};

  for (const campo of select.split(' ')) {
    if (campo.trim()) {
      projection[campo.trim()] = 1;
    }
  }

  projection._id = 1;
  return projection;
}

// repository e uma camada simples para concentrar consultas ao mongodb
// controllers e services chamam essas funcoes em vez de escrever Pet.find em todo lugar
const petRepository = {
  findAll(filter = {}, { page = 1, limit = 20, select } = {}) {
    // calcula quantos registros devem ser pulados para fazer paginacao
    const skip = (page - 1) * limit;

    // busca pets usando filtro, pagina e limite
    let query = Pet.find(filter).skip(skip).limit(limit).populate('ong', 'name ongName email');

    // se o caller pedir campos especificos, aplica select
    if (select) query = query.select(select);
    return query;
  },

  // busca um pet pelo id e tambem traz dados basicos da ong
  findById: (id) => Pet.findById(id).populate('ong', 'name ongName email avatar'),

  // busca todos os pets cadastrados por uma ong
  findByOng: (ongId, filter = {}) =>
    Pet.find({ ong: ongId, ...filter }).sort({ createdAt: -1 }),

  // busca pets disponiveis por tipo
  // essa funcao pode ser usada em telas que filtram cachorro ou gato
  findByTipo: (tipo, filter = {}) =>
    Pet.find({
      tipo_animal: tipo,
      disponibilidade: 'Disponível',
      ...filter,
    }).select(CAMPOS_LISTAGEM),

  // cria um pet novo no banco
  create: (data) => Pet.create(data),

  // atualiza um pet e devolve a versao nova
  updateById: (id, data) =>
    Pet.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  // apaga um pet pelo id
  deleteById: (id) => Pet.findByIdAndDelete(id),

  // busca varios pets de uma vez usando uma lista de ids
  findByIds: (ids, select) => {
    const idsBusca = montarIdsParaBusca(ids);
    const projection = montarProjecao(select || CAMPOS_LISTAGEM);

    return Pet.collection.find(
      { _id: { $in: idsBusca } },
      { projection },
    ).toArray();
  },

  // conta quantos pets existem para um filtro
  count: (filter = {}) => Pet.countDocuments(filter),
};

// exporta as funcoes de banco relacionadas a pets
module.exports = petRepository;
