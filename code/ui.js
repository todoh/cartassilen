// code/ui.js
function updateUI() {
  document.getElementById('silen-points-display').innerText = `${state.silenPoints} PS`;
  document.getElementById('turn-display').innerText = `T. ${state.turn}`;
  
  document.getElementById('player-hp-txt').innerText = `${state.playerHp}/20`;
  document.getElementById('player-hp-bar').style.width = `${Math.max(0, (state.playerHp / 20) * 100)}%`;
  
  const maxAiHp = state.currentMapNode && state.currentMapNode.type === 'jefe' ? 40 : 20;
  document.getElementById('ai-hp-txt').innerText = `${state.aiHp}/${maxAiHp}`;
  document.getElementById('ai-hp-bar').style.width = `${Math.max(0, (state.aiHp / maxAiHp) * 100)}%`;

  document.getElementById('player-energy').innerText = `${state.playerEnergy}/${state.playerMaxEnergy}`;
  document.getElementById('player-graveyard-count').innerText = state.playerGraveyard.length;
  document.getElementById('ai-graveyard-count').innerText = state.aiGraveyard.length;
  document.getElementById('deck-count').innerText = `Mazo: ${state.playerDeck.length}`;

  renderPlayerHand();
  renderBoard();
}

function toggleMobileLog() {
  const logModal = document.getElementById('mobile-log-modal');
  if (!logModal) return;
  
  if (logModal.classList.contains('hidden')) {
    logModal.classList.remove('hidden');
  } else {
    logModal.classList.add('hidden');
  }
}

function renderCampaignSelectionList() {
  const container = document.getElementById('campaign-list-wrapper');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(CAMPAIGNS_DATA).forEach((key) => {
    const campaign = CAMPAIGNS_DATA[key];
    const item = document.createElement('div');
    
    // Diseño brutalista minimalista: banner ultra-ancho, tipografía limpia mono, bordes finos.
    item.className = "w-full border border-zinc-100 bg-zinc-50 relative overflow-hidden group cursor-pointer transition-colors hover:bg-zinc-100 flex flex-col justify-end min-h-[140px] sm:min-h-[180px] p-6";
    item.onclick = () => loadCampaign(key);
    
    // Se ha añadido la clase 'hidden' a la div con el título y la descripción para ocultarla.
    item.innerHTML = `
      ${campaign.banner ? `<img src="${campaign.banner}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300 pointer-events-none z-0"/>` : ''}
      <div class="hidden z-10 w-full relative bg-white/60 backdrop-blur-xs p-2 max-w-xl border border-zinc-100/50">
        <span class="text-[8px] font-mono tracking-widest text-zinc-500 uppercase">System Deployment Active</span>
        <h3 class="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-900 mt-1 font-mono">${campaign.title}</h3>
        <p class="text-[10px] text-zinc-600 font-mono mt-1 leading-relaxed">${campaign.desc}</p>
      </div>
      <div class="absolute top-4 right-4 text-zinc-900 bg-white/80 px-2 py-1 border border-zinc-100 transition-colors text-xs font-mono font-bold">
        ENTER →
      </div>
    `;
    container.appendChild(item);
  });
}

function renderPlayerHand() {
  const container = document.getElementById('player-hand');
  if (!container) return;
  container.innerHTML = '';

  state.playerHand.forEach((card, index) => {
    const isSelected = selectedHandIndex === index;
    const cardDiv = document.createElement('div');
    
    let aspectClass = "min-h-[130px] sm:min-h-[180px]";
    if (card.type === 'Equipo' || card.type === 'Campo') {
      aspectClass = "min-h-[100px] sm:min-h-[140px]";
    }

    cardDiv.className = `min-w-[100px] sm:min-w-[140px] max-w-[100px] sm:max-w-[140px] ${aspectClass} p-2 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all border shrink-0 snap-inline relative overflow-hidden ${
      isSelected ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-900 border-zinc-100 hover:bg-zinc-100'
    }`;
    
    // Implementación Drag and Drop Nativa
    cardDiv.draggable = true;
    cardDiv.ondragstart = (e) => {
      selectedHandIndex = index;
      e.dataTransfer.setData('text/plain', index);
      cardDiv.classList.add('opacity-50');
    };
    cardDiv.ondragend = () => {
      cardDiv.classList.remove('opacity-50');
    };

    // Mantenemos el click tradicional como fallback táctil plano
    cardDiv.onclick = (e) => {
      e.stopPropagation();
      selectHandCard(index);
    };

    let cardContent = '';

    if (card.hp) {
      cardContent = `
        ${card.img ? `<img src="${card.img}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover object-center opacity-80 pointer-events-none z-0"/>` : ''}
        
        <div class="absolute top-1.5 left-1.5 z-10 text-[6px] sm:text-[8px] uppercase tracking-wider font-mono opacity-60">⚡ ${card.cost} GLB</div>
        
        <div class="mt-auto w-full z-10 pt-8 bg-gradient-to-t ${isSelected ? 'from-zinc-950 via-zinc-950/80' : 'from-zinc-50 via-zinc-50/80'} to-transparent relative">
          <div class="text-[9px] sm:text-xs font-bold leading-tight truncate">${card.name}</div>
          <div class="text-[7px] sm:text-[9px] font-mono mt-0.5 opacity-60 break-words leading-none">ATK:${card.str} | VEL:${card.spd}</div>
        </div>
      `;
    } else {
      const imgStyle = card.type === 'Equipo' 
        ? 'object-contain max-w-full max-h-full p-2 opacity-60' 
        : 'object-cover object-center opacity-40';

      cardContent = `
        ${card.img ? `<img src="${card.img}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full ${imgStyle} pointer-events-none z-0"/>` : ''}
        
        <div class="w-full z-10 flex flex-col justify-between h-full relative">
          <div class="flex justify-between items-start">
            <span class="text-[6px] sm:text-[8px] uppercase tracking-wider font-mono opacity-60">⚡ ${card.cost} GLB</span>
            <span class="text-[5px] sm:text-[6px] uppercase font-mono px-1 bg-zinc-200/50 text-zinc-600">${card.type}</span>
          </div>
          <div class="mt-auto pt-6 bg-gradient-to-t ${isSelected ? 'from-zinc-950 via-zinc-950/80' : 'from-zinc-50 via-zinc-50/80'} to-transparent">
            <div class="text-[9px] sm:text-xs font-bold leading-tight truncate">${card.name}</div>
            <div class="text-[7px] sm:text-[8px] font-mono mt-0.5 opacity-70 break-words leading-none line-clamp-2">${card.desc || ''}</div>
          </div>
        </div>
      `;
    }

    cardDiv.innerHTML = cardContent;
    container.appendChild(cardDiv);
  });
}

