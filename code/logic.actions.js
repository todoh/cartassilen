// code/logic.actions.js
// MANIPULACIÓN OPERATIVA DE INTERACCIONES Y CARTAS EN COMBATE
function selectHandCard(index) {
  selectedHandIndex = index;
  const card = state.playerHand[index];
  const panel = document.getElementById('action-panel');
  const text = document.getElementById('action-panel-text');
  
  panel.classList.remove('hidden');
  text.innerHTML = `Elegido: <strong>${card.name}</strong> (Costo: ${card.cost} Global). Selecciona columna destino.`;
  renderPlayerHand();
}

function handleArenaDrop(side, col) {
  // Sincroniza el drop con la selección del estado global antes de ejecutar la acción estándar
  if (selectedHandIndex !== null) {
    handleArenaClick(side, col);
  }
}

function handleArenaClick(side, col) {
  if (selectedHandIndex === null) return;
  const card = state.playerHand[selectedHandIndex];

  if (state.playerEnergy < card.cost) {
    showToast('Denegado', 'Energía Global insuficiente.');
    cancelSelection();
    return;
  }

  if (card.hp) {
    if (side !== 'player' || state.playerField[col].character) return;
    state.playerField[col].character = JSON.parse(JSON.stringify(card));
    state.playerField[col].character.hasAttackAction = true;
    state.playerField[col].character.hasBurn = false; // Flag nativo de quemadura limpio
    state.playerEnergy -= card.cost;
    state.playerHand.splice(selectedHandIndex, 1);
    log(`Invocado [${card.name}] en columna ${col}.`);
  } else if (card.type === 'Equipo') {
    if (side !== 'player' || !state.playerField[col].character) return;
    if (state.playerField[col].equipments.length >= 2) return;
    state.playerField[col].equipments.push(JSON.parse(JSON.stringify(card)));
    state.playerEnergy -= card.cost;
    state.playerHand.splice(selectedHandIndex, 1);
    log(`Equipado [${card.name}] en columna ${col}.`);
  } else if (card.type === 'Campo') {
    if (side !== 'player') return;
    state.playerField[col].field = JSON.parse(JSON.stringify(card));
    state.playerEnergy -= card.cost;
    state.playerHand.splice(selectedHandIndex, 1);
    log(`Campo [${card.name}] activo en columna ${col}.`);
  }

  cancelSelection();
  updateUI();
}

function cancelSelection() {
  selectedHandIndex = null;
  document.getElementById('action-panel').classList.add('hidden');
  renderPlayerHand();
}

function triggerAttack(col, event) {
  if (event) event.stopPropagation();
  const slot = state.playerField[col];
  if (!slot.character || !slot.character.hasAttackAction) return;

  slot.character.hasAttackAction = false;
  const defSlot = state.aiField[col];

  if (!defSlot.character) {
    const dmg = slot.character.str;
    state.aiHp -= dmg;
    log(`¡Daño directo a la IA! [${slot.character.name}] inflige ${dmg} de daño.`);
    drawCombatIndicator(160, `💥 Direct -${dmg}`);
  } else {
    executeCombat(slot.character, defSlot.character, col, 'player');
  }

  checkVictoryConditions();
  updateUI();
}

function showTechniqueMenu(col, event) {
  if (event) event.stopPropagation();
  const char = state.playerField[col].character;
  if (!char) return;
  const tech = char.techniques[0];

  if (char.energy < tech.cost) {
    showToast('Falta EP', 'Energía del Personaje insuficiente.');
    return;
  }

  executeTechnique(col, tech);
}