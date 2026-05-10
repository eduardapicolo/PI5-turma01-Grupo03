const mongoose = require('mongoose');

/**
 * Armazena os parâmetros treinados do pipeline ML (scaler + PCA) para cada espécie.
 * Permite que o Node.js aplique as transformações sem dependência de Python em runtime.
 *
 * Gerado pelo script: backend/ml/init_pipeline.py
 */
const pipelineConfigSchema = new mongoose.Schema({
  tipo_animal: {
    type: String,
    enum: ['cachorro', 'gato'],
    required: true,
    unique: true,
  },

  // MinMaxScaler: data_min_ e data_max_ por feature
  scaler_min: { type: [Number], required: true },
  scaler_max: { type: [Number], required: true },

  // PCA: components_ (n_components x n_features) e mean_ (n_features)
  pca_components: { type: [[Number]], required: true },
  pca_mean:       { type: [Number], required: true },
  pca_n_components: { type: Number, required: true },

  // Lista ordenada de colunas do feature vector (antes do PCA)
  colunas: { type: [String], required: true },

  // Variância explicada acumulada
  explained_variance_ratio: { type: [Number], default: [] },

  treinado_em: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('PipelineConfig', pipelineConfigSchema);
