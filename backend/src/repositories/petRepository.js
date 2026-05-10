const Pet = require('../models/Pet');

const petRepository = {
  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 20, select } = options;
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
      vetor_pca: { $exists: true, $ne: [] },
      ...filter,
    }).select('nome tipo_animal raca porte sexo idade_display descricao fotos imagem_principal imagem url localizacao vetor_pca castrado vacinado vermifugado precisa_cuidados_especiais sociavel_criancas sociavel_animais aceita_apartamento aceita_casa_quintal'),

  create: (data) => Pet.create(data),

  updateById: (id, data) =>
    Pet.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: (id) => Pet.findByIdAndDelete(id),

  findByIds: (ids, select) =>
    Pet.find({ _id: { $in: ids } })
      .select(select || 'nome tipo_animal raca porte sexo idade_display descricao fotos imagem_principal imagem url localizacao castrado vacinado vermifugado precisa_cuidados_especiais sociavel_criancas sociavel_animais aceita_apartamento aceita_casa_quintal'),

  count: (filter = {}) => Pet.countDocuments(filter),

  updateVetorPca: (id, vetor) =>
    Pet.findByIdAndUpdate(id, {
      vetor_pca: vetor,
      vetor_calculado_em: new Date(),
    }, { new: true }),
};

module.exports = petRepository;
