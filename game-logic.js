// =================================================================
// ARCHIVO: game-logic.js
// VERSIÓN 4: Lógica de 'NO DEFENDER' (SKIP_DEFENSE) añadida.
// Tipos de Carta: ACCION, ESTADO.
// Habilidades: ACUMULAR, GANAR, ATACAR, DEFENDER.
// =================================================================

/**
 * Baraja un array en su sitio.
 * @param {Array} array El array a barajar.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Inicializa el estado del juego.
 * @param {object} player1Data Datos del jugador 1.
 * @param {object} player2Data Datos del jugador 2.
 * @returns {object} El estado inicial del juego.
 */
export function initializeGame(player1Data, player2Data) {
    const p1Deck = [...player1Data.deck];
    const p2Deck = [...player2Data.deck];
    shuffleArray(p1Deck);
    shuffleArray(p2Deck);

    return {
        turn: player1Data.uid,
        winner: null,
        pendingAttack: null, // para gestionar ataques pendientes.
        players: {
            player1: { uid: player1Data.uid, displayName: player1Data.displayName, puntos: 0, unidades: 1 },
            player2: { uid: player2Data.uid, displayName: player2Data.displayName, puntos: 0, unidades: 1 }
        },
        decks: { player1: p1Deck, player2: p2Deck },
        hands: { player1: p1Deck.splice(0, 5), player2: p2Deck.splice(0, 5) },
        fields: { player1: [], player2: [] },
        log: ["La partida ha comenzado."],
    };
}

/**
 * Procesa una acción realizada por un jugador.
 * @param {object} currentState El estado actual del juego.
 * @param {string} playerId El ID del jugador que realiza la acción.
 * @param {object} action La acción a realizar.
 * @param {Map} cardData Los datos base de todas las cartas.
 * @returns {object} El nuevo estado del juego.
 */
export function performAction(currentState, playerId, action, cardData) {
    let newState = JSON.parse(JSON.stringify(currentState));

    if (newState.winner) return newState;

    const playerKey = newState.players.player1.uid === playerId ? 'player1' : 'player2';

    switch (action.type) {
        case 'PLAY_CARD':
            newState = playCardFromHand(newState, playerKey, action.cardId, cardData);
            break;
        case 'ACTIVATE_ABILITY':
            newState = activateAbility(newState, playerKey, action.instanceId, action.action, cardData);
            break;
        
        // [NUEVO] Caso para manejar el "NO DEFENDER"
        case 'SKIP_DEFENSE':
            newState = skipDefense(newState, playerKey, cardData);
            break;

        case 'END_TURN':
            newState = endTurn(newState, playerKey, cardData);
            break;
        default:
            console.warn(`Tipo de acción desconocido: ${action.type}`);
    }
    
    // Comprobar condición de victoria
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    if (newState.players[playerKey].puntos >= 13) {
        newState.winner = newState.players[playerKey].displayName;
    } else if (newState.players[opponentKey].puntos >= 13) {
        newState.winner = newState.players[opponentKey].displayName;
    }


    return newState;
}

/**
 * Juega una carta desde la mano de un jugador.
 * @param {object} state Estado del juego.
 * @param {string} playerKey Clave del jugador ('player1' o 'player2').
 * @param {string} cardId ID de la carta a jugar.
 * @param {Map} cardData Datos base de las cartas.
 * @returns {object} Nuevo estado del juego.
 */
