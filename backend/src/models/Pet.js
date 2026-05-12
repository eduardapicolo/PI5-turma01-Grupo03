const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  tipo_animal: {
    type: String,
    required: [true, 'Tipo do animal é obrigatório'],
    enum: ['Cachorro', 'Gato'],
  },
  raca: {
    type: String,
    default: 'Vira-lata',
    trim: true,
  },
  porte: {
    type: String,
    required: [true, 'Porte é obrigatório'],
    enum: ['Pequeno', 'Médio', 'Grande'],
  },
  idade_display: {
    type: String,
    required: [true, 'Idade é obrigatória'],
  },
  idade_ordinal: {
    type: Number,
    min: 0,
    max: 8,
  },
  sexo: {
    type: String,
    required: [true, 'Sexo é obrigatório'],
    enum: ['Macho', 'Fêmea'],
  },
  pelagem: {
    type: String,
    default: '',
  },
  descricao: {
    type: String,
    default: '',
  },

  castrado: { type: Boolean, default: false },
  vacinado:  { type: Boolean, default: false },
  vermifugado: { type: Boolean, default: false },
  precisa_cuidados_especiais: { type: Boolean, default: false },
  cuidados_veterinarios: { type: String, default: '' },

  sociavel_criancas: { type: Boolean, default: false },
  sociavel_animais:  { type: Boolean, default: false },
  sociavel_com: { type: String, default: '' },

  vive_bem_com: { type: String, default: '' },
  aceita_apartamento:   { type: Boolean, default: false },
  aceita_casa_quintal:  { type: Boolean, default: false },

  fotos: [{ type: String }],
  imagem_principal: { type: String, default: '' },
  imagem: { type: String, default: '' },

  ong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  disponibilidade: {
    type: String,
    enum: ['Disponível', 'Adotado', 'Em processo'],
    default: 'Disponível',
  },
  url: { type: String, default: '' },
  url_origem: { type: String, default: '' },
  localizacao: { type: String, default: '' },

  vetor_pca: {
    type: [Number],
    default: [],
  },
  vetor_calculado_em: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

petSchema.index({ tipo_animal: 1, disponibilidade: 1 });
petSchema.index({ ong: 1 });

petSchema.methods.calcularIdadeOrdinal = function () {
  const mapa = {
    'abaixo de 2 meses': 0,
    '2 a 6 meses': 1,
    '7 a 11 meses': 2,
    '1 ano': 3,
    '2 anos': 4,
    '3 anos': 5,
    '4 anos': 6,
    '5 anos': 7,
    '6 ou mais anos': 8,
  };
  const chave = this.idade_display.toLowerCase().trim();
  return mapa[chave] ?? null;
};

// pre-save: sincroniza booleans com strings do pipeline
petSchema.pre('save', function (next) {
  const cuidados = [];
  if (this.castrado)   cuidados.push('Castrado');
  if (this.vacinado)   cuidados.push('Vacinado');
  if (this.vermifugado) cuidados.push('Vermifugado');
  if (this.precisa_cuidados_especiais) cuidados.push('Precisa de cuidados especiais');
  this.cuidados_veterinarios = cuidados.join(', ');

  const sociavel = [];
  if (this.sociavel_criancas) sociavel.push('Crianças');
  if (this.sociavel_animais)  sociavel.push('Outros animais');
  this.sociavel_com = sociavel.join(', ');

  const vive = [];
  if (this.aceita_apartamento)  vive.push('Apartamento');
  if (this.aceita_casa_quintal) vive.push('Casa com quintal');
  this.vive_bem_com = vive.join(', ');

  const ordinal = this.calcularIdadeOrdinal();
  if (ordinal !== null) this.idade_ordinal = ordinal;

  next();
});

module.exports = mongoose.model('Pet', petSchema);
