const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const userRepository = require('../repositories/userRepository');

// cria o cliente do google usando o client id configurado no .env
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(userId) {
  // cria um token jwt proprio do sistema
  // o frontend guarda esse token para acessar rotas protegidas depois
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const googleLogin = async (req, res, next) => {
  try {
    // credential e o token que o google envia para o frontend
    // role diz se a pessoa quer entrar como user ou ong
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'credential é obrigatório' });
    }

    // verifica com o google se o credential e verdadeiro
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // pega os dados basicos que vieram do google
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // tenta encontrar usuario pelo google id
    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      // se nao encontrar pelo google id, tenta encontrar pelo email
      user = await userRepository.findByEmail(email);
    }

    // se veio role ong, cria ou valida como ong
    // qualquer outro valor vira user por seguranca
    const requestedRole = role === 'ong' ? 'ong' : 'user';

    if (!user) {
      // primeiro acesso cria uma conta nova
      user = await userRepository.create({
        googleId,
        email,
        name,
        avatar: picture,
        role: requestedRole,
        ongName: requestedRole === 'ong' ? name : null,
      });
    } else {
      // se a conta ja existe, verifica se a pessoa escolheu o tipo certo de login
      // admin entra pelo fluxo de ong porque tambem pode gerenciar pets
      const existingRole = user.role === 'admin' ? 'ong' : user.role;
      if (existingRole !== requestedRole) {
        const msg = existingRole === 'ong'
          ? 'Esta conta está cadastrada como ONG. Selecione "Sou uma ONG" ou entre com uma conta diferente.'
          : 'Esta conta está cadastrada como Adotante. Selecione "Sou Adotante" ou entre com uma conta diferente.';
        return res.status(403).json({ error: msg });
      }

      // se era uma conta antiga sem google id, salva o google id agora
      if (!user.googleId) {
        await userRepository.updateById(user._id, { googleId, avatar: picture || user.avatar });
        user.googleId = googleId;
      }
    }

    // gera o token do sistema para o frontend usar nas proximas chamadas
    const token = generateToken(user._id);

    // devolve o token e os dados principais do usuario
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

const getMe = async (req, res) => {
  // req.user vem do middleware authenticate
  // essa rota devolve os dados do usuario logado
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

const updateRole = async (req, res, next) => {
  try {
    // pega o novo tipo de conta enviado pelo frontend
    const { role, ongName } = req.body;

    if (!['user', 'ong'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    // monta somente os campos que podem ser atualizados
    const updates = { role };
    if (role === 'ong' && ongName) updates.ongName = ongName;

    // salva a alteracao no banco
    const updated = await userRepository.updateById(req.user._id, updates);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    // pega os dados editaveis do perfil
    const { telefone, localizacao } = req.body;
    const updates = {};

    // so atualiza se o campo foi enviado
    if (telefone  !== undefined) updates.telefone  = String(telefone).trim();
    if (localizacao !== undefined) updates.localizacao = String(localizacao).trim();

    // salva no banco e devolve o usuario atualizado
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

// exporta os controllers usados pelas rotas de auth
module.exports = { googleLogin, getMe, updateRole, updateProfile };
