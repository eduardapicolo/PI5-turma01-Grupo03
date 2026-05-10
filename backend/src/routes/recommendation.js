const router = require('express').Router();
const { recomendar } = require('../controllers/recommendationController');
const { authenticate } = require('../middlewares/auth');

/**
 * POST /api/recomendacao
 * Executa o pipeline de recomendação com as respostas do questionário.
 * Autenticação opcional — se logado, salva as respostas no perfil.
 *
 * Body:
 * {
 *   tipo:     'Cachorro' | 'Gato',
 *   porte:    'Pequeno' | 'Médio' | 'Grande',
 *   idade:    'Filhote' | 'Adulto' | 'Sênior',
 *   local:    'Apartamento' | 'Casa com quintal',
 *   cuidados: 'completo' | 'depois' | 'tanto_faz',
 *   sociavel: 'sim' | 'nao',
 *   sexo:     'Macho' | 'Fêmea' | 'Ambos',
 *   topN?:    number
 * }
 */
router.post(
  '/',
  (req, res, next) => {
    // Autenticação opcional: injeta req.user se token presente, mas não bloqueia
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    next();
  },
  recomendar
);

module.exports = router;
