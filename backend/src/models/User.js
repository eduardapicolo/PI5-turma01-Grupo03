const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  googleId:    { type: String, unique: true, sparse: true },

  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },

  name:        { type: String, required: true, trim: true },

  avatar:      { type: String, default: null },

  role:        { type: String, enum: ['user', 'ong', 'admin'], default: 'user' },

  ongName:     { type: String, default: null },

  telefone:    { type: String, default: '', trim: true },
  localizacao: { type: String, default: '', trim: true },


  lastQuestionnaireAnswers: {
    tipo: String,
    porte: String,
    idade: String,
    local: String,
    cuidados: String,
    sociavel: String,
    sexo: String,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
