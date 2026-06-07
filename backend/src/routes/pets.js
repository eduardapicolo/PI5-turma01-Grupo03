const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const {
  listPets, getPet, createPet, updatePet, deletePet,
  myPets, informarVetorNaoNecessario,
} = require('../controllers/petController');
const { authenticate, requireOng } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),

  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,

  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são aceitas'));
    }
    cb(null, true);
  },
});

router.get('/', listPets);

router.get('/ong/meus', authenticate, requireOng, myPets);

router.get('/:id', getPet);

router.post('/', authenticate, requireOng, upload.single('foto'), createPet);

router.put('/:id', authenticate, requireOng, upload.single('foto'), updatePet);

router.delete('/:id', authenticate, requireOng, deletePet);

router.post('/:id/recalcular-vetor', authenticate, requireOng, informarVetorNaoNecessario);

module.exports = router;
