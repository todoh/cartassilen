// PUNTO DE ENTRADA CENTRAL E INICIALIZACIÓN DE MOTOR CANVAS
function openCanvasEngine() {
  const canvas = document.getElementById('combatCanvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#f4f4f5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  return ctx;
}

function drawCombatIndicator(x, text) {
  const ctx = openCanvasEngine();
  if (!ctx) return;
  ctx.fillStyle = '#09090b';
  ctx.font = '10px monospace';
  ctx.fillText(text, x, 25); // Ajustado para el nuevo Canvas más plano
}

window.onload = function() {
  resetGame();
};

function switchView(viewName) {
  state.view = viewName;
  
  const campaignCont = document.getElementById('campaign-selection-container');
  const mapCont = document.getElementById('map-container');
  const combatCont = document.getElementById('combat-container');
  const editorCont = document.getElementById('editor-container');
  const mainHeaderBtn = document.getElementById('header-editor-btn');
  const backMenuBtn = document.getElementById('header-back-menu-btn');

  // Ocultar todo por defecto de forma limpia
  campaignCont.classList.add('hidden');
  mapCont.classList.add('hidden');
  combatCont.classList.add('hidden');
  editorCont.classList.add('hidden');
  mainHeaderBtn.classList.add('hidden');
  backMenuBtn.classList.add('hidden');
  
  if (viewName === 'CAMPAIGN_SELECT') {
    campaignCont.classList.remove('hidden');
    mainHeaderBtn.classList.remove('hidden'); // Ahora el editor está visible en el menú principal
    renderCampaignSelectionList();
  } else if (viewName === 'MAP') {
    mapCont.classList.remove('hidden');
    mainHeaderBtn.classList.remove('hidden');
    backMenuBtn.classList.remove('hidden');
    renderWorldMap();
  } else if (viewName === 'COMBAT') {
    combatCont.classList.remove('hidden');
    openCanvasEngine();
    updateUI();
  } else if (viewName === 'EDITOR') {
    editorCont.classList.remove('hidden');
    updateEditorUI();
  }
}

function startCombatInstance(health) {
  state.aiHp = health;
  state.playerHp = 20;
  state.turn = 1;
  state.phase = 'PREPARATION';
  state.playerMaxEnergy = 1;
  state.playerEnergy = 1;
  
  state.playerField.forEach(f => { f.character = null; f.equipments = []; f.field = null; });
  state.aiField.forEach(f => { f.character = null; f.equipments = []; f.field = null; });
  
  state.playerHand = []; state.aiHand = [];
  state.playerDeck = generateDeck();
  state.aiDeck = generateDeck();

  for(let i=0; i<4; i++) { drawCard('player'); drawCard('ai'); }
  
  document.getElementById('combat-log').innerHTML = '';
  log(`> Simulación táctica cargada. Enemigo HP: ${health}.`);
  cancelSelection();
  switchView('COMBAT');
  updateUI();
}

function resetGame() {
  state.playerHand = []; state.aiHand = [];
  state.playerGraveyard = []; state.aiGraveyard = [];
  state.currentCampaign = null;
  switchView('CAMPAIGN_SELECT');
}

function drawCard(who) {
  const deck = who === 'player' ? state.playerDeck : state.aiDeck;
  const hand = who === 'player' ? state.playerHand : state.aiHand;
  if (deck.length > 0) hand.push(deck.pop());
}

function checkVictoryConditions() {
  if (state.playerHp <= 0) {
    showVictoryOverlay('DERROTA', 'El Nexo del rival ha destruido tu núcleo.', false);
  } else if (state.aiHp <= 0) {
    const reward = state.currentMapNode && state.currentMapNode.type === 'jefe' ? 100 : 25;
    state.silenPoints += reward;
    showVictoryOverlay('VICTORIA', `Has pulverizado la defensa del rival. Obtenidos +${reward} PS.`, true);
  }
}