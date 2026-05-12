require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const fs         = require('fs');

const connectDB    = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes           = require('./routes/auth');
const petRoutes            = require('./routes/pets');
const recommendationRoutes = require('./routes/recommendation');
const likeRoutes           = require('./routes/likes');

const app = express();

connectDB();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth',         authRoutes);
app.use('/api/pets',         petRoutes);
app.use('/api/recomendacao', recommendationRoutes);
app.use('/api/likes',        likeRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.get('/api/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/google':       'Login com Google (credential + role)',
        'GET  /api/auth/me':           'Dados do usuário autenticado [JWT]',
        'PATCH /api/auth/me/role':     'Atualizar role (user → ong) [JWT]',
      },
      pets: {
        'GET  /api/pets':                       'Listar pets (public) [?tipo_animal, porte, disponibilidade, page, limit]',
        'GET  /api/pets/:id':                   'Detalhes de um pet (public)',
        'GET  /api/pets/ong/meus':              'Pets da ONG autenticada [JWT+ONG]',
        'POST /api/pets':                       'Criar pet [JWT+ONG] multipart/form-data',
        'PUT  /api/pets/:id':                   'Editar pet [JWT+ONG]',
        'DELETE /api/pets/:id':                 'Excluir pet [JWT+ONG]',
        'POST /api/pets/:id/recalcular-vetor':  'Recalcular embedding PCA [JWT+ONG]',
      },
      recomendacao: {
        'POST /api/recomendacao': `Recomendação por questionário.
Body: { tipo, porte, idade, local, cuidados, sociavel, sexo, topN? }
Retorna: [ { pet, score, distancia, justificativa } ]`,
      },
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/api/docs`);
});

module.exports = app;
