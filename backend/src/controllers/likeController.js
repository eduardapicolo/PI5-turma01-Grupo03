const Like = require('../models/Like');

// campos do pet que aparecem quando a tela pede os likes completos
const POPULATE_FIELDS = 'nome tipo_animal porte sexo idade_display imagem_principal imagem fotos url localizacao';

const toggleLike = async (req, res, next) => {
  try {
    // procura se o usuario ja curtiu esse pet
    const existing = await Like.findOne({ user: req.user._id, pet: req.params.petId });

    if (existing) {
      // se ja existe like, remove o like
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    // se nao existe like, cria um novo like
    await Like.create({ user: req.user._id, pet: req.params.petId });
    res.json({ liked: true });
  } catch (err) {
    // envia erro para o error handler
    next(err);
  }
};

const getLikes = async (req, res, next) => {
  try {
    // populate=1 significa que o frontend quer os dados completos dos pets curtidos
    const populate = req.query.populate === '1';

    // busca likes do usuario logado do mais novo para o mais antigo
    let query = Like.find({ user: req.user._id }).sort({ createdAt: -1 });

    // se populate for true, traz os dados do pet
    // se nao, traz apenas os ids dos pets
    query = populate ? query.populate('pet', POPULATE_FIELDS) : query.select('pet -_id');

    const likes = await query;

    // monta uma lista de ids dos pets curtidos
    const petIds = likes.map((l) => (l.pet?._id ?? l.pet).toString());

    // quando populate=1, tambem monta a lista de pets completos
    const pets = populate ? likes.map((l) => l.pet).filter(Boolean) : undefined;

    res.json({ petIds, ...(pets && { pets }) });
  } catch (err) {
    // envia erro para o error handler
    next(err);
  }
};

// exporta os controllers usados pelas rotas de likes
module.exports = { toggleLike, getLikes };
