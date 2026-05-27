const mongoose = require('mongoose');

// cria o modelo de usuario no mongodb
// esse modelo guarda adotantes, ongs e admins
const userSchema = new mongoose.Schema({
  // id que vem do google quando o usuario faz login
  googleId:    { type: String, unique: true, sparse: true },

  // email e unico porque cada conta deve ter apenas um email
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },

  // nome exibido no sistema
  name:        { type: String, required: true, trim: true },

  // foto do usuario vinda do google ou do perfil
  avatar:      { type: String, default: null },

  // role define o tipo de conta: adotante, ong ou admin
  role:        { type: String, enum: ['user', 'ong', 'admin'], default: 'user' },

  // nome da ong quando a conta for ong
  ongName:     { type: String, default: null },

  // telefone e localizacao aparecem no perfil do usuario
  telefone:    { type: String, default: '', trim: true },
  localizacao: { type: String, default: '', trim: true },

  // guarda a ultima resposta do questionario
  // isso permite buscar mais recomendacoes depois sem perguntar tudo de novo
  lastQuestionnaireAnswers: {
    tipo: String,
    porte: String,
    idade: String,
    local: String,
    cuidados: String,
    sociavel: String,
    sexo: String,
  },

  // permite desativar conta sem apagar do banco
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// cria a colecao users no mongodb usando esse formato
module.exports = mongoose.model('User', userSchema);
