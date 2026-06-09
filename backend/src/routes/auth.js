const router = require('express').Router();
const { googleLogin, getMe, updateRole, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');


router.post('/google', googleLogin);


router.get('/me', authenticate, getMe);


router.patch('/me/role', authenticate, updateRole);

router.patch('/me', authenticate, updateProfile);

module.exports = router;
