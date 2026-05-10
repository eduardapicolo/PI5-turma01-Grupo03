/**
 * Gera uma justificativa em texto baseada nas características do pet
 * que contribuem para a compatibilidade com as respostas do questionário.
 */
function gerarJustificativa(pet, respostas) {
  const pontos = [];

  if (respostas.porte && pet.porte === respostas.porte) {
    pontos.push(`porte ${pet.porte.toLowerCase()} que combina com seu perfil`);
  }

  if (respostas.cuidados === 'completo') {
    const cuidados = [];
    if (pet.castrado)    cuidados.push('castrado');
    if (pet.vacinado)    cuidados.push('vacinado');
    if (pet.vermifugado) cuidados.push('vermifugado');
    if (cuidados.length > 0) {
      pontos.push(`saúde em dia (${cuidados.join(', ')})`);
    }
  }

  if (respostas.local === 'Apartamento' && pet.aceita_apartamento) {
    pontos.push('adaptado para apartamento');
  } else if (respostas.local === 'Casa com quintal' && pet.aceita_casa_quintal) {
    pontos.push('ideal para casa com quintal');
  }

  if (respostas.sociavel === 'sim') {
    if (pet.sociavel_criancas && pet.sociavel_animais) {
      pontos.push('sociável com crianças e outros animais');
    } else if (pet.sociavel_criancas) {
      pontos.push('sociável com crianças');
    } else if (pet.sociavel_animais) {
      pontos.push('sociável com outros animais');
    }
  }

  if (respostas.sexo && respostas.sexo !== 'Ambos' && pet.sexo === respostas.sexo) {
    pontos.push(`sexo ${pet.sexo.toLowerCase()} conforme preferência`);
  }

  if (pontos.length === 0) {
    return `${pet.nome} tem um perfil compatível com as suas preferências.`;
  }

  return `${pet.nome} combina com você: ${pontos.join(', ')}.`;
}

module.exports = { gerarJustificativa };
