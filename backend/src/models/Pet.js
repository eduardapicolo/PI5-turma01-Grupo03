const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  // ── Campos básicos ──
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
  // Faixa de idade legível (ex: "2 anos", "7 a 11 meses")
  idade_display: {
    type: String,
    required: [true, 'Idade é obrigatória'],
  },
  // Valor ordinal para o pipeline (0-8) — calculado automaticamente
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

  // ── Saúde ──
  castrado: { type: Boolean, default: false },
  vacinado:  { type: Boolean, default: false },
  vermifugado: { type: Boolean, default: false },
  precisa_cuidados_especiais: { type: Boolean, default: false },

  // ── Sociabilidade ──
  sociavel_criancas: { type: Boolean, default: false },
  sociavel_animais:  { type: Boolean, default: false },
  // String completa do campo sociavel_com (pode ter múltiplos valores separados por vírgula)
  sociavel_com: { type: String, default: '' },

  // ── Ambiente ──
  // String completa do campo vive_bem_com
  vive_bem_com: { type: String, default: '' },
  aceita_apartamento:   { type: Boolean, default: false },
  aceita_casa_quintal:  { type: Boolean, default: false },

  // ── Imagens ──
  fotos: [{ type: String }],
  imagem_principal: { type: String, default: '' },
  imagem: { type: String, default: '' },         // campo do scraper

  // ── Origem / ONG ──
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
  url: { type: String, default: '' },            // link de adoção do scraper
  url_origem: { type: String, default: '' },
  localizacao: { type: String, default: '' },    // campo do scraper

  // ── Vetor PCA salvo no banco ──
  vetor_pca: {
    type: [Number],
    default: [],
  },
  vetor_calculado_em: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// ── Índices ──
petSchema.index({ tipo_animal: 1, disponibilidade: 1 });
petSchema.index({ ong: 1 });

// ── Método: mapeia idade_display para ordinal do notebook ──
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

// ── Pre-save: atualiza campos derivados ──
petSchema.pre('save', function (next) {
  // Sincroniza booleans com strings do pipeline
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

  // Idade ordinal
  const ordinal = this.calcularIdadeOrdinal();
  if (ordinal !== null) this.idade_ordinal = ordinal;

  next();
});

// Campo virtual para exibição de cuidados
petSchema.virtual('cuidados_veterinarios').get(function () {
  const c = [];
  if (this.castrado)   c.push('Castrado');
  if (this.vacinado)   c.push('Vacinado');
  if (this.vermifugado) c.push('Vermifugado');
  if (this.precisa_cuidados_especiais) c.push('Precisa de cuidados especiais');
  return c.join(', ');
});

module.exports = mongoose.model('Pet', petSchema);
