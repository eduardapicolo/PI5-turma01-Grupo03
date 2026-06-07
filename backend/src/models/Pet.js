const mongoose = require('mongoose');


const MAPA_IDADE_ORDINAL = {
  'abaixo de 2 meses': 0, '2 a 6 meses': 1, '7 a 11 meses': 2,
  '1 ano': 3, '2 anos': 4, '3 anos': 5,
  '4 anos': 6, '5 anos': 7, '6 ou mais anos': 8,
};


const petSchema = new mongoose.Schema({
  nome:         { type: String, required: [true, 'Nome e obrigatorio'], trim: true },
  tipo_animal:  { type: String, required: [true, 'Tipo do animal e obrigatorio'], enum: ['Cachorro', 'Gato'] },
  raca:         { type: String, default: 'Vira-lata', trim: true },
  porte:        { type: String, required: [true, 'Porte e obrigatorio'], enum: ['Pequeno', 'Médio', 'Grande'] },
  idade_display: { type: String, required: [true, 'Idade e obrigatoria'] },

  idade_ordinal: { type: Number, min: 0, max: 8 },
  sexo:         { type: String, required: [true, 'Sexo e obrigatorio'], enum: ['Macho', 'Fêmea'] },
  pelagem:      { type: String, default: '' },
  descricao:    { type: String, default: '' },

  castrado:     { type: Boolean, default: false },
  vacinado:     { type: Boolean, default: false },
  vermifugado:  { type: Boolean, default: false },
  precisa_cuidados_especiais: { type: Boolean, default: false },
  cuidados_veterinarios: { type: String, default: '' },

  sociavel_criancas: { type: Boolean, default: false },
  sociavel_animais:  { type: Boolean, default: false },
  sociavel_com:      { type: String, default: '' },

  vive_bem_com:        { type: String, default: '' },
  aceita_apartamento:  { type: Boolean, default: false },
  aceita_casa_quintal: { type: Boolean, default: false },

  fotos:            [{ type: String }],
  imagem_principal: { type: String, default: '' },
  imagem:           { type: String, default: '' },

  ong: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  disponibilidade: { type: String, enum: ['Disponível', 'Adotado', 'Em processo'], default: 'Disponível' },

  url:         { type: String, default: '' },
  url_origem:  { type: String, default: '' },
  localizacao: { type: String, default: '' },
}, { timestamps: true });

petSchema.index({ tipo_animal: 1, disponibilidade: 1 });

petSchema.index({ ong: 1 });

petSchema.pre('save', function (next) {
  const junta = (items) => items.filter(Boolean).join(', ');

  this.cuidados_veterinarios = junta([
    this.castrado && 'Castrado',
    this.vacinado && 'Vacinado',
    this.vermifugado && 'Vermifugado',
    this.precisa_cuidados_especiais && 'Precisa de cuidados especiais',
  ]);

  this.sociavel_com = junta([
    this.sociavel_criancas && 'Crianças',
    this.sociavel_animais && 'Outros animais',
  ]);

  this.vive_bem_com = junta([
    this.aceita_apartamento && 'Apartamento',
    this.aceita_casa_quintal && 'Casa com quintal',
  ]);

  const chave = (this.idade_display || '').toLowerCase().trim();
  const ordinal = MAPA_IDADE_ORDINAL[chave];
  if (ordinal !== undefined) this.idade_ordinal = ordinal;

  next();
});

module.exports = mongoose.model('Pet', petSchema);
