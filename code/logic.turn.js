// GESTOR DE TURNOS Y RESOLUCIÓN MECÁNICA ESTRICTA DE FASES
function endPlayerTurn() {
  state.phase = 'AI_TURN';
  updateUI();
  setTimeout(() => { executeAiTurn(); }, 800);
}

function executeAiTurn() {
  state.aiEnergy = Math.min(10, state.turn);

  state.aiHand.forEach((card, idx) => {
    if (card.hp && state.aiEnergy >= card.cost) {
      for (let i = 0; i < 3; i++) {
        if (!state.aiField[i].character) {
          state.aiField[i].character = JSON.parse(JSON.stringify(card));
          state.aiField[i].character.hasBurn = false;
          state.aiEnergy -= card.cost;
          state.aiHand.splice(idx, 1);
          log(`IA invoca a [${card.name}] en columna ${i}.`);
          break;
        }
      }
    }
  });

  for (let i = 0; i < 3; i++) {
    const c = state.aiField[i].character;
    if (c) {
      // Aplicación estricta de Quemadura al rival en su combate
      if (c.hasBurn) {
        c.hp -= 2;
        log(`> [IA - ${c.name}] sufre 2 de daño por Quemadura extrema.`);
        if (c.hp <= 0) {
          handleDefeat(c, i, 'ai');
          continue;
        }
      }
      const pSlot = state.playerField[i];
      if (!pSlot.character) {
        state.playerHp -= c.str;
        log(`IA inflige ${c.str} daño directo a tu Nexo.`);
      } else {
        executeCombat(c, pSlot.character, i, 'ai');
      }
    }
  }

  startPlayerTurn();
}

function startPlayerTurn() {
  state.turn++;
  state.phase = 'PREPARATION';
  state.playerMaxEnergy = Math.min(10, state.turn);
  state.playerEnergy = state.playerMaxEnergy;

  drawCard('player');
  drawCard('ai');

  for (let i = 0; i < 3; i++) {
    const p = state.playerField[i].character;
    if (p) {
      // PROCESADO MECÁNICO INHERENTE DE LA QUEMADURA AL INICIO DEL TURNO
      if (p.hasBurn) {
        p.hp -= 2;
        log(`> [TÚ - ${p.name}] sufre 2 de daño residual por [Quemadura].`);
        if (p.hp <= 0) {
          handleDefeat(p, i, 'player');
          continue;
        }
      }
      p.hp = Math.min(p.maxHp, p.hp + p.hpRegen);
      // Si está quemado, su generación nativa de EP se reduce limpiamente a la mitad
      const actualEpGain = p.hasBurn ? Math.floor(p.energyRegen / 2) : p.energyRegen;
      p.energy = Math.min(p.maxEnergy, p.energy + actualEpGain);
      p.hasAttackAction = true;
    }
    const a = state.aiField[i].character;
    if (a) {
      a.hp = Math.min(a.maxHp, a.hp + a.hpRegen);
      a.energy = Math.min(a.maxEnergy, a.energy + a.energyRegen);
    }
  }

  log(`--- Turno ${state.turn} de Jugador ---`);
  openCanvasEngine();
  checkVictoryConditions();
  updateUI();
}