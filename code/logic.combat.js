function executeCombat(attacker, defender, col, attackingSide) {
  // Log de combate refinado explícito con desglose analítico de efectos aplicados
  log(`Combate directo: [${attacker.name}] vs [${defender.name}] en columna ${col}.`);

  let first = attacker;
  let second = defender;
  if (defender.spd > attacker.spd) {
    first = defender;
    second = attacker;
  }

  // REVISIÓN Y RECALIBRACIÓN MATEMÁTICA DE PROBABILIDAD DE LA REGLA BLITZ
  const hitProb = Math.min(100, Math.max(30, 70 + (first.dex - second.agi) * 6));
  const roll = Math.random() * 100;
  let damageDealt = 0;

  if (roll <= hitProb) {
    // Soporte integrado para mitigar daño por el atributo 'arm' de las nuevas Armaduras
    const defense = second.arm || 0;
    damageDealt = Math.max(1, first.str - defense);
    second.hp -= damageDealt;
    log(`¡Impacto Confirmado! [${first.name}] inflige ${damageDealt} PF (Defensa absorbida: ${defense}) a [${second.name}].`);
    drawCombatIndicator(attackingSide === 'player' ? 20 : 180, `-${damageDealt}`);
  } else {
    log(`Evadido: [${first.name}] erró la trayectoria de ataque contra [${second.name}].`);
    drawCombatIndicator(attackingSide === 'player' ? 20 : 180, 'Miss');
  }

  if (second.hp <= 0) {
    log(`Destrucción: [${second.name}] ha caído en combate sin opción de réplica.`);
    handleDefeat(second, col, attackingSide === 'player' ? 'ai' : 'player');
    return;
  }

  // REGLA BLITZ EVALUADA CON PRECISIÓN DE UMBRAL ESTRICTO
  const spdDiff = attacker.spd - defender.spd;
  if (spdDiff >= 2 && attackingSide === 'player') {
    log(`⚡ Blitz Activo: La ventaja de SPD (+${spdDiff}) anula por completo el contraataque de [${defender.name}].`);
    showToast('Blitz', 'Velocidad superior. Sin contraataque.');
    return;
  }

  // Intento de contraataque estándar
  const counterHit = Math.min(100, Math.max(25, 75 + (second.dex - first.agi) * 5));
  if (Math.random() * 100 <= counterHit) {
    const counterDefense = first.arm || 0;
    const counterDmg = Math.max(1, second.str - counterDefense);
    first.hp -= counterDmg;
    log(`Contraataque Ejecutado: [${second.name}] inflige ${counterDmg} de daño de respuesta a [${first.name}].`);
    if (first.hp <= 0) {
      log(`[${first.name}] colapsa producto del contraataque.`);
      handleDefeat(first, col, attackingSide === 'player' ? 'player' : 'ai');
    }
  }
}

function handleDefeat(character, col, side) {
  const field = side === 'player' ? state.playerField[col] : state.aiField[col];
  const graveyard = side === 'player' ? state.playerGraveyard : state.aiGraveyard;

  if (field.equipments.length > 0) {
    field.equipments.forEach(eq => {
      if (side === 'player') {
        state.playerHand.push(eq);
        log(`Retiro: Regla de Persistencia Activa. [${eq.name}] regresa íntegro a tu mano.`);
      } else {
        state.aiHand.push(eq);
      }
    });
    field.equipments = [];
  }

  graveyard.push(field.character);
  field.character = null;
  showToast('Baja', `${character.name} destruido.`);
}

function executeTechnique(col, tech) {
  const field = state.playerField[col];
  const char = field.character;
  const defenderField = state.aiField[col];

  if (!char) return;
  char.energy -= tech.cost;
  log(`[${char.name}] desata técnica activa: [${tech.name}]`);

  // BALANCE RECALIBRADO DE EXPLOSIÓN DE MAGMA (POW + 5) E INFUSIÓN DE QUEMADURA
  if (tech.name === 'Explosión de Magma') {
    const rawDmg = char.pow + 5;
    if (!defenderField.character) {
      state.aiHp -= rawDmg;
      log(`Impacto crítico de Magma directo al Nexo rival. ${rawDmg} de daño irreversible.`);
    } else {
      const defender = defenderField.character;
      const netDmg = Math.max(1, rawDmg - (defender.mnd || 0));
      defender.hp -= netDmg;
      defender.hasBurn = true; // Infunde el estado de quemadura de forma estricta
      log(`Fuego de Magma causó ${netDmg} daño mágico a [${defender.name}] y le infunde [Quemadura].`);
      if (defender.hp <= 0) handleDefeat(defender, col, 'ai');
    }
  } else {
    // Lógica estándar para el resto de técnicas
    if (!defenderField.character) {
      const dmg = char.pow;
      state.aiHp -= dmg;
      log(`Impacto directo de técnica al Nexo. ${dmg} de daño elemental.`);
    } else {
      const defender = defenderField.character;
      const netDmg = Math.max(1, char.pow - defender.mnd);
      defender.hp -= netDmg;
      log(`Técnica causó ${netDmg} daño mágico a [${defender.name}].`);
      if (defender.hp <= 0) handleDefeat(defender, col, 'ai');
    }
  }
  checkVictoryConditions();
  updateUI();
}