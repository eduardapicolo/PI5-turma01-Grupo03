const { gerarJustificativa } = require('../services/recommendationService');
const petRepository           = require('../repositories/petRepository');
const userRepository          = require('../repositories/userRepository');
const Like                    = require('../models/Like');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/recomendacao
 *
 * Body:
 *   tipo, porte, idade, local, cuidados, sociavel, sexo — respostas do questionário
 *   topN  (opcional, default 20)
 *   skip  (opcional, default 0)
 */
const recomendar = async (req, res, next) => {
  try {
    const {
      tipo, porte, idade, local, cuidados, sociavel, sexo,
      topN = 20, skip = 0,
    } = req.body;

    if (!tipo || !['Cachorro', 'Gato'].includes(tipo))
      return res.status(400).json({ error: 'tipo deve ser "Cachorro" ou "Gato"' });
    if (!porte || !['Pequeno', 'Médio', 'Grande'].includes(porte))
      return res.status(400).json({ error: 'porte inválido' });
    if (!idade || !['Filhote', 'Adulto', 'Sênior'].includes(idade))
      return res.status(400).json({ error: 'idade inválida' });
    if (!local || !['Apartamento', 'Casa com quintal'].includes(local))
      return res.status(400).json({ error: 'local inválido' });
    if (!cuidados || !['completo', 'depois', 'tanto_faz'].includes(cuidados))
      return res.status(400).json({ error: 'cuidados inválido' });
    if (!sociavel || !['sim', 'nao'].includes(sociavel))
      return res.status(400).json({ error: 'sociavel deve ser "sim" ou "nao"' });
    if (!sexo || !['Macho', 'Fêmea', 'Ambos'].includes(sexo))
      return res.status(400).json({ error: 'sexo deve ser "Macho", "Fêmea" ou "Ambos"' });

    const respostas = { tipo, porte, idade, local, cuidados, sociavel, sexo };

    // Busca pets curtidos: vetores para blending + IDs para exclusão
    let liked_vetores = [];
    let excluded_ids  = [];
    if (req.user) {
      const likes = await Like.find({ user: req.user._id }).select('pet').lean();
      if (likes.length > 0) {
        const likedPetIds = likes.map((l) => l.pet);
        excluded_ids      = likedPetIds.map(String);   // nunca mostrar pets já curtidos

        const likedPets = await petRepository.findByIds(likedPetIds, 'tipo_animal vetor_pca');
        liked_vetores = likedPets
          .filter((p) => p.vetor_pca && p.vetor_pca.length > 0 &&
                         p.tipo_animal.toLowerCase() === tipo.toLowerCase())
          .map((p) => p.vetor_pca);
      }
    }

    // Chama o microserviço FastAPI
    const fastapiRes = await fetch(`${FASTAPI_URL}/recommend`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas, liked_vetores, excluded_ids, top_n: +topN, skip: +skip }),
    });

    if (!fastapiRes.ok) {
      const err = await fastapiRes.json().catch(() => ({}));
      throw new Error(err.detail || `FastAPI respondeu ${fastapiRes.status}`);
    }

    const ranked = await fastapiRes.json(); // [{pet_id, score, distancia}]

    // Busca detalhes completos dos pets
    const petIds = ranked.map((r) => r.pet_id);
    const pets   = await petRepository.findByIds(petIds);
    const petMap = Object.fromEntries(pets.map((p) => [p._id.toString(), p]));

    const recomendacoes = ranked
      .filter((r) => petMap[r.pet_id])
      .map(({ pet_id, score, distancia }) => {
        const pet = petMap[pet_id];
        return {
          pet: {
            _id:              pet._id,
            nome:             pet.nome,
            tipo_animal:      pet.tipo_animal,
            raca:             pet.raca,
            porte:            pet.porte,
            sexo:             pet.sexo,
            idade_display:    pet.idade_display,
            descricao:        pet.descricao,
            fotos:            pet.fotos,
            imagem_principal: pet.imagem_principal,
            imagem:           pet.imagem,
            url:              pet.url,
            localizacao:      pet.localizacao,
            sociavel_criancas: pet.sociavel_criancas,
            sociavel_animais:  pet.sociavel_animais,
          },
          score,
          distancia,
          justificativa: gerarJustificativa(pet, respostas),
        };
      });

    // Persiste respostas no perfil do usuário
    if (req.user) {
      userRepository
        .updateById(req.user._id, { lastQuestionnaireAnswers: respostas })
        .catch(() => {});
    }

    res.json({ tipo, total: recomendacoes.length, recomendacoes });
  } catch (err) {
    next(err);
  }
};

module.exports = { recomendar };
