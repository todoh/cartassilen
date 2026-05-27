function showRulesModal() {
  document.getElementById('rules-modal').classList.remove('hidden');
}

function hideRulesModal() {
  document.getElementById('rules-modal').classList.add('hidden');
}

function openGraveyardView() {
  const modal = document.getElementById('graveyard-modal');
  const list = document.getElementById('graveyard-list');
  document.querySelector('#graveyard-modal h2').innerText = 'Zona de Retiro';
  list.innerHTML = '';

  if (state.playerGraveyard.length === 0) {
    list.innerHTML = '<p class="text-xs text-zinc-400 font-mono italic">Retiro vacío.</p>';
  } else {
    state.playerGraveyard.forEach((card, idx) => {
      list.innerHTML += `
        <div class="p-2 bg-zinc-50 flex justify-between items-center font-mono text-xs">
          <div>${card.name}</div>
          <button onclick="reviveFromGraveyard(${idx})" class="bg-zinc-950 text-white text-[9px] px-2 py-1 uppercase">Recuperar (Coste 2)</button>
        </div>
      `;
    });
  }
  modal.classList.remove('hidden');
}

function hideGraveyardModal() {
  document.getElementById('graveyard-modal').classList.add('hidden');
}

function reviveFromGraveyard(index) {
  if (state.playerEnergy < 2) {
    showToast('Error', 'Falta Energía Global.');
    return;
  }
  state.playerEnergy -= 2;
  const card = state.playerGraveyard.splice(index, 1)[0];
  state.playerHand.push(card);
  log(`Recall: [${card.name}] volvió a la mano.`);
  hideGraveyardModal();
  updateUI();
}

// Pantalla previa con información del nodo antes de inicializar la acción/combate
function openNodeInfoPreview(node) {
  const modal = document.getElementById('graveyard-modal');
  const list = document.getElementById('graveyard-list');
  
  document.querySelector('#graveyard-modal h2').innerText = 'INFORMACIÓN DEL NODO';
  list.innerHTML = '';

  let tipoTexto = node.type.toUpperCase();
  let detallesEspecificos = '';
  let botonAccionTexto = 'Inicializar Simulación';

  if (node.type === 'combate') {
    detallesEspecificos = 'Amenaza detectada. Recompensa estimada: +25 PS. Vitalidad del Nexo Rival: 20 HP.';
    botonAccionTexto = 'Iniciar Combate';
  } else if (node.type === 'jefe') {
    detallesEspecificos = 'ALERTA DE SEGURIDAD: Núcleo Central de alta hostilidad. Recompensa: +100 PS. Vitalidad Rival: 40 HP.';
    botonAccionTexto = 'Desafiar Jefe';
  } else if (node.type === 'tienda') {
    detallesEspecificos = 'Punto de intercambio comercial disponible. Permite intercambiar Puntos Silen (PS) por equipamiento y personajes.';
    botonAccionTexto = 'Acceder al Bazar';
  } else if (node.type === 'evento') {
    detallesEspecificos = 'Fluctuación cuántica en el entorno. Escenario interactivo con alteraciones permanentes del sistema.';
    botonAccionTexto = 'Investigar Altar';
  } else if (node.type === 'tesoro') {
    detallesEspecificos = 'Cripta de datos sin protección activa. Contiene reservas puras de Puntos Silen (PS).';
    botonAccionTexto = 'Extraer Recursos';
  }

  if (node.completed) {
    detallesEspecificos = 'Este sector ya ha sido purificado por el sistema. Los flujos energéticos están estables.';
  }

  list.innerHTML = `
    <div class="flex flex-col gap-4 font-mono text-xs text-zinc-600">
      <div class="w-full aspect-video bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-100">
        <img src="${node.img}" onerror="this.style.display='none';" class="w-1/3 object-contain opacity-80"/>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between border-b border-zinc-100 pb-1">
          <span class="text-zinc-400">IDENTIFICADOR:</span>
          <span class="font-bold text-zinc-900">${node.label}</span>
        </div>
        <div class="flex justify-between border-b border-zinc-100 pb-1">
          <span class="text-zinc-400">CLASIFICACIÓN:</span>
          <span class="font-bold text-zinc-900">${tipoTexto}</span>
        </div>
        <div class="flex justify-between border-b border-zinc-100 pb-1">
          <span class="text-zinc-400">ESTADO ACTUAL:</span>
          <span class="font-bold ${node.completed ? 'text-zinc-500' : 'text-emerald-700 animate-pulse'}">
            ${node.completed ? 'COMPLETADO' : 'ACTIVO'}
          </span>
        </div>
        <div class="flex justify-between border-b border-zinc-100 pb-1">
          <span class="text-zinc-400">CONEXIONES SALIENTES:</span>
          <span class="font-bold text-zinc-900">${node.connections.length}</span>
        </div>
      </div>
      <p class="text-[10px] text-zinc-500 bg-zinc-50 p-3 leading-relaxed border border-zinc-100">
        ${detallesEspecificos}
      </p>
      
      ${!node.completed ? `
        <button onclick="executeCurrentNode()" class="w-full bg-zinc-950 text-white text-[10px] py-3 uppercase tracking-widest hover:bg-zinc-800 font-bold mt-2">
          ${botonAccionTexto}
        </button>
      ` : `
        <div class="w-full py-2 bg-zinc-100 text-zinc-400 text-[9px] uppercase tracking-widest text-center">
          Nodo Ya Procesado
        </div>
      `}
    </div>
  `;

  modal.classList.remove('hidden');
}

