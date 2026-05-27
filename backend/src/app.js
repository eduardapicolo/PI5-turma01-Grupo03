require('dotenv').config();

// importa as bibliotecas principais do servidor node
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// importa a conexao com o banco e o tratador de erros
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

// cria o servidor express
const app = express();

// conecta no mongodb quando o backend inicia
connectDB();

// cria a pasta uploads se ela ainda nao existir
// essa pasta guarda imagens enviadas pelas ongs
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// libera o frontend para chamar o backend
// credentials permite enviar dados de autenticacao quando necessario
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// permite que o express leia json enviado pelo frontend
app.use(express.json());

// permite receber formularios simples
app.use(express.urlencoded({ extended: true }));

// mostra no terminal as requisicoes que chegam na api
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// deixa a pasta uploads publica para o frontend conseguir mostrar imagens
app.use('/uploads', express.static(uploadsDir));

// registra as rotas principais da api
// cada arquivo de rota chama um controller especifico
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/recomendacao', require('./routes/recommendation'));
app.use('/api/likes', require('./routes/likes'));

// rota simples para testar se o backend node esta online
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// qualquer erro que sobrar cai aqui para responder em json
app.use(errorHandler);

// define a porta do servidor
const PORT = process.env.PORT || 3001;

// inicia o backend node
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// exporta o app para testes ou reutilizacao
module.exports = app;
