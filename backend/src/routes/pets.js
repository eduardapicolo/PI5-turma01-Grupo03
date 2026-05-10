const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const {
  listPets, getPet, createPet, updatePet, deletePet,
  myPets, recalcularVetorManual,
} = require('../controllers/petController');
const { authenticate, requireOng } = require('../middlewares/auth');

// Upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são aceitas'));
    }
    cb(null, true);
  },
});

/**
 * GET /api/pets
 * Lista pública de pets com filtros e paginação.
 * Query: tipo_animal, porte, disponibilidade, ong, page, limit
 */
router.get('/', listPets);

/**
 * GET /api/pets/ong/meus
 * Lista pets da ONG autenticada.
 */
router.get('/ong/meus', authenticate, requireOng, myPets);

/**
 * GET /api/pets/:id
 */
router.get('/:id', getPet);

/**
 * POST /api/pets
 * Cria pet (ONG/admin apenas).
 */
router.post('/', authenticate, requireOng, upload.single('foto'), createPet);

/**
 * PUT /api/pets/:id
 */
router.put('/:id', authenticate, requireOng, upload.single('foto'), updatePet);

/**
 * DELETE /api/pets/:id
 */
router.delete('/:id', authenticate, requireOng, deletePet);

/**
 * POST /api/pets/:id/recalcular-vetor
 * Força recálculo do embedding PCA.
 */
router.post('/:id/recalcular-vetor', authenticate, requireOng, recalcularVetorManual);

module.exports = router;
