const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
  },
}, { timestamps: true });

likeSchema.index({ user: 1, pet: 1 }, { unique: true });
likeSchema.index({ user: 1 });

module.exports = mongoose.model('Like', likeSchema);
