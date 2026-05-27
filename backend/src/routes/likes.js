const router = require('express').Router();
const { toggleLike, getLikes } = require('../controllers/likeController');
const { authenticate } = require('../middlewares/auth');

// todas as rotas de likes precisam de usuario logado
router.use(authenticate);

// lista os pets curtidos pelo usuario
router.get('/',        getLikes);

// alterna like de um pet
// se ja curtiu, remove; se nao curtiu, adiciona
router.post('/:petId', toggleLike);

// exporta as rotas de likes para o app.js
module.exports = router;