// Interfaces Especializadas para los Nodos del Sistema RPG de Exploración
function openShopInterface() {
  const shopPool = [
    CARD_DATABASE.characters[4], // Zephyr
    CARD_DATABASE.characters[6], // Null Prime
    CARD_DATABASE.equipments[2]  // Coraza de Titán
  ];
  
  const modal = document.getElementById('graveyard-modal');
  const list = document.getElementById('graveyard-list');
  document.querySelector('#graveyard-modal h2').innerText = 'BAZAR SILEN (TIENDA INTERACTIVA)';
  list.innerHTML = '';

  shopPool.forEach((card) => {
    const price = card.cost * 25;
    list.innerHTML += `
      <div class="p-3 bg-white border border-zinc-100 flex flex-col gap-2 font-mono text-xs">
        <div class="flex justify-between font-bold">
          <span>${card.name}</span>
          <span class="text-emerald-700">${price} PS</span>
        </div>
        <p class="text-[10px] text-zinc-500">${card.type} - ${card.desc || 'Entidad de Combate Táctico.'}</p>
        <button onclick="buyCardFromShop('${card.id}', ${price})" class="w-full bg-zinc-950 text-white text-[10px] py-1.5 uppercase tracking-wider">Adquirir Objeto</button>
      </div>
    `;
  });
  modal.classList.remove('hidden');
}

function buyCardFromShop(id, cost) {
  if (state.silenPoints < cost) {
    showToast('Denegado', 'Puntos Silen (PS) insuficientes.');
    return;
  }
  state.silenPoints -= cost;
  
  let found = [...CARD_DATABASE.characters, ...CARD_DATABASE.equipments, ...CARD_DATABASE.fields].find(c => c.id === id);
  if (found) {
    state.playerHand.push(JSON.parse(JSON.stringify(found)));
    log(`Compra: Añadido permanente de [${found.name}] al arsenal operativo.`);
  }
  hideGraveyardModal();
  concludeNodeExecution();
}

function triggerEventScenario() {
  const logBox = document.getElementById('combat-log');
  const modal = document.getElementById('graveyard-modal');
  const list = document.getElementById('graveyard-list');
  document.querySelector('#graveyard-modal h2').innerText = 'ENCANTAMIENTO: SANTUARIO DE AZUFRE';
  list.innerHTML = `
    <div class="text-xs font-mono text-zinc-600 space-y-3 leading-relaxed">
      <p>Un monumento de arquitectura brutalista destila calor en el camino. Una inscripción solicita tributo de esencia vital.</p>
      <div class="flex flex-col gap-2 mt-4">
        <button onclick="resolveEventScenario(1)" class="w-full text-left p-2 border bg-zinc-50 hover:bg-zinc-100 uppercase text-[10px]">[Opción A] Ofrecer Esencia: El Nexo sufre 4 de daño residual permanentemente. Ignis gana +2 STR durante el resto del viaje.</button>
        <button onclick="resolveEventScenario(2)" class="w-full text-left p-2 border bg-zinc-50 hover:bg-zinc-100 uppercase text-[10px]">[Opción B] Seguir de largo: Ignorar la estructura monolítica y continuar la marcha regular sin alteraciones.</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function resolveEventScenario(choice) {
  if (choice === 1) {
    state.playerHp = Math.max(1, state.playerHp - 4);
    let ignisRef = CARD_DATABASE.characters.find(c => c.id === 'ignis');
    if (ignisRef) ignisRef.str += 2;
    log(`> Pacto consumado. Daño asumido. Ignis imbuido con fuerza destructiva (+2 STR).`);
  } else {
    log(`> Estructura ignorada. No se registran perturbaciones en los flujos internos del sistema.`);
  }
  hideGraveyardModal();
  concludeNodeExecution();
}

function triggerTreasureScenario() {
  const rewards = [30, 45, 60];
  const rolled = rewards[Math.floor(Math.random() * rewards.length)];
  state.silenPoints += rolled;
  log(`> Relicario Purificado: Recompensa de tesoro asimilada correctamente. Añadidos +${rolled} Puntos Silen (PS).`);
  showToast('Tesoro Encontrado', `Has extraído +${rolled} PS.`);
  concludeNodeExecution();
}

function showVictoryOverlay(title, msg, nodeAdvance) {
  const overlay = document.createElement('div');
  overlay.id = 'victory-screen';
  overlay.className = 'fixed inset-0 bg-white flex flex-col justify-center items-center z-50 p-6';
  overlay.innerHTML = `
    <div class="text-center space-y-4 font-mono">
      <h1 class="text-2xl font-bold tracking-widest text-zinc-900">${title}</h1>
      <p class="text-xs text-zinc-400">${msg}</p>
      <button onclick="dismissVictoryAndReset(${nodeAdvance})" class="px-6 py-3 bg-zinc-950 text-white text-xs uppercase tracking-widest">Aceptar y Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function dismissVictoryAndReset(nodeAdvance) {
  const screen = document.getElementById('victory-screen');
  if (screen) screen.remove();
  
  if (nodeAdvance) {
    concludeNodeExecution();
  } else {
    resetGame();
  }
}