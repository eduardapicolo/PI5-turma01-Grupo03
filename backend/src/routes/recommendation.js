const router = require('express').Router();
const { recomendar } = require('../controllers/recommendationController');
const { authenticate } = require('../middlewares/auth');

router.post(
  '/',
  (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    next();
  },
  recomendar
);

module.exports = router;
