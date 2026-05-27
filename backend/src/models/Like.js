const mongoose = require('mongoose');

// cria o modelo de like no mongodb
// cada registro significa que um usuario curtiu um pet
const likeSchema = new mongoose.Schema({
  // usuario que deu like
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // pet que recebeu like
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
}, { timestamps: true });

// impede que o mesmo usuario curta o mesmo pet duas vezes
likeSchema.index({ user: 1, pet: 1 }, { unique: true });

// acelera a busca de todos os likes de um usuario
likeSchema.index({ user: 1 });

// cria a colecao likes no mongodb usando esse formato
module.exports = mongoose.model('Like', likeSchema);
