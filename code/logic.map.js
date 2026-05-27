// CONFIGURACIÓN DINÁMICA DE CAMPAÑAS SIMULADAS
const CAMPAIGNS_DATA = {
  taira: {
    title: "Protocolo TAIRA — Éxodo Cuántico",
    desc: "Explora los límites del desbordamiento cósmico post-overflow.",
    banner: "assets/banner_taira.png", // Reemplazar por ruta de imagen real o dejar que cargue fallback texto
    nodes: [
      { id: 0, type: 'combate', label: 'Inicio', fase: 0, connections: [1, 2], completed: false, active: true, img: 'assets/node_start.png' },
      { id: 1, type: 'tienda', label: 'Bazar Silen', fase: 1, connections: [3, 4], completed: false, active: false, img: 'assets/node_shop.png' },
      { id: 2, type: 'evento', label: 'Santuario', fase: 1, connections: [3, 4], completed: false, active: false, img: 'assets/node_event.png' },
      { id: 3, type: 'tesoro', label: 'Relicario', fase: 2, connections: [5], completed: false, active: false, img: 'assets/node_treasure.png' },
      { id: 4, type: 'combate', label: 'Guardia Real', fase: 2, connections: [5], completed: false, active: false, img: 'assets/node_fight.png' },
      { id: 5, type: 'jefe', label: 'Núcleo Central', fase: 3, connections: [], completed: false, active: false, img: 'assets/node_boss.png' }
    ]
  },
  onube: {
    title: "El Cántaro de Onube — Mundos Púrpuras",
    desc: "Arquitectura hermética y mitologías olvidadas en la costa de la marea alta.",
    banner: "assets/banner_onube.png",
    nodes: [
      { id: 0, type: 'evento', label: 'Umbral Púrpura', fase: 0, connections: [1], completed: false, active: true, img: 'assets/node_event.png' },
      { id: 1, type: 'combate', label: 'Faro de Azufre', fase: 1, connections: [2, 3], completed: false, active: false, img: 'assets/node_fight.png' },
      { id: 2, type: 'tienda', label: 'Intercambio Marítimo', fase: 2, connections: [4], completed: false, active: false, img: 'assets/node_shop.png' },
      { id: 3, type: 'tesoro', label: 'Cripta Sumergida', fase: 2, connections: [4], completed: false, active: false, img: 'assets/node_treasure.png' },
      { id: 4, type: 'jefe', label: 'Monolito de la Bahía', fase: 3, connections: [], completed: false, active: false, img: 'assets/node_boss.png' }
    ]
  }
};

// CONTROLADORES DE RUTA Y SIMULACIÓN DE NODOS RPG
function loadCampaign(campaignId) {
  if (!CAMPAIGNS_DATA[campaignId]) return;
  state.currentCampaign = campaignId;
  state.silenPoints = 0;
  // Deep clone de la estructura de nodos para no modificar la plantilla estática original
  state.mapNodes = JSON.parse(JSON.stringify(CAMPAIGNS_DATA[campaignId].nodes));
  log(`Cargada campaña: ${CAMPAIGNS_DATA[campaignId].title}`);
  switchView('MAP');
}

function exitToMainMenu() {
  state.currentCampaign = null;
  state.mapNodes = [];
  switchView('CAMPAIGN_SELECT');
}

function initWorldMap() {
  // Ahora inicializa mediante la selección de campañas en el UI
  if (state.currentCampaign && CAMPAIGNS_DATA[state.currentCampaign]) {
    state.mapNodes = JSON.parse(JSON.stringify(CAMPAIGNS_DATA[state.currentCampaign].nodes));
  }
}

function selectMapNode(id) {
  const node = state.mapNodes.find(n => n.id === id);
  if (!node || (!node.active && !node.completed)) {
    showToast('Bloqueado', 'No puedes acceder a este nodo aún.');
    return;
  }
  
  state.currentMapNode = node;
  log(`Previsualizando Nodo [${node.label}] de tipo: ${node.type.toUpperCase()}.`);
  
  // En lugar de inicializar directamente el nodo, abrimos la pantalla de información previa
  openNodeInfoPreview(node);
}

function executeCurrentNode() {
  const node = state.currentMapNode;
  if (!node) return;

  log(`Inicializando simulación táctica en: ${node.label}`);
  hideGraveyardModal(); // Cerramos el panel/modal informativo

  if (node.type === 'combate') {
    startCombatInstance(20);
  } else if (node.type === 'jefe') {
    startCombatInstance(40);
  } else if (node.type === 'tienda') {
    openShopInterface();
  } else if (node.type === 'evento') {
    triggerEventScenario();
  } else if (node.type === 'tesoro') {
    triggerTreasureScenario();
  }
}

function concludeNodeExecution() {
  if (state.currentMapNode) {
    state.currentMapNode.completed = true;
    state.currentMapNode.active = false;
    
    // Activar los nodos conectados directamente en el DAG
    state.currentMapNode.connections.forEach(connId => {
      const target = state.mapNodes.find(n => n.id === connId);
      if (target) target.active = true;
    });
  }
  switchView('MAP');
}