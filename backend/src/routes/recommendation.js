const router = require('express').Router();
const { recomendar } = require('../controllers/recommendationController');
const { authenticate } = require('../middlewares/auth');

// rota principal da recomendacao
// o frontend envia respostas do questionario para ca
router.post(
  '/',
  (req, res, next) => {
    // autenticacao opcional
    // se tiver token, carrega req.user para usar likes do usuario
    // se nao tiver token, deixa recomendar mesmo assim usando so o questionario
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    next();
  },
  // controller que chama o service e devolve as recomendacoes
  recomendar
);

// exporta a rota de recomendacao para o app.js
module.exports = router;
