const Pet = require('../models/Pet');
const mongoose = require('mongoose');


const CAMPOS_LISTAGEM = [
  'nome', 'tipo_animal', 'raca', 'porte', 'sexo', 'idade_display', 'descricao',
  'fotos', 'imagem_principal', 'imagem', 'url', 'localizacao',
  'castrado', 'vacinado', 'vermifugado', 'precisa_cuidados_especiais',
  'sociavel_criancas', 'sociavel_animais', 'aceita_apartamento', 'aceita_casa_quintal',
  'Nome', 'Especie', 'Raca', 'Porte', 'Sexo', 'Idade', 'Biografia',
  'Foto', 'Link_adocao', 'Cidade', 'Estado', 'disponibilidade',
].join(' ');

function montarIdsParaBusca(ids) {

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


const petRepository = {
  findAll(filter = {}, { page = 1, limit = 20, select } = {}) {
    const skip = (page - 1) * limit;

    let query = Pet.find(filter).skip(skip).limit(limit).populate('ong', 'name ongName email');

    if (select) query = query.select(select);
    return query;
  },

  findById: (id) => Pet.findById(id).populate('ong', 'name ongName email avatar'),

  findByOng: (ongId, filter = {}) =>
    Pet.find({ ong: ongId, ...filter }).sort({ createdAt: -1 }),


  findByTipo: (tipo, filter = {}) =>
    Pet.find({
      tipo_animal: tipo,
      disponibilidade: 'Disponível',
      ...filter,
    }).select(CAMPOS_LISTAGEM),

  create: (data) => Pet.create(data),

  updateById: (id, data) =>
    Pet.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: (id) => Pet.findByIdAndDelete(id),

  findByIds: (ids, select) => {
    const idsBusca = montarIdsParaBusca(ids);
    const projection = montarProjecao(select || CAMPOS_LISTAGEM);

    return Pet.collection.find(
      { _id: { $in: idsBusca } },
      { projection },
    ).toArray();
  },

  count: (filter = {}) => Pet.countDocuments(filter),
};

module.exports = petRepository;