function renderBoard() {
  for (let i = 0; i < 3; i++) {
    renderSlot('ai', i);
    renderSlot('player', i);
  }
}

function renderSlot(side, col) {
  const data = side === 'player' ? state.playerField[col] : state.aiField[col];
  const colElement = document.getElementById(`${side}-col-${col}`);
  const charSlot = document.getElementById(`${side}-char-${col}`);
  const equipSlot = document.getElementById(`${side}-equip-${col}`);
  const fieldSlot = document.getElementById(`${side}-field-${col}`);

  if (colElement) {
    if (data.field && data.field.img) {
      colElement.style.backgroundImage = `url('${data.field.img}')`;
      colElement.style.backgroundSize = 'cover';
      colElement.style.backgroundPosition = 'center';
      colElement.style.backgroundRepeat = 'no-repeat';
    } else {
      colElement.style.backgroundImage = '';
      colElement.style.backgroundSize = '';
      colElement.style.backgroundPosition = '';
      colElement.style.backgroundRepeat = '';
    }
  }

  fieldSlot.innerHTML = data.field ? `<span class="bg-zinc-900 text-white px-1 py-0.5 text-[6px] sm:text-[8px] uppercase font-mono tracking-wider shadow-sm z-10">${data.field.name}</span>` : '';

  if (data.character) {
    const c = data.character;
    let computedStr = c.str;
    data.equipments.forEach(e => { if (e.statMod?.str) computedStr += e.statMod.str; });

    const epPct = Math.max(0, (c.energy / c.maxEnergy) * 100);
    const burnLabel = c.hasBurn ? `<span class="text-red-600 font-bold animate-pulse">[KEM]</span>` : '';
    const textGradientBg = data.field ? 'from-white via-white/95' : 'from-white via-white/90';

    charSlot.innerHTML = `
      <div class="w-full text-left font-mono flex flex-col justify-between h-full min-h-[110px] sm:min-h-[150px] relative overflow-hidden p-1">
        ${c.img ? `<div class="absolute inset-0 w-full h-full flex items-center justify-center p-0.5 pointer-events-none z-0"><img src="${c.img}" onerror="this.style.display='none'" class="w-full h-full object-contain object-center opacity-85"/></div>` : ''}
        <div class="w-full z-10 flex justify-between items-start pointer-events-auto">
          ${side === 'ai' ? `<span class="text-[6px] font-bold text-zinc-400 bg-zinc-100 px-0.5">IA</span>` : '<div></div>'}
        </div>
        <div class="mt-auto w-full z-10 pt-6 bg-gradient-to-t ${textGradientBg} to-transparent pointer-events-auto">
          <div class="text-[9px] sm:text-xs font-bold text-zinc-900 leading-none truncate">${c.name} ${burnLabel}</div>
          <div class="text-[7px] sm:text-[9px] text-zinc-500 mt-1 flex flex-col gap-0.5 leading-none">
            <div class="flex justify-between"><span>HP: ${c.hp}/${c.maxHp}</span></div>
            <div class="flex justify-between items-center mt-0.5">
              <span>EP: ${c.energy}/${c.maxEnergy}</span>
              <div class="w-6 sm:w-12 h-[2px] bg-zinc-200 relative ml-1 hidden sm:block">
                <div class="h-full bg-zinc-900 transition-all" style="width: ${epPct}%;"></div>
              </div>
            </div>
          </div>
          <div class="text-[6px] sm:text-[8px] text-zinc-400 mt-1 uppercase font-bold">ATK:${computedStr} | VEL:${c.spd}</div>
          ${side === 'player' ? `
            <div class="mt-1.5 flex gap-1 shrink-0 pb-0.5">
              <button onclick="triggerAttack(${col}, event)" class="flex-1 bg-zinc-900 text-white text-[6px] sm:text-[8px] py-0.5 uppercase tracking-wider text-center ${!c.hasAttackAction ? 'opacity-30' : ''}">Atk</button>
              <button onclick="showTechniqueMenu(${col}, event)" class="flex-1 bg-zinc-100 text-zinc-900 text-[6px] sm:text-[8px] py-0.5 uppercase tracking-wider text-center border border-zinc-200">Téc</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } else {
    charSlot.innerHTML = `<div class="flex items-center justify-center h-full w-full py-8 text-[8px] sm:text-xs text-zinc-300 italic uppercase tracking-widest font-mono ${data.field ? 'bg-white/40 backdrop-blur-[1px]' : ''}">Vacío</div>`;
  }

  if (data.equipments.length > 0) {
    equipSlot.innerHTML = data.equipments.map(e => `
      <div class="bg-white/90 backdrop-blur-sm border border-zinc-100 p-1 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 relative group z-10 shadow-sm overflow-hidden" title="${e.name}: ${e.desc}">
        ${e.img ? `<img src="${e.img}" onerror="this.style.display='none'" class="w-full h-full object-contain max-w-full max-h-full block opacity-90"/>` : `<span class="text-[14px]">📦</span>`}
        <div class="absolute bottom-0 left-0 right-0 bg-zinc-950/80 text-white text-[4px] sm:text-[6px] tracking-tighter truncate text-center font-mono py-0.5 px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          ${e.name}
        </div>
      </div>
    `).join(' ');
  } else {
    equipSlot.innerHTML = '';
  }
}

