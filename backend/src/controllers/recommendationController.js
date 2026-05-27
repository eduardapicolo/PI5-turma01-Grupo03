const { gerarRecomendacao } = require('../services/recommendationService');

const recomendar = async (req, res, next) => {
  try {
    // recebe os dados do frontend e pede para o service montar a recomendacao
    const resultado = await gerarRecomendacao(req.body, req.user);

    // devolve para o frontend a lista de pets recomendados
    res.json(resultado);
  } catch (err) {
    // se for erro controlado, responde com o status definido pelo service
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    // se for erro inesperado, manda para o error handler
    next(err);
  }
};

// exporta o controller usado pela rota /api/recomendacao
module.exports = { recomendar };
