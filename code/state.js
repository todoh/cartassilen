// CONTROL DE ESTADO GLOBAL UNIFICADO DE SILEN CCG
let state = {
  view: 'CAMPAIGN_SELECT', // Alterna entre 'CAMPAIGN_SELECT', 'MAP', 'COMBAT' y 'EDITOR'
  currentCampaign: null, // Identificador de la campaña activa
  silenPoints: 0,
  turn: 1, 
  phase: 'PREPARATION',
  playerHp: 20, 
  aiHp: 20,
  playerEnergy: 1, 
  playerMaxEnergy: 1, 
  aiEnergy: 1,
  playerHand: [], 
  playerDeck: [], 
  playerGraveyard: [],
  aiHand: [], 
  aiDeck: [], 
  aiGraveyard: [],
  playerField: [ 
    {character: null, equipments: [], field: null}, 
    {character: null, equipments: [], field: null}, 
    {character: null, equipments: [], field: null} 
  ],
  aiField: [ 
    {character: null, equipments: [], field: null}, 
    {character: null, equipments: [], field: null}, 
    {character: null, equipments: [], field: null} 
  ],
  currentMapNode: null,
  mapNodes: []
};

let selectedHandIndex = null;