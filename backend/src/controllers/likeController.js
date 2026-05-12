const Like = require('../models/Like');

// POST /api/likes/:petId — toggle like
const toggleLike = async (req, res, next) => {
  try {
    const { petId } = req.params;
    const userId    = req.user._id;

    const existing = await Like.findOne({ user: userId, pet: petId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    await Like.create({ user: userId, pet: petId });
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/likes
const getLikes = async (req, res, next) => {
  try {
    let query = Like.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (req.query.populate === '1') {
      query = query.populate('pet', 'nome tipo_animal porte sexo idade_display imagem_principal imagem fotos url localizacao');
    } else {
      query = query.select('pet -_id');
    }

    const likes = await query;
    const petIds = likes.map((l) => (l.pet?._id ?? l.pet).toString());
    const pets   = req.query.populate === '1'
      ? likes.map((l) => l.pet).filter(Boolean)
      : undefined;

    res.json({ petIds, ...(pets ? { pets } : {}) });
  } catch (err) {
    next(err);
  }
};

module.exports = { toggleLike, getLikes };