function playCardFromHand(state, playerKey, cardId, cardData) {
    if (state.turn !== state.players[playerKey].uid) return state; // Solo se juega en tu turno

    const card = cardData.get(cardId);
    const player = state.players[playerKey];

    if (player.unidades < card.coste) return state;
    const cardIndex = state.hands[playerKey].indexOf(cardId);
    if (cardIndex === -1) return state;

    player.unidades -= card.coste;
    state.hands[playerKey].splice(cardIndex, 1);
    
    if (card.tipo.toUpperCase() === 'ACCION') {
        const match = card.texto.match(/([A-Z]+)/);
        if (match) {
            const ability = match[1].toUpperCase();
            switch (ability) {
                case 'ACUMULAR':
                    player.unidades += card.poder;
                    break;
                case 'GANAR':
                    player.puntos += card.poder;
                    break;
            }
        }
    } else { // El tipo es 'ESTADO'
        const newInstance = {
            id: cardId,
            instanceId: `inst_${Date.now()}_${Math.random()}`,
            tapped: true, // Las cartas entran giradas
        };
        state.fields[playerKey].push(newInstance);
    }

    return state;
}


/**
 * Verifica si el oponente tiene cartas de defensa usables.
 * @param {object} state Estado del juego.
 * @param {string} opponentKey Clave del oponente ('player1' o 'player2').
 * @param {Map} cardData Datos base de las cartas.
 * @returns {boolean} True si hay al menos una defensa usable.
 */
function hasUsableDefense(state, opponentKey, cardData) {
    const opponent = state.players[opponentKey];
    const opponentField = state.fields[opponentKey];

    for (const instance of opponentField) {
        if (instance.tapped) continue; // No se puede usar si está girada

        const card = cardData.get(instance.id);
        if (!card.texto.includes('DEFENDER')) continue; // No es defensora

        // Extraer el coste de DEFENDER
        const match = card.texto.match(/DEFENDER\s*\((\d+)\)/);
        if (match) {
            const defenseCost = parseInt(match[1]);
            if (opponent.unidades >= defenseCost) {
                return true; // ¡Encontró una defensa usable!
            }
        }
    }
    return false; // No se encontró ninguna
}


/**
 * Activa la habilidad de una carta en el campo.
 * @param {object} state Estado del juego.
 * @param {string} playerKey Clave del jugador.
 * @param {string} instanceId ID de la instancia de la carta.
 * @param {string} actionText Texto de la habilidad a activar.
 * @param {Map} cardData Datos base de las cartas.
 * @returns {object} Nuevo estado del juego.
 */
function activateAbility(state, playerKey, instanceId, actionText, cardData) {
    const instance = state.fields[playerKey].find(c => c.instanceId === instanceId);
    if (!instance || instance.tapped) return state;

    const card = cardData.get(instance.id);
    const player = state.players[playerKey];
    
    const match = actionText.match(/([A-Z]+)\s*\((\d+)\)/);
    if (!match) return state;
    
    const ability = match[1].toUpperCase();
    const cost = parseInt(match[2]);

    if (player.unidades < cost) return state;

    // Lógica específica para cada habilidad
    switch (ability) {
        case 'ACUMULAR':
        case 'GANAR':
            if (state.turn !== player.uid) return state; // Estas solo en tu turno
            player.unidades -= cost;
            instance.tapped = true;
            if (ability === 'ACUMULAR') player.unidades += card.poder;
            if (ability === 'GANAR') player.puntos += card.poder;
            break; 

        case 'ATACAR':
            if (state.turn !== player.uid || state.pendingAttack) return state; // Solo en tu turno y si no hay otro ataque
            
            player.unidades -= cost; // Paga el coste de atacar
            instance.tapped = true; // Gira la carta atacante

            const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
            
            if (hasUsableDefense(state, opponentKey, cardData)) {
                state.pendingAttack = {
                    attackerPlayerKey: playerKey,
                    attackerInstanceId: instance.instanceId,
                };
            } else {
                const attackerCard = cardData.get(instance.id);
                player.puntos += attackerCard.poder;
            }
            break;

        case 'DEFENDER':
            if (!state.pendingAttack || state.pendingAttack.attackerPlayerKey === playerKey) return state; // Solo si hay un ataque enemigo
            
            player.unidades -= cost;
            instance.tapped = true;

            const oppKey = state.pendingAttack.attackerPlayerKey;
            const attackerInstance = state.fields[oppKey].find(c => c.instanceId === state.pendingAttack.attackerInstanceId);
            
            if (!attackerInstance) { // El atacante ya no existe
                state.pendingAttack = null;
                return state;
            }

            const attackerCard = cardData.get(attackerInstance.id);
            const defenderCard = card; // card ya está definido arriba

            // Comparar poderes
            if (attackerCard.poder > defenderCard.poder) {
                state.fields[playerKey] = state.fields[playerKey].filter(c => c.instanceId !== instance.instanceId);
            } else if (defenderCard.poder > attackerCard.poder) {
                state.fields[oppKey] = state.fields[oppKey].filter(c => c.instanceId !== attackerInstance.instanceId);
            } else {
                state.fields[playerKey] = state.fields[playerKey].filter(c => c.instanceId !== instance.instanceId);
                state.fields[oppKey] = state.fields[oppKey].filter(c => c.instanceId !== attackerInstance.instanceId);
            }
            
            state.pendingAttack = null; // El combate se resuelve
            break;
    }
    return state;
}

