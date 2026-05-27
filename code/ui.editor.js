// code/ui.editor.js
// RENDERIZADO VISUAL DEL EDITOR DE BARAJA SILEN

function updateEditorUI() {
  // Contador global superior del editor
  document.getElementById('editor-deck-count').innerText = `Mazo: ${state.customPlayerDeck.length} Cartas (Mínimo 10 / Recomendado 25)`;

  renderEditorPool();
  renderEditorDeck();
}

function renderEditorPool() {
  const container = document.getElementById('editor-pool-list');
  container.innerHTML = '';

  if (playerCardPool.length === 0) {
    container.innerHTML = '<div class="text-[10px] text-zinc-400 italic p-4">No quedan cartas en la reserva de datos.</div>';
    return;
  }

  // Contenedor flex con scroll o grid para emular el flujo de cartas de la mano
  container.className = "flex flex-wrap gap-3 p-2 justify-start overflow-y-auto flex-1 pr-1";

  playerCardPool.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    
    let aspectClass = "min-h-[130px] sm:min-h-[180px]";
    if (card.type === 'Equipo' || card.type === 'Campo') {
      aspectClass = "min-h-[100px] sm:min-h-[140px]";
    }

    cardDiv.className = `min-w-[100px] sm:min-w-[130px] max-w-[100px] sm:max-w-[130px] ${aspectClass} p-2 flex flex-col justify-between cursor-pointer transition-all border shrink-0 relative overflow-hidden bg-zinc-50 text-zinc-900 border-zinc-100 hover:bg-zinc-100 group`;
    
    cardDiv.onclick = () => addCardToDeck(index);

    let cardContent = '';

    if (card.hp) {
      cardContent = `
        ${card.img ? `<img src="${card.img}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover object-center opacity-80 pointer-events-none z-0"/>` : ''}
        
        <div class="absolute top-1.5 left-1.5 z-10 text-[6px] sm:text-[8px] uppercase tracking-wider font-mono opacity-60">⚡ ${card.cost} GLB</div>
        
        <div class="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="bg-zinc-950 text-white text-[6px] font-bold px-1 py-0.5 uppercase tracking-widest">Añadir</span>
        </div>

        <div class="mt-auto w-full z-10 pt-8 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent relative">
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
          
          <div class="absolute top-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="bg-zinc-950 text-white text-[6px] font-bold px-1 py-0.5 uppercase tracking-widest">Añadir</span>
          </div>

          <div class="mt-auto pt-6 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent">
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

function renderEditorDeck() {
  const container = document.getElementById('editor-deck-list');
  container.innerHTML = '';

  if (state.customPlayerDeck.length === 0) {
    container.innerHTML = '<div class="text-[10px] text-zinc-400 italic p-4 font-mono">El mazo está vacío. Selecciona componentes de la izquierda.</div>';
    return;
  }

  // Contenedor flex con scroll o grid para emular el flujo de cartas de la mano
  container.className = "flex flex-wrap gap-3 p-2 justify-start overflow-y-auto flex-1 pr-1";

  state.customPlayerDeck.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    
    let aspectClass = "min-h-[130px] sm:min-h-[180px]";
    if (card.type === 'Equipo' || card.type === 'Campo') {
      aspectClass = "min-h-[100px] sm:min-h-[140px]";
    }

    // Estética invertida o de mazo: fondo oscuro como cuando la carta está seleccionada o activa
    cardDiv.className = `min-w-[100px] sm:min-w-[130px] max-w-[100px] sm:max-w-[130px] ${aspectClass} p-2 flex flex-col justify-between cursor-pointer transition-all border shrink-0 relative overflow-hidden bg-zinc-950 text-white border-zinc-950 hover:bg-red-950 hover:border-red-950 group`;
    
    cardDiv.onclick = () => removeCardFromDeck(index);

    let cardContent = '';

    if (card.hp) {
      cardContent = `
        ${card.img ? `<img src="${card.img}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover object-center opacity-70 pointer-events-none z-0"/>` : ''}
        
        <div class="absolute top-1.5 left-1.5 z-10 text-[6px] sm:text-[8px] uppercase tracking-wider font-mono opacity-60">⚡ ${card.cost} GLB</div>
        
        <div class="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="bg-red-600 text-white text-[6px] font-bold px-1 py-0.5 uppercase tracking-widest">Retirar</span>
        </div>

        <div class="mt-auto w-full z-10 pt-8 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent relative">
          <div class="text-[9px] sm:text-xs font-bold leading-tight truncate">${card.name}</div>
          <div class="text-[7px] sm:text-[9px] font-mono mt-0.5 opacity-60 break-words leading-none">ATK:${card.str} | VEL:${card.spd}</div>
        </div>
      `;
    } else {
      const imgStyle = card.type === 'Equipo' 
        ? 'object-contain max-w-full max-h-full p-2 opacity-50' 
        : 'object-cover object-center opacity-30';

      cardContent = `
        ${card.img ? `<img src="${card.img}" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full ${imgStyle} pointer-events-none z-0"/>` : ''}
        
        <div class="w-full z-10 flex flex-col justify-between h-full relative">
          <div class="flex justify-between items-start">
            <span class="text-[6px] sm:text-[8px] uppercase tracking-wider font-mono opacity-60">⚡ ${card.cost} GLB</span>
            <span class="text-[5px] sm:text-[6px] uppercase font-mono px-1 bg-zinc-800 text-zinc-300">${card.type}</span>
          </div>
          
          <div class="absolute top-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="bg-red-600 text-white text-[6px] font-bold px-1 py-0.5 uppercase tracking-widest">Retirar</span>
          </div>

          <div class="mt-auto pt-6 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
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