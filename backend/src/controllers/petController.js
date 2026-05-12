const petRepository = require('../repositories/petRepository');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Calcula vetor PCA via FastAPI e salva no banco
async function recalcularVetor(pet) {
  try {
    const res = await fetch(`${FASTAPI_URL}/vectorize`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pet }),
    });
    if (!res.ok) return null;
    const { vetor_pca } = await res.json();
    await petRepository.updateVetorPca(pet._id, vetor_pca);
    return vetor_pca;
  } catch (err) {
    console.warn(`[Pet ${pet._id}] Não foi possível calcular vetor PCA: ${err.message}`);
    return null;
  }
}

// GET /api/pets
const listPets = async (req, res, next) => {
  try {
    const { tipo_animal, porte, disponibilidade, ong, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (tipo_animal)   filter.tipo_animal   = tipo_animal;
    if (porte)         filter.porte         = porte;
    if (disponibilidade) filter.disponibilidade = disponibilidade;
    if (ong)           filter.ong           = ong;

    const [pets, total] = await Promise.all([
      petRepository.findAll(filter, { page: +page, limit: +limit }),
      petRepository.count(filter),
    ]);

    res.json({
      data: pets,
      pagination: {
        total,
        page:      +page,
        limit:     +limit,
        totalPages: Math.ceil(total / +limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/pets/:id
const getPet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });
    res.json({ data: pet });
  } catch (err) {
    next(err);
  }
};

// POST /api/pets
const createPet = async (req, res, next) => {
  try {
    const data = { ...req.body, ong: req.user._id };

    if (req.file) {
      data.imagem_principal = `/uploads/${req.file.filename}`;
      data.fotos = [data.imagem_principal];
    }

    const pet = await petRepository.create(data);

    recalcularVetor(pet).catch(() => {});

    res.status(201).json({ data: pet });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pets/:id
const updatePet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    const isOwner = pet.ong._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este pet' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.imagem_principal = `/uploads/${req.file.filename}`;
    }

    const updated = await petRepository.updateById(req.params.id, updates);

    recalcularVetor(updated).catch(() => {});

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pets/:id
const deletePet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    const isOwner = pet.ong._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para excluir este pet' });
    }

    await petRepository.deleteById(req.params.id);
    res.json({ message: 'Pet excluído com sucesso' });
  } catch (err) {
    next(err);
  }
};

// GET /api/pets/ong/meus
const myPets = async (req, res, next) => {
  try {
    const { disponibilidade } = req.query;
    const filter = disponibilidade ? { disponibilidade } : {};
    const pets = await petRepository.findByOng(req.user._id, filter);
    res.json({ data: pets });
  } catch (err) {
    next(err);
  }
};

// POST /api/pets/:id/recalcular-vetor
const recalcularVetorManual = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    const vetor = await recalcularVetor(pet);
    if (!vetor) {
      return res.status(422).json({ error: 'Não foi possível calcular o vetor. Verifique os campos do pet.' });
    }

    res.json({ message: 'Vetor recalculado', vetor_pca: vetor });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPets, getPet, createPet, updatePet, deletePet, myPets, recalcularVetorManual };
