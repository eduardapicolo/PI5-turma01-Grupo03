const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const userRepository = require('../repositories/userRepository');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/google
 * Recebe o ID token do Google (gerado pelo frontend com Google Sign-In)
 * e autentica/cria o usuário, retornando um JWT próprio.
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'credential é obrigatório' });
    }

    // Verifica o ID token com a API do Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Busca ou cria usuário
    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      user = await userRepository.findByEmail(email);
    }

    const requestedRole = role === 'ong' ? 'ong' : 'user';

    if (!user) {
      // Primeiro acesso — cria conta com o role selecionado
      user = await userRepository.create({
        googleId,
        email,
        name,
        avatar: picture,
        role: requestedRole,
        ongName: requestedRole === 'ong' ? name : null,
      });
    } else {
      // Conta já existe — valida que o role bate
      const existingRole = user.role === 'admin' ? 'ong' : user.role; // admin age como ong
      if (existingRole !== requestedRole) {
        const msg = existingRole === 'ong'
          ? 'Esta conta está cadastrada como ONG. Selecione "Sou uma ONG" ou entre com uma conta diferente.'
          : 'Esta conta está cadastrada como Adotante. Selecione "Sou Adotante" ou entre com uma conta diferente.';
        return res.status(403).json({ error: msg });
      }

      // Atualiza googleId / avatar se não existia
      if (!user.googleId) {
        await userRepository.updateById(user._id, { googleId, avatar: picture || user.avatar });
        user.googleId = googleId;
      }
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id:                      user._id,
        name:                     user.name,
        email:                    user.email,
        avatar:                   user.avatar,
        role:                     user.role,
        ongName:                  user.ongName,
        lastQuestionnaireAnswers: user.lastQuestionnaireAnswers || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Retorna o usuário autenticado (requer Bearer token).
 */
const getMe = async (req, res) => {
  res.json({
    user: {
      _id:         req.user._id,
      name:        req.user.name,
      email:       req.user.email,
      avatar:      req.user.avatar,
      role:        req.user.role,
      ongName:     req.user.ongName,
      telefone:    req.user.telefone ?? '',
      localizacao: req.user.localizacao ?? '',
      lastQuestionnaireAnswers: req.user.lastQuestionnaireAnswers,
    },
  });
};

/**
 * PATCH /api/auth/me/role
 * Permite que um usuário promova sua conta para ONG (e informe o nome da ONG).
 */
const updateRole = async (req, res, next) => {
  try {
    const { role, ongName } = req.body;

    if (!['user', 'ong'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    const updates = { role };
    if (role === 'ong' && ongName) updates.ongName = ongName;

    const updated = await userRepository.updateById(req.user._id, updates);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/me
 * Atualiza informações pessoais do usuário (telefone, localizacao).
 */
const updateProfile = async (req, res, next) => {
  try {
    const { telefone, localizacao } = req.body;
    const updates = {};
    if (telefone  !== undefined) updates.telefone  = String(telefone).trim();
    if (localizacao !== undefined) updates.localizacao = String(localizacao).trim();

    const updated = await userRepository.updateById(req.user._id, updates);
    res.json({
      user: {
        _id:         updated._id,
        name:        updated.name,
        email:       updated.email,
        avatar:      updated.avatar,
        role:        updated.role,
        ongName:     updated.ongName,
        telefone:    updated.telefone,
        localizacao: updated.localizacao,
        lastQuestionnaireAnswers: updated.lastQuestionnaireAnswers || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { googleLogin, getMe, updateRole, updateProfile };
