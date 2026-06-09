const Like = require('../models/Like');

const POPULATE_FIELDS = 'nome tipo_animal porte sexo idade_display imagem_principal imagem fotos url localizacao';

const toggleLike = async (req, res, next) => {
  try {
    const existing = await Like.findOne({ user: req.user._id, pet: req.params.petId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    await Like.create({ user: req.user._id, pet: req.params.petId });
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
};

const getLikes = async (req, res, next) => {
  try {
    const populate = req.query.populate === '1';

    let query = Like.find({ user: req.user._id }).sort({ createdAt: -1 });

    query = populate ? query.populate('pet', POPULATE_FIELDS) : query.select('pet -_id');

    const likes = await query;

    const petIds = likes.map((l) => (l.pet?._id ?? l.pet).toString());

    const pets = populate ? likes.map((l) => l.pet).filter(Boolean) : undefined;

    res.json({ petIds, ...(pets && { pets }) });
  } catch (err) {
    next(err);
  }
};

module.exports = { toggleLike, getLikes };
