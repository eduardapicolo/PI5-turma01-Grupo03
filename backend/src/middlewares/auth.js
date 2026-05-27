const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  // pega o cabecalho authorization enviado pelo frontend
  // ele deve vir no formato: bearer token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // separa somente o token, removendo a palavra bearer
  const token = authHeader.split(' ')[1];

  try {
    // verifica se o token e valido usando o segredo jwt
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // busca o usuario dono do token no banco
    const user = await User.findById(decoded.id).select('-__v');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    // salva o usuario dentro da requisicao
    // os controllers podem usar req.user depois disso
    req.user = user;

    // libera a requisicao para continuar
    next();
  } catch (err) {
    // se o token estiver errado ou vencido, bloqueia o acesso
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  // garante que existe um usuario autenticado antes de verificar cargo
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // verifica se o cargo do usuario esta na lista permitida
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
  }

  // se passou nas verificacoes, continua para o controller
  next();
};

// atalhos para proteger rotas usadas por ong e admin
const requireOng  = requireRole('ong', 'admin');
const requireAdmin = requireRole('admin');

// exporta os middlewares para as rotas usarem
module.exports = { authenticate, requireRole, requireOng, requireAdmin };
