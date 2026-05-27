const User = require('../models/User');

// repository de usuario
// centraliza consultas e atualizacoes da colecao users
const userRepository = {
  // busca usuario pelo id e remove o campo interno __v
  findById:      (id) => User.findById(id).select('-__v'),

  // busca usuario pelo email
  // usa lowercase para evitar diferenca entre letras maiusculas e minusculas
  findByEmail:   (email) => User.findOne({ email: email.toLowerCase() }),

  // busca usuario pelo id do google
  findByGoogleId: (googleId) => User.findOne({ googleId }),

  // cria usuario novo
  create:        (data) => User.create(data),

  // atualiza usuario e devolve a versao nova
  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-__v'),

  // lista contas de ong e admin ativas
  // essa funcao pode ser usada para telas publicas ou filtros por ong
  findAllOngs: () =>
    User.find({ role: { $in: ['ong', 'admin'] }, isActive: true }).select('name ongName email avatar'),
};

// exporta as funcoes de banco relacionadas a usuario
module.exports = userRepository;
