const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // conecta o mongoose no mongodb usando a url do arquivo .env
    // essa conexao e usada por todos os models do backend
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'PetMatch',
    });

    // mostra no terminal que o banco conectou corretamente
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (err) {
    // se nao conectar, o backend nao consegue funcionar
    // por isso o processo e encerrado
    console.error('Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }
};

// exporta a funcao para o app.js chamar quando o servidor iniciar
module.exports = connectDB;