/**
 * [NUEVA FUNCIÓN] Resuelve un ataque pendiente cuando el defensor elige no bloquear.
 * @param {object} state Estado del juego.
 * @param {string} playerKey Clave del jugador que omite la defensa ('player1' o 'player2').
 * @param {Map} cardData Datos base de las cartas.
 * @returns {object} Nuevo estado del juego.
 */
function skipDefense(state, playerKey, cardData) {
    // Comprobaciones de seguridad:
    // 1. Debe haber un ataque pendiente
    // 2. El jugador que pulsa "NO DEFENDER" (playerKey) NO debe ser el atacante
    if (!state.pendingAttack || state.pendingAttack.attackerPlayerKey === playerKey) {
        return state; 
    }

    const attackerKey = state.pendingAttack.attackerPlayerKey;
    const attackerInstance = state.fields[attackerKey].find(c => c.instanceId === state.pendingAttack.attackerInstanceId);
    
    if (attackerInstance) {
        // El atacante sigue en el campo, se resuelve el ataque
        const attackerCard = cardData.get(attackerInstance.id);
        state.players[attackerKey].puntos += attackerCard.poder;
    }
    
    // Limpiar el ataque pendiente, ya que se ha resuelto
    state.pendingAttack = null;

    return state;
}


/**
 * Finaliza el turno del jugador actual.
 * @param {object} state Estado del juego.
 * @param {string} playerKey Clave del jugador que termina el turno.
 * @param {Map} cardData Datos base de las cartas.
 * @returns {object} Nuevo estado del juego.
 */
function endTurn(state, playerKey, cardData) {
    if (state.turn !== state.players[playerKey].uid) return state;

    // 1. Resolver ataque pendiente no defendido
    // (Esto se ejecutará si el oponente PUDO defender pero eligió NO hacerlo
    // Y ADEMÁS no pulsó el botón "SKIP_DEFENSE")
    if (state.pendingAttack && state.pendingAttack.attackerPlayerKey === playerKey) {
        const attackerInstance = state.fields[playerKey].find(c => c.instanceId === state.pendingAttack.attackerInstanceId);
        if (attackerInstance) {
            const attackerCard = cardData.get(attackerInstance.id);
            state.players[playerKey].puntos += attackerCard.poder;
        }
        state.pendingAttack = null;
    }

    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    state.turn = state.players[opponentKey].uid;
    
    // 2. Preparar (destapar) las cartas del nuevo jugador
    state.fields[opponentKey].forEach(card => card.tapped = false);

    // 3. Robar una carta
    if (state.decks[opponentKey].length > 0) {
        state.hands[opponentKey].push(state.decks[opponentKey].pop());
    }
    
    // 4. El nuevo jugador gana 1 unidad al inicio de su turno.
    state.players[opponentKey].unidades += 1;

    return state;
}