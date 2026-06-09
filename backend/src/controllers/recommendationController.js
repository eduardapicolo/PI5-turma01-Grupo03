const { gerarRecomendacao } = require('../services/recommendationService');

const recomendar = async (req, res, next) => {
  try {
    const resultado = await gerarRecomendacao(req.body, req.user);

    res.json(resultado);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    next(err);
  }
};

module.exports = { recomendar };
