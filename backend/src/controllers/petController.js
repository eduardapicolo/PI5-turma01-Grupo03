const petRepository = require('../repositories/petRepository');

function podeEditar(pet, user) {
  // permite editar se o usuario for dono do pet ou admin
  return pet.ong._id.toString() === user._id.toString() || user.role === 'admin';
}

function montarFiltroListagem(query) {
  // pega filtros enviados pela url
  // exemplo: /api/pets?tipo_animal=Gato&porte=Pequeno
  const { tipo_animal, porte, disponibilidade, ong } = query;
  const filter = {};

  // adiciona no filtro apenas o que foi enviado
  if (tipo_animal) filter.tipo_animal = tipo_animal;
  if (porte) filter.porte = porte;
  if (disponibilidade) filter.disponibilidade = disponibilidade;
  if (ong) filter.ong = ong;

  return filter;
}

function montarPaginacao(query) {
  // cria os dados de paginacao para listar pets aos poucos
  return {
    page: +(query.page || 1),
    limit: +(query.limit || 20),
  };
}

function aplicarUploadImagem(data, file, incluirNaLista = false) {
  // se nao veio arquivo de imagem, devolve os dados como estao
  if (!file) return data;

  // monta o caminho publico da imagem salva em uploads
  const imagem = `/uploads/${file.filename}`;

  // salva a imagem como imagem principal
  const atualizado = { ...data, imagem_principal: imagem };

  // ao criar pet, tambem coloca a imagem na lista de fotos
  if (incluirNaLista) atualizado.fotos = [imagem];
  return atualizado;
}

function petNaoEncontrado(res) {
  // resposta padrao quando o id do pet nao existe
  return res.status(404).json({ error: 'Pet nao encontrado' });
}

function semPermissao(res, acao) {
  // resposta padrao quando o usuario nao pode fazer aquela acao
  return res.status(403).json({ error: `Sem permissao para ${acao} este pet` });
}

const listPets = async (req, res, next) => {
  try {
    // monta filtros e paginacao vindos da query da url
    const filter = montarFiltroListagem(req.query);
    const { page, limit } = montarPaginacao(req.query);

    // busca os pets e conta o total ao mesmo tempo
    const [pets, total] = await Promise.all([
      petRepository.findAll(filter, { page, limit }),
      petRepository.count(filter),
    ]);

    // devolve a lista e dados de paginacao para o frontend
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
    // envia erro para o error handler
    next(err);
  }
};

const getPet = async (req, res, next) => {
  try {
    // busca um pet especifico pelo id da url
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);

    // devolve o pet encontrado
    res.json({ data: pet });
  } catch (err) {
    next(err);
  }
};

const createPet = async (req, res, next) => {
  try {
    // junta os dados do formulario com o id da ong logada
    const data = aplicarUploadImagem({ ...req.body, ong: req.user._id }, req.file, true);

    // cria o pet no banco
    const pet = await petRepository.create(data);

    // devolve o pet criado
    res.status(201).json({ data: pet });
  } catch (err) {
    next(err);
  }
};

const updatePet = async (req, res, next) => {
  try {
    // busca o pet antes para verificar se existe e se o usuario pode editar
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);
    if (!podeEditar(pet, req.user)) {
      return semPermissao(res, 'editar');
    }

    // aplica imagem nova se o usuario enviou arquivo
    const updates = aplicarUploadImagem({ ...req.body }, req.file);

    // salva as alteracoes no banco
    const updated = await petRepository.updateById(req.params.id, updates);

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

const deletePet = async (req, res, next) => {
  try {
    // busca o pet antes para verificar permissao
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);
    if (!podeEditar(pet, req.user)) {
      return semPermissao(res, 'excluir');
    }

    // apaga o pet do banco
    await petRepository.deleteById(req.params.id);
    res.json({ message: 'Pet excluido com sucesso' });
  } catch (err) {
    next(err);
  }
};

const myPets = async (req, res, next) => {
  try {
    // lista somente os pets da ong logada
    // se vier disponibilidade na url, filtra por ela tambem
    const filter = req.query.disponibilidade ? { disponibilidade: req.query.disponibilidade } : {};
    const pets = await petRepository.findByOng(req.user._id, filter);
    res.json({ data: pets });
  } catch (err) {
    next(err);
  }
};

const informarVetorNaoNecessario = async (req, res, next) => {
  try {
    // essa rota foi mantida para nao quebrar chamadas antigas
    // agora a ia calcula o pca na hora e nao salva vetor no pet
    const pet = await petRepository.findById(req.params.id);
    if (!pet) return petNaoEncontrado(res);

    res.json({
      message: 'A recomendacao agora calcula o PCA na hora e nao precisa salvar vetor no pet.',
    });
  } catch (err) {
    next(err);
  }
};

// exporta os controllers usados pelas rotas de pets
module.exports = { listPets, getPet, createPet, updatePet, deletePet, myPets, informarVetorNaoNecessario };