function renderWorldMap() {
  const mapWrapper = document.getElementById('map-wrapper');
  if (!mapWrapper) return;
  mapWrapper.innerHTML = '';

  // Agrupar los nodos por su propiedad de fase del árbol evolutivo
  const fases = {};
  state.mapNodes.forEach(node => {
    if (!fases[node.fase]) fases[node.fase] = [];
    fases[node.fase].push(node);
  });

  Object.keys(fases).sort((a, b) => a - b).forEach((faseIdx) => {
    const laneDiv = document.createElement('div');
    laneDiv.className = "flex flex-col justify-center items-center gap-6 min-w-[120px] sm:min-w-[160px] relative px-4 border-r border-dashed border-zinc-200/60 last:border-none";
    
    const phaseIndicator = document.createElement('div');
    phaseIndicator.className = "absolute top-2 text-[7px] font-mono tracking-widest text-zinc-300 uppercase";
    phaseIndicator.innerText = `SEC. 0${faseIdx}`;
    laneDiv.appendChild(phaseIndicator);

    fases[faseIdx].forEach(node => {
      const nodeBtn = document.createElement('button');
      
      let stateStyles = "bg-white border-zinc-200 text-zinc-400 cursor-not-allowed";
      if (node.completed) {
        stateStyles = "bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-900";
      } else if (node.active) {
        stateStyles = "bg-zinc-50 border-zinc-950 text-zinc-900 hover:bg-zinc-100 animate-pulse font-bold";
      }

      nodeBtn.className = `w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center p-2 border text-center transition-all relative group ${stateStyles}`;
      nodeBtn.onclick = () => selectMapNode(node.id);

      let nodeBadge = "⚔️";
      if (node.type === 'tienda') nodeBadge = "🛒";
      if (node.type === 'evento') nodeBadge = "⛪";
      if (node.type === 'tesoro') nodeBadge = "💎";
      if (node.type === 'jefe') nodeBadge = "💀";

      nodeBtn.innerHTML = `
        <span class="text-sm sm:text-base mb-1 ${node.completed ? 'opacity-40': ''}">${nodeBadge}</span>
        <span class="text-[7px] sm:text-[8px] tracking-tight font-mono uppercase block truncate w-full">${node.label}</span>
        ${node.completed ? `<span class="absolute -top-1 -right-1 bg-zinc-950 text-white text-[5px] px-0.5 border border-white">DONE</span>` : ''}
      `;

      laneDiv.appendChild(nodeBtn);
    });

    mapWrapper.appendChild(laneDiv);
  });
}

function log(msg) {
  const box = document.getElementById('combat-log');
  if (!box) return;
  const div = document.createElement('div');
  div.innerText = `> ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showToast(title, desc) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'bg-zinc-900 text-white p-2.5 text-[10px] flex flex-col transition-all duration-300 transform translate-x-4 opacity-0';
  toast.innerHTML = `<strong>${title}</strong><span class="text-[9px] text-zinc-400">${desc}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-4', 'opacity-0'), 30);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}