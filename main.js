// Importar funciones de los módulos de Firebase
import {
    getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, getDocs, query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Importar funciones del módulo de lógica de juego
import { initializeGame, performAction } from './game-logic.js';


// --- VARIABLES GLOBALES Y CONSTANTES ---
let currentUser = null;
let currentGameListener = null;
let baseCardData = new Map();
let currentDeck = [];
let isAppReady = false;

// --- SELECTORES DEL DOM (Declaración) ---
let loginBtn, logoutBtn, userInfoDiv, userPic, userName,
    lobbyView, gameView, deckBuilderView, createGameBtn, joinGameInput, joinGameBtn,
    deckBuilderBtn, backToLobbyBtn, saveDeckBtn, clearDeckBtn, cardCollectionList,
    collectionCardCount, currentDeckList, deckCardCount, gameCodeModal, gameCodeDisplay,
    copyCodeBtn, gameStatus, gameActionsBar, endTurnBtn, cardActionModal, cardActionTitle,
    cardActionButtons, cardActionCancel, 
    defenseActionsBar, skipDefenseBtn,
    gameOverModal, winnerMessage, backToLobbyFromGameBtn;

/**
 * Asigna los elementos del DOM a las variables después de que la página haya cargado.
 */
function initializeSelectors() {
    loginBtn = document.getElementById('login-btn');
    logoutBtn = document.getElementById('logout-btn');
    userInfoDiv = document.getElementById('user-info');
    userPic = document.getElementById('user-pic');
    userName = document.getElementById('user-name');
    lobbyView = document.getElementById('lobby-view');
    gameView = document.getElementById('game-view');
    deckBuilderView = document.getElementById('deck-builder-view');
    createGameBtn = document.getElementById('create-game-btn');
    joinGameInput = document.getElementById('join-game-input');
    joinGameBtn = document.getElementById('join-game-btn');
    deckBuilderBtn = document.getElementById('deck-builder-btn');
    backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    saveDeckBtn = document.getElementById('save-deck-btn');
    clearDeckBtn = document.getElementById('clear-deck-btn');
    cardCollectionList = document.getElementById('card-collection-list');
    collectionCardCount = document.getElementById('collection-card-count');
    currentDeckList = document.getElementById('current-deck-list');
    deckCardCount = document.getElementById('deck-card-count');
    gameCodeModal = document.getElementById('game-code-modal');
    gameCodeDisplay = document.getElementById('game-code-display');
    copyCodeBtn = document.getElementById('copy-code-btn');
    gameStatus = document.getElementById('game-status');
    gameActionsBar = document.getElementById('game-actions');
    endTurnBtn = document.getElementById('end-turn-btn');
    cardActionModal = document.getElementById('card-action-modal');
    cardActionTitle = document.getElementById('card-action-title');
    cardActionButtons = document.getElementById('card-action-buttons');
    cardActionCancel = document.getElementById('card-action-cancel');
    defenseActionsBar = document.getElementById('defense-actions-bar');
    skipDefenseBtn = document.getElementById('skip-defense-btn');
    gameOverModal = document.getElementById('game-over-modal');
    winnerMessage = document.getElementById('winner-message');
    backToLobbyFromGameBtn = document.getElementById('back-to-lobby-from-game-btn');
}


// --- INICIALIZACIÓN DE FIREBASE ---
function initialize() {
    initializeSelectors();
    if (!window.firebase) { setTimeout(initialize, 100); return; }
    const auth = window.firebase.auth;

    onAuthStateChanged(auth, async user => {
        if (user) {
            currentUser = user;
            userInfoDiv.classList.remove('hidden');
            loginBtn.classList.add('hidden');
            userPic.src = user.photoURL;
            userName.textContent = user.displayName;
            try {
                await loadBaseCards();
                isAppReady = true;
                console.log("Aplicación lista. Cartas base cargadas.");
            } catch (error) {
                console.error("Error crítico al cargar las cartas base.", error);
                alert("Error: No se pudo cargar la colección de cartas. Asegúrate de haberla subido desde el panel de administración.");
                isAppReady = false;
            }
            showView('lobby');
        } else {
            currentUser = null;
            userInfoDiv.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            showView(null);
            if (currentGameListener) currentGameListener();
            isAppReady = false;
        }
    });

    loginBtn.addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()));
    logoutBtn.addEventListener('click', () => signOut(auth));
    createGameBtn.addEventListener('click', createGame);
    joinGameBtn.addEventListener('click', joinGame);
    copyCodeBtn.addEventListener('click', () => navigator.clipboard.writeText(gameCodeDisplay.value));
    deckBuilderBtn.addEventListener('click', () => {
        if (!isAppReady) { alert("Cargando datos..."); return; }
        showDeckBuilder();
    });
    backToLobbyBtn.addEventListener('click', () => showView('lobby'));
    saveDeckBtn.addEventListener('click', saveDeck);
    clearDeckBtn.addEventListener('click', clearDeck);
    cardActionCancel.addEventListener('click', () => cardActionModal.classList.add('hidden'));
    backToLobbyFromGameBtn.addEventListener('click', () => {
        if (currentGameListener) {
            currentGameListener();
            currentGameListener = null;
        }
        gameOverModal.classList.add('hidden');
        showView('lobby');
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    if (viewId && document.getElementById(`${viewId}-view`)) {
        document.getElementById(`${viewId}-view`).classList.remove('hidden');
    }
}

// --- LÓGICA DEL CONSTRUCTOR DE BARAJAS ---
async function loadBaseCards() {
    baseCardData.clear();
    const db = window.firebase.db;
    const q = query(collection(db, "cartas_base"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("No se encontraron cartas base.");
    querySnapshot.forEach(doc => baseCardData.set(doc.id, doc.data()));
    collectionCardCount.textContent = baseCardData.size;
}

async function showDeckBuilder() {
    showView('deck-builder');
    renderCollection();
    await loadDeck();
    renderDeck();
}

function renderCollection() {
    cardCollectionList.innerHTML = '';
    for (const [id, card] of baseCardData.entries()) {
        const cardEl = createDeckBuilderCard(card);
        cardEl.addEventListener('click', () => addCardToDeck(id));
        cardCollectionList.appendChild(cardEl);
    }
}

function renderDeck() {
    currentDeckList.innerHTML = '';
    const cardCounts = {};
    currentDeck.forEach(id => cardCounts[id] = (cardCounts[id] || 0) + 1);

    for (const cardId in cardCounts) {
        const card = baseCardData.get(cardId);
        if (card) {
            const cardEl = createDeckBuilderCard(card, cardCounts[cardId]);
            cardEl.addEventListener('click', () => removeCardFromDeck(cardId));
            currentDeckList.appendChild(cardEl);
        }
    }
    deckCardCount.textContent = currentDeck.length;
}

function createDeckBuilderCard(card, count = 0) {
    const cardEl = document.createElement('div');
    cardEl.className = 'deck-builder-card';
    cardEl.innerHTML = `
        <div class="card-header">
            <div class="card-header-stats">
                <div class="card-stat">${card.coste}</div>
                <div class="card-stat">${card.poder}</div>
            </div>
            <div class="card-type">${card.tipo}</div>
        </div>
        <div class="card-title-bar">
            <div class="card-name">${card.nombre} ${count > 1 ? `x${count}`: ''}</div>
        </div>
        <div class="card-image" style="background-image: url('${card.imagenSrc || ''}')"></div>
        <div class="card-text-box">${card.texto}</div>
    `;
    return cardEl;
}

function addCardToDeck(cardId) {
    if (currentDeck.length >= 40) return alert("La baraja no puede tener más de 40 cartas.");
    const count = currentDeck.filter(id => id === cardId).length;
    if (count >= 2) return alert("No puedes tener más de 2 copias de la misma carta.");
    currentDeck.push(cardId);
    renderDeck();
}

function removeCardFromDeck(cardId) {
    const index = currentDeck.lastIndexOf(cardId);
    if (index > -1) {
        currentDeck.splice(index, 1);
        renderDeck();
    }
}

function clearDeck() {
    if (confirm("¿Estás seguro de que quieres vaciar tu baraja?")) {
        currentDeck = [];
        renderDeck();
    }
}

async function saveDeck() {
    if (!currentUser) return;
    const db = window.firebase.db;
    const deckRef = doc(db, 'users', currentUser.uid, 'decks', 'main');
    try {
        await setDoc(deckRef, { cardIds: currentDeck, updatedAt: new Date() });
        alert("¡Baraja guardada!");
    } catch (error) { console.error("Error al guardar la baraja:", error); }
}

async function loadDeck() {
    if (!currentUser) return;
    const db = window.firebase.db;
    const deckRef = doc(db, 'users', currentUser.uid, 'decks', 'main');
    const docSnap = await getDoc(deckRef);
    currentDeck = docSnap.exists() ? (docSnap.data().cardIds || []) : [];
}

// --- LÓGICA DE PARTIDAS ---
async function createGame() {
    if (!isAppReady || !currentUser) return;
    await loadDeck();
    if (currentDeck.length !== 40) return alert("Tu baraja debe tener exactamente 40 cartas.");

    const db = window.firebase.db;
    const gameRef = doc(collection(db, 'games'));
    const newGame = {
        id: gameRef.id,
        status: 'waiting',
        player1: { uid: currentUser.uid, displayName: currentUser.displayName, deck: currentDeck },
        player2: null,
        gameState: null,
        createdAt: new Date(),
    };
    await setDoc(gameRef, newGame);
    gameCodeDisplay.value = gameRef.id;
    gameCodeModal.classList.remove('hidden');
    listenToGame(gameRef.id);
}

async function joinGame() {
    if (!isAppReady || !currentUser) return;
    const gameId = joinGameInput.value.trim();
    if (!gameId) return;
    await loadDeck();
    if (currentDeck.length !== 40) return alert("Tu baraja debe tener exactamente 40 cartas.");

    const db = window.firebase.db;
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return alert('Partida no encontrada.');

    const gameData = gameSnap.data();
    if (gameData.status !== 'waiting' || gameData.player1.uid === currentUser.uid) return;

    const player2Data = { uid: currentUser.uid, displayName: currentUser.displayName, deck: currentDeck };
    const initialGameState = initializeGame(gameData.player1, player2Data);
    await updateDoc(gameRef, { status: 'active', player2: player2Data, gameState: initialGameState });
    listenToGame(gameId);
}

function listenToGame(gameId) {
    const db = window.firebase.db;
    if (currentGameListener) currentGameListener();
    currentGameListener = onSnapshot(doc(db, 'games', gameId), (doc) => {
        const gameData = doc.data();
        if (!gameData) return;
        if (gameData.status === 'active' && gameData.gameState) {
            gameCodeModal.classList.add('hidden');
            showView('game');
            updateGameBoardUI(gameData);
        }
    });
}

// --- ACTUALIZACIÓN DE LA INTERFAZ DE JUEGO ---
function updateGameBoardUI(gameData) {
    const localPlayerKey = gameData.gameState.players.player1.uid === currentUser.uid ? 'player1' : 'player2';
    const opponentPlayerKey = localPlayerKey === 'player1' ? 'player2' : 'player1';
    
    const localPlayerState = gameData.gameState.players[localPlayerKey];
    const opponentPlayerState = gameData.gameState.players[opponentPlayerKey];
    
    const isMyTurn = gameData.gameState.turn === currentUser.uid;
    const pendingAttack = gameData.gameState.pendingAttack;

    const isBeingAttacked = pendingAttack && pendingAttack.attackerPlayerKey === opponentPlayerKey && !isMyTurn;

    if (isBeingAttacked) {
        defenseActionsBar.classList.remove('hidden');
        skipDefenseBtn.onclick = () => {
            sendGameAction({ type: 'SKIP_DEFENSE' }, gameData.id);
            defenseActionsBar.classList.add('hidden');
        };
    } else {
        defenseActionsBar.classList.add('hidden');
    }

    document.getElementById('local-player-name').textContent = localPlayerState.displayName;
    document.getElementById('local-player-score').textContent = localPlayerState.puntos;
    document.getElementById('local-player-units').textContent = localPlayerState.unidades;
    document.getElementById('opponent-name').textContent = opponentPlayerState.displayName;
    document.getElementById('opponent-score').textContent = opponentPlayerState.puntos;
    document.getElementById('opponent-units').textContent = opponentPlayerState.unidades;
    document.getElementById('opponent-hand-counter').textContent = `Cartas en mano: ${gameData.gameState.hands[opponentPlayerKey].length}`;

    ['local-player', 'opponent'].forEach(playerType => {
        const playerKey = playerType === 'local-player' ? localPlayerKey : opponentPlayerKey;
        const handDiv = document.getElementById(`${playerType}-hand`);
        const fieldDiv = document.getElementById(`${playerType}-field`);
        handDiv.innerHTML = '';
        fieldDiv.innerHTML = '';

        gameData.gameState.hands[playerKey].forEach(cardId => {
            const cardData = baseCardData.get(cardId);
            if (playerType === 'local-player') {
                handDiv.appendChild(createGameCard(cardData, null, gameData, true, false));
            }
        });

        gameData.gameState.fields[playerKey].forEach(cardInstance => {
            const cardData = baseCardData.get(cardInstance.id);
            const amIDefending = (playerType === 'local-player') && isBeingAttacked;
            fieldDiv.appendChild(createGameCard(cardData, cardInstance, gameData, true, amIDefending));
        });
    });

    document.body.classList.toggle('its-my-turn', isMyTurn);
    gameActionsBar.classList.toggle('hidden', !isMyTurn);
    
    const isAttacking = pendingAttack && pendingAttack.attackerPlayerKey === localPlayerKey;

    endTurnBtn.disabled = false;
    endTurnBtn.textContent = isAttacking ? "CONFIRMAR ATAQUE / FINALIZAR" : "Terminar Turno";
    
    endTurnBtn.onclick = () => {
        sendGameAction({ type: 'END_TURN' }, gameData.id);
    };

    if (gameData.gameState.winner) {
        winnerMessage.textContent = `¡El ganador es ${gameData.gameState.winner}!`;
        gameOverModal.classList.remove('hidden');
        gameActionsBar.classList.add('hidden');
        defenseActionsBar.classList.add('hidden');
        gameStatus.classList.add('hidden');
    } else {
        gameStatus.classList.remove('hidden');
        gameStatus.textContent = isMyTurn ? "¡Es tu turno!" : `Turno de ${opponentPlayerState.displayName}`;
        if (isBeingAttacked) {
             gameStatus.textContent = "¡Te están atacando! Elige una carta o pulsa 'NO DEFENDER'.";
        }
    }
}

// --- FUNCIÓN createGameCard ---
function createGameCard(card, instance, gameData, isVisible, isDefending = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card-in-game';
    if (!isVisible) {
        cardEl.classList.add('hidden-card');
        return cardEl;
    }
    
    const isMyTurn = gameData.gameState.turn === currentUser.uid;
    
    cardEl.innerHTML = `
        <div class="card-header">
            <div class="card-header-stats">
                <div class="card-stat">${card.coste}</div>
                <div class="card-stat">${card.poder}</div>
            </div>
            <div class="card-type">${card.tipo}</div>
        </div>
        <div class="card-title-bar">
            <div class="card-name">${card.nombre}</div>
        </div>
        <div class="card-image" style="background-image: url('${card.imagenSrc}')"></div>
        <div class="card-text-box">${card.texto}</div>
    `;

    if (instance) { // Carta en el campo
        cardEl.classList.add('on-field');
        if (instance.tapped) cardEl.classList.add('tapped');
        
        // --- [MODIFICADO] --- Regex actualizada para la nueva nomenclatura de ATACAR
        const hasAction = card.texto.match(/[A-Z]+(?:\s*\d+)?\s*\(\d+\)/);
        const hasDefenderAction = card.texto.includes('DEFENDER');

        if (isMyTurn && !instance.tapped && hasAction && !gameData.gameState.winner) {
            cardEl.classList.add('actionable');
            cardEl.onclick = () => showCardActions(card, instance, gameData.id, false);
        } else if (isDefending && !instance.tapped && hasDefenderAction && !gameData.gameState.winner) {
            cardEl.classList.add('actionable-defense');
            cardEl.onclick = () => showCardActions(card, instance, gameData.id, true);
        }
    } else { // Carta en la mano
        const localPlayerKey = gameData.gameState.players.player1.uid === currentUser.uid ? 'player1' : 'player2';
        if (isMyTurn && gameData.gameState.players[localPlayerKey].unidades >= card.coste && !gameData.gameState.winner) {
            cardEl.classList.add('playable');
            cardEl.onclick = () => sendGameAction({ type: 'PLAY_CARD', cardId: card.id }, gameData.id);
        }
    }
    return cardEl;
}

// --- FUNCIÓN showCardActions ---
function showCardActions(card, instance, gameId, isDefending) {
    cardActionTitle.textContent = `Acciones para ${card.nombre}`;
    cardActionButtons.innerHTML = '';
    
    // --- [MODIFICADO] --- Regex actualizada para encontrar todas las acciones, incluyendo el nuevo ATACAR
    const actions = card.texto.match(/[A-Z]+(?:\s*\d+)?\s*\(\d+\)/g) || [];
    
    actions.forEach(actionText => {
        const ability = actionText.match(/[A-Z]+/)[0].toUpperCase();
        
        if ((isDefending && ability === 'DEFENDER') || (!isDefending && ability !== 'DEFENDER')) {
            const btn = document.createElement('button');
            btn.className = 'btn-control';
            btn.textContent = actionText;
            btn.onclick = () => {
                sendGameAction({ type: 'ACTIVATE_ABILITY', instanceId: instance.instanceId, action: actionText }, gameId);
                cardActionModal.classList.add('hidden');
                
                if (isDefending) {
                    defenseActionsBar.classList.add('hidden');
                }
            };
            cardActionButtons.appendChild(btn);
        }
    });

    if (cardActionButtons.children.length > 0) {
        cardActionModal.classList.remove('hidden');
    }
}

async function sendGameAction(action, gameId) {
    const db = window.firebase.db;
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return;
    const gameData = gameSnap.data();
    
    const newGameState = performAction(gameData.gameState, currentUser.uid, action, baseCardData);
    await updateDoc(gameRef, { gameState: newGameState });
}

document.addEventListener('DOMContentLoaded', initialize);

