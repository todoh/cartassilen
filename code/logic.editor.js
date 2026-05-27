// code/logic.editor.js
// GESTIÓN OPERATIVA E INTERCAMBIO DE CARTAS EN EL POOL PERSONALIZADO

// Pool del jugador inicializado con todas las copias desbloqueadas de la base de datos
let playerCardPool = [];
// Variable auxiliar para recordar desde dónde se accedió al editor
let previousViewBeforeEditor = 'CAMPAIGN_SELECT';

function initPlayerPool() {
  if (playerCardPool.length === 0) {
    // Al iniciar por primera vez, el pool contiene 3 copias de cada carta existente
    const databaseSources = [
      ...CARD_DATABASE.characters,
      ...CARD_DATABASE.equipments,
      ...CARD_DATABASE.fields
    ];
    databaseSources.forEach(card => {
      for (let i = 0; i < 3; i++) {
        playerCardPool.push(JSON.parse(JSON.stringify(card)));
      }
    });
  }
}

function openDeckEditor() {
  if (state.view !== 'MAP' && state.view !== 'CAMPAIGN_SELECT') {
    showToast('Denegado', 'Solo puedes editar tu mazo desde el mapa cuántico o el menú principal.');
    return;
  }
  
  // Guardamos la vista previa para saber a dónde regresar
  previousViewBeforeEditor = state.view;
  
  initPlayerPool();
  
  // Si el mazo de state está vacío (o se reinició), inicializar con la autogeneración predeterminada
  if (!state.customPlayerDeck || state.customPlayerDeck.length === 0) {
    if (state.playerDeck && state.playerDeck.length > 0) {
      state.customPlayerDeck = JSON.parse(JSON.stringify(state.playerDeck));
    } else {
      state.customPlayerDeck = generateDeck();
    }
  }

  state.view = 'EDITOR';
  
  // Ocultar cabeceras y contenedores externos, mostrar el editor minimalista
  document.getElementById('campaign-selection-container').classList.add('hidden');
  document.getElementById('map-container').classList.add('hidden');
  document.getElementById('combat-container').classList.add('hidden');
  document.getElementById('header-editor-btn').classList.add('hidden');
  document.getElementById('header-back-menu-btn').classList.add('hidden');
  document.getElementById('editor-container').classList.remove('hidden');
  
  updateEditorUI();
}

function closeDeckEditor() {
  // Regla estructural: El mazo debe tener un número razonable de cartas para no romper el flujo
  if (state.customPlayerDeck.length < 10) {
    showToast('Error Mazo', 'Tu mazo debe contener al menos 10 cartas para estabilizar flujos.');
    return;
  }

  // Sobrescribir el mazo de juego activo
  state.playerDeck = JSON.parse(JSON.stringify(state.customPlayerDeck));
  
  document.getElementById('editor-container').classList.add('hidden');
  
  // Retornamos de forma dinámica a la vista de origen
  if (previousViewBeforeEditor === 'MAP') {
    state.view = 'MAP';
    document.getElementById('header-editor-btn').classList.remove('hidden');
    document.getElementById('header-back-menu-btn').classList.remove('hidden');
    document.getElementById('map-container').classList.remove('hidden');
    renderWorldMap();
  } else {
    state.view = 'CAMPAIGN_SELECT';
    document.getElementById('header-editor-btn').classList.remove('hidden');
    document.getElementById('campaign-selection-container').classList.remove('hidden');
    renderCampaignSelectionList();
  }
  
  showToast('Mazo Guardado', `Estructura fijada con ${state.playerDeck.length} cartas.`);
}

function addCardToDeck(poolIndex) {
  const card = playerCardPool[poolIndex];
  
  // Regla estructural estricta: Máximo 3 copias de la misma carta por ID en el mazo
  const copiesInDeck = state.customPlayerDeck.filter(c => c.id === card.id).length;
  if (copiesInDeck >= 3) {
    showToast('Límite', 'No puedes añadir más de 3 copias de una misma carta.');
    return;
  }

  // Extraer del pool y empujar al mazo personalizado
  const cardCopy = playerCardPool.splice(poolIndex, 1)[0];
  state.customPlayerDeck.push(cardCopy);
  
  updateEditorUI();
}

function removeCardFromDeck(deckIndex) {
  // Retirar del mazo y devolverlo al pool disponible
  const card = state.customPlayerDeck.splice(deckIndex, 1)[0];
  playerCardPool.push(card);
  
  // Reordenar pool por tipos e ID para mantener simetría estética visual
  playerCardPool.sort((a, b) => a.id.localeCompare(b.id));
  
  updateEditorUI();
}