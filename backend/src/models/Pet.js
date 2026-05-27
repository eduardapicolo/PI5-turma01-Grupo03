const mongoose = require('mongoose');

// mapa usado para transformar idade escrita em numero simples
// esse numero ajuda a ia a comparar idades dos pets
const MAPA_IDADE_ORDINAL = {
  'abaixo de 2 meses': 0, '2 a 6 meses': 1, '7 a 11 meses': 2,
  '1 ano': 3, '2 anos': 4, '3 anos': 5,
  '4 anos': 6, '5 anos': 7, '6 ou mais anos': 8,
};

// cria o modelo de pet no mongodb
// cada campo abaixo representa uma informacao salva sobre o animal
const petSchema = new mongoose.Schema({
  // dados principais exibidos nos cards
  nome:         { type: String, required: [true, 'Nome e obrigatorio'], trim: true },
  tipo_animal:  { type: String, required: [true, 'Tipo do animal e obrigatorio'], enum: ['Cachorro', 'Gato'] },
  raca:         { type: String, default: 'Vira-lata', trim: true },
  porte:        { type: String, required: [true, 'Porte e obrigatorio'], enum: ['Pequeno', 'Médio', 'Grande'] },
  idade_display: { type: String, required: [true, 'Idade e obrigatoria'] },

  // idade em numero usada para facilitar a recomendacao
  idade_ordinal: { type: Number, min: 0, max: 8 },
  sexo:         { type: String, required: [true, 'Sexo e obrigatorio'], enum: ['Macho', 'Fêmea'] },
  pelagem:      { type: String, default: '' },
  descricao:    { type: String, default: '' },

  // cuidados veterinarios marcados pela ong
  castrado:     { type: Boolean, default: false },
  vacinado:     { type: Boolean, default: false },
  vermifugado:  { type: Boolean, default: false },
  precisa_cuidados_especiais: { type: Boolean, default: false },
  cuidados_veterinarios: { type: String, default: '' },

  // informacoes de sociabilidade do pet
  sociavel_criancas: { type: Boolean, default: false },
  sociavel_animais:  { type: Boolean, default: false },
  sociavel_com:      { type: String, default: '' },

  // informa se o pet se adapta melhor a apartamento ou casa com quintal
  vive_bem_com:        { type: String, default: '' },
  aceita_apartamento:  { type: Boolean, default: false },
  aceita_casa_quintal: { type: Boolean, default: false },

  // imagens usadas no frontend
  fotos:            [{ type: String }],
  imagem_principal: { type: String, default: '' },
  imagem:           { type: String, default: '' },

  // ong dona do cadastro do pet
  ong: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // status do pet no processo de adocao
  disponibilidade: { type: String, enum: ['Disponível', 'Adotado', 'Em processo'], default: 'Disponível' },

  // links e localizacao do pet
  url:         { type: String, default: '' },
  url_origem:  { type: String, default: '' },
  localizacao: { type: String, default: '' },
}, { timestamps: true });

// indice para acelerar buscas por tipo e disponibilidade
petSchema.index({ tipo_animal: 1, disponibilidade: 1 });

// indice para acelerar a busca dos pets de uma ong
petSchema.index({ ong: 1 });

// antes de salvar um pet, monta campos de texto usados pela ia
petSchema.pre('save', function (next) {
  // junta apenas os itens verdadeiros em um texto separado por virgula
  const junta = (items) => items.filter(Boolean).join(', ');

  // transforma booleans de cuidados em texto
  this.cuidados_veterinarios = junta([
    this.castrado && 'Castrado',
    this.vacinado && 'Vacinado',
    this.vermifugado && 'Vermifugado',
    this.precisa_cuidados_especiais && 'Precisa de cuidados especiais',
  ]);

  // transforma booleans de sociabilidade em texto
  this.sociavel_com = junta([
    this.sociavel_criancas && 'Crianças',
    this.sociavel_animais && 'Outros animais',
  ]);

  // transforma booleans de moradia em texto
  this.vive_bem_com = junta([
    this.aceita_apartamento && 'Apartamento',
    this.aceita_casa_quintal && 'Casa com quintal',
  ]);

  // calcula a idade ordinal a partir da idade escrita
  const chave = (this.idade_display || '').toLowerCase().trim();
  const ordinal = MAPA_IDADE_ORDINAL[chave];
  if (ordinal !== undefined) this.idade_ordinal = ordinal;

  // avisa o mongoose que pode continuar salvando
  next();
});

// cria a colecao pets no mongodb usando esse formato
module.exports = mongoose.model('Pet', petSchema);
