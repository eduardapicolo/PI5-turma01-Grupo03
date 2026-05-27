const router = require('express').Router();
const { googleLogin, getMe, updateRole, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// rota de login com google
// recebe credential do frontend e devolve token do sistema
router.post('/google', googleLogin);

// rota para buscar dados do usuario logado
// precisa passar token no header authorization
router.get('/me', authenticate, getMe);

// rota para alterar o tipo da conta
// usada quando uma conta vira ong
router.patch('/me/role', authenticate, updateRole);

// rota para editar telefone e localizacao do usuario
router.patch('/me', authenticate, updateProfile);

// exporta as rotas de autenticacao para o app.js
module.exports = router;
