const petRepository = require('../repositories/petRepository');

function podeEditar(pet, user) {
  return pet.ong._id.toString() === user._id.toString() || user.role === 'admin';
}

function montarFiltroListagem(query) {

  const { tipo_animal, porte, disponibilidade, ong } = query;
  const filter = {};

  if (tipo_animal) filter.tipo_animal = tipo_animal;
  if (porte) filter.porte = porte;
  if (disponibilidade) filter.disponibilidade = disponibilidade;
  if (ong) filter.ong = ong;

  return filter;
}

function montarPaginacao(query) {
  return {
    page: +(query.page || 1),
    limit: +(query.limit || 20),
  };
}

function aplicarUploadImagem(data, file, incluirNaLista = false) {
  if (!file) return data;

  const imagem = `/uploads/${file.filename}`;

  const atualizado = { ...data, imagem_principal: imagem };

  if (incluirNaLista) atualizado.fotos = [imagem];
  return atualizado;
}

function petNaoEncontrado(res) {
  return res.status(404).json({ error: 'Pet nao encontrado' });
}

function semPermissao(res, acao) {
  return res.status(403).json({ error: `Sem permissao para ${acao} este pet` });
}

const listPets = async (req, res, next) => {
  try {
    const filter = montarFiltroListagem(req.query);
    const { page, limit } = montarPaginacao(req.query);

    const [pets, total] = await Promise.all([
      petRepository.findAll(filter, { page, limit }),
      petRepository.count(filter),
    ]);

    res.json({
      data: pets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);

    res.json({ data: pet });
  } catch (err) {
    next(err);
  }
};

const createPet = async (req, res, next) => {
  try {
    const data = aplicarUploadImagem({ ...req.body, ong: req.user._id }, req.file, true);

    const pet = await petRepository.create(data);

    res.status(201).json({ data: pet });
  } catch (err) {
    next(err);
  }
};

const updatePet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);
    if (!podeEditar(pet, req.user)) {
      return semPermissao(res, 'editar');
    }

    const updates = aplicarUploadImagem({ ...req.body }, req.file);

    const updated = await petRepository.updateById(req.params.id, updates);

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

const deletePet = async (req, res, next) => {
  try {
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);
    if (!podeEditar(pet, req.user)) {
      return semPermissao(res, 'excluir');
    }

    await petRepository.deleteById(req.params.id);
    res.json({ message: 'Pet excluido com sucesso' });
  } catch (err) {
    next(err);
  }
};

const myPets = async (req, res, next) => {
  try {

    const filter = req.query.disponibilidade ? { disponibilidade: req.query.disponibilidade } : {};
    const pets = await petRepository.findByOng(req.user._id, filter);
    res.json({ data: pets });
  } catch (err) {
    next(err);
  }
};

const informarVetorNaoNecessario = async (req, res, next) => {
  try {

    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);

    res.json({
      message: 'A recomendacao agora calcula o PCA na hora e nao precisa salvar vetor no pet.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPets, getPet, createPet, updatePet, deletePet, myPets, informarVetorNaoNecessario };
