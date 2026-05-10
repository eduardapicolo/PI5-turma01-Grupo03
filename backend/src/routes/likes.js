const router = require('express').Router();
const { toggleLike, getLikes } = require('../controllers/likeController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',        getLikes);
router.post('/:petId', toggleLike);

module.exports = router;
