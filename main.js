// Importar funciones de los módulos de Firebase
import {
    getFirestore, collection, writeBatch, doc, setDoc, getDoc, updateDoc, onSnapshot, getDocs, query
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

// --- SELECTORES DEL DOM ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoDiv = document.getElementById('user-info');
const userPic = document.getElementById('user-pic');
const userName = document.getElementById('user-name');

const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');
const deckBuilderView = document.getElementById('deck-builder-view');

const createGameBtn = document.getElementById('create-game-btn');
const joinGameInput = document.getElementById('join-game-input');
const joinGameBtn = document.getElementById('join-game-btn');

const deckBuilderBtn = document.getElementById('deck-builder-btn');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
const saveDeckBtn = document.getElementById('save-deck-btn');
const clearDeckBtn = document.getElementById('clear-deck-btn');
const cardCollectionList = document.getElementById('card-collection-list');
const collectionCardCount = document.getElementById('collection-card-count');
const currentDeckList = document.getElementById('current-deck-list');
const deckCardCount = document.getElementById('deck-card-count');

const gameCodeModal = document.getElementById('game-code-modal');
const gameCodeDisplay = document.getElementById('game-code-display');
const copyCodeBtn = document.getElementById('copy-code-btn');

const gameStatus = document.getElementById('game-status');
const gameActionsBar = document.getElementById('game-actions');
const endTurnBtn = document.getElementById('end-turn-btn');

const cardActionModal = document.getElementById('card-action-modal');
const cardActionTitle = document.getElementById('card-action-title');
const cardActionButtons = document.getElementById('card-action-buttons');
const cardActionCancel = document.getElementById('card-action-cancel');

// --- INICIALIZACIÓN DE FIREBASE ---
function initialize() {
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
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    if (viewId) document.getElementById(`${viewId}-view`).classList.remove('hidden');
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
    // Se usa la clase .deck-builder-card para que herede todos los estilos detallados
    cardEl.className = 'deck-builder-card'; 

    // Construir el HTML interno para mostrar todos los atributos, igual que en el juego
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

// Nueva función para vaciar la baraja
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
    const initialGameState = initializeGame(gameData.player1, player2Data, baseCardData);
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
            const isLocal = playerType === 'local-player';
            // Solo renderizamos las cartas si es el jugador local
            if (isLocal) {
                handDiv.appendChild(createGameCard(cardData, null, gameData, isLocal));
            }
        });

        gameData.gameState.fields[playerKey].forEach(cardInstance => {
            const cardData = baseCardData.get(cardInstance.id);
            fieldDiv.appendChild(createGameCard(cardData, cardInstance, gameData, true));
        });
    });

    const isMyTurn = gameData.gameState.turn === currentUser.uid;
    document.body.classList.toggle('its-my-turn', isMyTurn);
    gameActionsBar.classList.toggle('hidden', !isMyTurn);
    endTurnBtn.onclick = () => sendGameAction({ type: 'END_TURN' }, gameData.id);

    if (gameData.gameState.winner) {
        gameStatus.textContent = `¡Ganador: ${gameData.gameState.winner}!`;
        gameActionsBar.classList.add('hidden');
    } else {
        gameStatus.textContent = isMyTurn ? "¡Es tu turno!" : `Turno de ${opponentPlayerState.displayName}`;
    }
}

function createGameCard(card, instance, gameData, isVisible) {
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

    if (instance) { // En el campo
        cardEl.classList.add('on-field');
        if (instance.tapped) cardEl.classList.add('tapped');
        if (isMyTurn && !instance.tapped && card.texto.match(/\(\d+\)/)) {
            cardEl.classList.add('actionable');
            cardEl.onclick = () => showCardActions(card, instance, gameData.id);
        }
    } else { // En la mano
        const localPlayerKey = gameData.gameState.players.player1.uid === currentUser.uid ? 'player1' : 'player2';
        if (isMyTurn && gameData.gameState.players[localPlayerKey].unidades >= card.coste) {
            cardEl.classList.add('playable');
            cardEl.onclick = () => sendGameAction({ type: 'PLAY_CARD', cardId: card.id }, gameData.id);
        }
    }
    return cardEl;
}

function showCardActions(card, instance, gameId) {
    cardActionTitle.textContent = `Acciones para ${card.nombre}`;
    cardActionButtons.innerHTML = '';
    const actions = card.texto.match(/[A-Z]+\s*\(\d+\)/g) || [];
    actions.forEach(actionText => {
        const btn = document.createElement('button');
        btn.className = 'btn-control';
        btn.textContent = actionText;
        btn.onclick = () => {
            sendGameAction({ type: 'ACTIVATE_ABILITY', instanceId: instance.instanceId, action: actionText }, gameId);
            cardActionModal.classList.add('hidden');
        };
        cardActionButtons.appendChild(btn);
    });
    cardActionModal.classList.remove('hidden');
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


