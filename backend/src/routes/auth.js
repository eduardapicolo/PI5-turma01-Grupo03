const router = require('express').Router();
const { googleLogin, getMe, updateRole, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

/**
 * POST /api/auth/google
 * Login com Google (recebe credential do Google Identity Services).
 * Body: { credential: string, role?: 'user' | 'ong' }
 */
router.post('/google', googleLogin);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado.
 */
router.get('/me', authenticate, getMe);

/**
 * PATCH /api/auth/me/role
 * Atualiza role do usuário (ex: promover para ONG).
 * Body: { role: 'user' | 'ong', ongName?: string }
 */
router.patch('/me/role', authenticate, updateRole);

/**
 * PATCH /api/auth/me
 * Atualiza informações pessoais (telefone, localizacao).
 */
router.patch('/me', authenticate, updateProfile);

module.exports = router;
