const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const {
  listPets, getPet, createPet, updatePet, deletePet,
  myPets, informarVetorNaoNecessario,
} = require('../controllers/petController');
const { authenticate, requireOng } = require('../middlewares/auth');

// configura onde as imagens enviadas pelas ongs serao salvas
const storage = multer.diskStorage({
  // destination escolhe a pasta de destino do arquivo
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),

  // filename cria um nome com data para diminuir chance de repetir nome
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// configura o multer, que recebe arquivos enviados por formulario
const upload = multer({
  storage,

  // limita imagem em 10mb
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // aceita somente arquivos de imagem
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são aceitas'));
    }
    cb(null, true);
  },
});

// lista pets publicos com filtros opcionais
router.get('/', listPets);

// lista pets da ong logada
router.get('/ong/meus', authenticate, requireOng, myPets);

// busca um pet pelo id
router.get('/:id', getPet);

// cria pet novo
// precisa estar logado como ong ou admin
router.post('/', authenticate, requireOng, upload.single('foto'), createPet);

// edita pet existente
// tambem pode receber uma foto nova
router.put('/:id', authenticate, requireOng, upload.single('foto'), updatePet);

// apaga pet existente
router.delete('/:id', authenticate, requireOng, deletePet);

// rota antiga mantida para compatibilidade
// agora o sistema nao salva vetor no pet, entao ela apenas informa isso
router.post('/:id/recalcular-vetor', authenticate, requireOng, informarVetorNaoNecessario);

// exporta as rotas de pets para o app.js
module.exports = router;
