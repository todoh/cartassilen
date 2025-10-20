// =================================================================
// ARCHIVO: game-logic.js
// FASE 3: Motor de juego con reglas oficiales de "Silenos".
// =================================================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function initializeGame(player1Data, player2Data, cardData) {
    const p1Deck = [...player1Data.deck];
    const p2Deck = [...player2Data.deck];
    shuffleArray(p1Deck);
    shuffleArray(p2Deck);

    return {
        turn: player1Data.uid,
        winner: null,
        players: {
            player1: { uid: player1Data.uid, displayName: player1Data.displayName, puntos: 0, unidades: 0 },
            player2: { uid: player2Data.uid, displayName: player2Data.displayName, puntos: 0, unidades: 0 }
        },
        decks: { player1: p1Deck, player2: p2Deck },
        hands: { player1: p1Deck.splice(0, 5), player2: p2Deck.splice(0, 5) },
        fields: { player1: [], player2: [] },
        log: ["La partida ha comenzado."],
    };
}

export function performAction(currentState, playerId, action, cardData) {
    let newState = JSON.parse(JSON.stringify(currentState));

    if (newState.winner) return newState; // No se pueden realizar acciones si ya hay un ganador

    const playerKey = newState.players.player1.uid === playerId ? 'player1' : 'player2';
    if (newState.turn !== playerId && action.type !== 'DEFEND') {
        console.warn("Acción inválida: No es tu turno.");
        return currentState;
    }

    // Intérprete de acciones
    switch (action.type) {
        case 'PLAY_CARD':
            newState = playCardFromHand(newState, playerKey, action.cardId, cardData);
            break;
        case 'ACTIVATE_ABILITY':
            newState = activateAbility(newState, playerKey, action.instanceId, action.action, cardData);
            break;
        case 'END_TURN':
            newState = endTurn(newState, playerKey);
            break;
        default:
            console.warn(`Tipo de acción desconocido: ${action.type}`);
    }
    
    // Comprobar condición de victoria
    if (newState.players[playerKey].puntos >= 13) {
        newState.winner = newState.players[playerKey].displayName;
    }

    return newState;
}

function playCardFromHand(state, playerKey, cardId, cardData) {
    const card = cardData.get(cardId);
    const player = state.players[playerKey];

    if (player.unidades < card.coste) { return state; } // No hay suficientes unidades

    const cardIndex = state.hands[playerKey].indexOf(cardId);
    if (cardIndex === -1) { return state; } // La carta no está en la mano

    player.unidades -= card.coste;
    state.hands[playerKey].splice(cardIndex, 1);
    
    if (card.tipo === 'ACCION') {
        // Es una acción, se ejecuta inmediatamente y se descarta
        const match = card.texto.match(/([A-Z]+)\((\d+)\)/);
        if (match) {
            const ability = match[1];
            // El efecto de la acción usa el 'poder' de la carta
            switch (ability) {
                case 'GENERAR':
                case 'ACUMULAR':
                    player.unidades += card.poder;
                    break;
                case 'GANAR':
                    player.puntos += card.poder;
                    break;
                case 'ATACAR':
                    // La lógica de ATACAR aquí se interpreta como ganar puntos directamente
                    player.puntos += card.poder;
                    break;
            }
        }
    } else {
        // Es un personaje o sitio, se coloca en el campo
        const newInstance = {
            id: cardId,
            instanceId: `inst_${Date.now()}_${Math.random()}`,
            tapped: true, // Las cartas entran giradas
            unidadesAlmacenadas: 0,
            objetosEquipados: []
        };
        state.fields[playerKey].push(newInstance);
    }

    return state;
}

function activateAbility(state, playerKey, instanceId, actionText, cardData) {
    const instance = state.fields[playerKey].find(c => c.instanceId === instanceId);
    if (!instance || instance.tapped) return state;

    const card = cardData.get(instance.id);
    const player = state.players[playerKey];
    
    const match = actionText.match(/([A-Z]+)\s*\((\d+)\)/);
    if (!match) return state;
    const ability = match[1];
    const cost = parseInt(match[2]);

    if (player.unidades < cost) return state;
    player.unidades -= cost;
    instance.tapped = true;

    switch (ability) {
        case 'GENERAR': {
            const sitios = state.fields[playerKey].filter(c => cardData.get(c.id).tipo === 'SITIO');
            if (sitios.length > 0) {
                 // Simplificación: añade unidades al jugador en lugar de a un sitio específico.
                 // Una implementación completa requeriría elegir un sitio objetivo.
                 player.unidades += card.poder;
            }
            break;
        }
        case 'ACUMULAR':
            player.unidades += card.poder;
            break;
        case 'GANAR':
            player.puntos += card.poder;
            break;
        case 'ATACAR':
            // Lógica de ataque (simplificada)
            // En una versión completa, se necesitaría una fase de declaración de atacantes/bloqueadores.
            state.players[playerKey].puntos += card.poder;
            break;
    }
    return state;
}

function endTurn(state, playerKey) {
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    state.turn = state.players[opponentKey].uid;
    
    // Fase de Preparación del nuevo turno
    // 1. Preparar (untar) todas las cartas del jugador que va a empezar el turno
    state.fields[opponentKey].forEach(card => card.tapped = false);

    // 2. Robar una carta
    if (state.decks[opponentKey].length > 0) {
        state.hands[opponentKey].push(state.decks[opponentKey].pop());
    }

    return state;
}

