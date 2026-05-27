const errorHandler = (err, req, res, next) => {
  // mostra o erro no terminal para ajudar a descobrir o problema durante testes
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  // erro de validacao do mongoose
  // acontece quando algum campo obrigatorio ou regra do model falha
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Dados inválidos', details: messages });
  }

  // erro de id invalido do mongoose
  // acontece quando a rota recebe um id que nao tem formato de objectid
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // erro de valor duplicado
  // acontece por exemplo quando tenta criar dois usuarios com o mesmo email
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `Valor duplicado no campo: ${field}` });
  }

  // erro de token jwt invalido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // erro de token jwt vencido
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  // se nao for nenhum erro conhecido, responde erro generico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor',
  });
};

// exporta o middleware para o app.js usar no final das rotas
module.exports = errorHandler;
