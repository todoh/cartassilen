const CARD_DATABASE = {
  characters: [
    {
      id: 'ignis',
      name: 'Ignis, el Puño de Lava',
      type: 'Guerrero / Fuego',
      cost: 2,
      hp: 12, maxHp: 12,
      energy: 8, maxEnergy: 8,
      hpRegen: 1, energyRegen: 2,
      str: 5, pow: 2, arm: 3, mnd: 2, spd: 3, dex: 4, agi: 3,
      img: 'assets/ignis.png',
      techniques: [{ name: 'Explosión de Magma', cost: 4, desc: 'Daño de Fuego (POW + 5) e infunde Quemadura.' }]
    },
    {
      id: 'sylvana',
      name: 'Sylvana, la Voz del Viento',
      type: 'Mago / Bosque',
      cost: 2,
      hp: 9, maxHp: 9,
      energy: 12, maxEnergy: 12,
      hpRegen: 1, energyRegen: 3,
      str: 2, pow: 5, arm: 2, mnd: 4, spd: 4, dex: 5, agi: 4,
      img: 'assets/sylvana.png',
      techniques: [{ name: 'Raíces Atrapadoras', cost: 3, desc: 'Daño mágico (POW). Modifica EVA.' }]
    },
    {
      id: 'kael',
      name: 'Kael, Buscador del Viento',
      type: 'Bestia / Elfo',
      cost: 1,
      hp: 10, maxHp: 10,
      energy: 10, maxEnergy: 10,
      hpRegen: 1, energyRegen: 2,
      str: 3, pow: 3, arm: 2, mnd: 3, spd: 5, dex: 5, agi: 5,
      img: 'assets/kael.png',
      techniques: [{ name: 'Tiro Certero', cost: 3, desc: 'Daño físico directo (STR).' }]
    },
    {
      id: 'gorgon',
      name: 'Gorgón, Coloso Ancestral',
      type: 'Guerrero / Tierra',
      cost: 3,
      hp: 15, maxHp: 15,
      energy: 6, maxEnergy: 6,
      hpRegen: 2, energyRegen: 1,
      str: 6, pow: 1, arm: 5, mnd: 1, spd: 2, dex: 3, agi: 1,
      img: 'assets/gorgon.png',
      techniques: [{ name: 'Impacto Terrestre', cost: 4, desc: 'Daño masivo (STR + 2).' }]
    },
    {
      id: 'zephyr',
      name: 'Zephyr, Sombra del Filo',
      type: 'Pícaro / Sombra',
      cost: 2,
      hp: 10, maxHp: 10,
      energy: 8, maxEnergy: 8,
      hpRegen: 1, energyRegen: 2,
      str: 4, pow: 1, arm: 2, mnd: 2, spd: 6, dex: 6, agi: 5,
      img: 'assets/zephyr.png',
      techniques: [{ name: 'Corte Fantasma', cost: 3, desc: 'Ataque veloz e ineludible (STR + 1).' }]
    },
    {
      id: 'valeria',
      name: 'Valeria, Clérigo Albor',
      type: 'Clérigo / Luz',
      cost: 2,
      hp: 11, maxHp: 11,
      energy: 10, maxEnergy: 10,
      hpRegen: 2, energyRegen: 3,
      str: 3, pow: 4, arm: 3, mnd: 5, spd: 3, dex: 4, agi: 3,
      img: 'assets/valeria.png',
      techniques: [{ name: 'Destello Sagrado', cost: 4, desc: 'Restaura 4 HP a aliados o daña Nexo.' }]
    },
    {
      id: 'null_prime',
      name: 'Null Prime, el Autómata',
      type: 'Mecano / Neutral',
      cost: 3,
      hp: 14, maxHp: 14,
      energy: 8, maxEnergy: 8,
      hpRegen: 0, energyRegen: 2,
      str: 5, pow: 3, arm: 4, mnd: 3, spd: 2, dex: 4, agi: 2,
      img: 'assets/null_prime.png',
      techniques: [{ name: 'Protocolo Núcleo', cost: 5, desc: 'Aumenta STR y ARM en +2 permanentemente.' }]
    }
  ],
  equipments: [
    {
      id: 'espada_ignea',
      name: 'Espada Ígnea',
      type: 'Equipo',
      cost: 2,
      desc: 'Otorga +2 STR.',
      img: 'assets/espada_ignea.png',
      statMod: { str: 2 }
    },
    {
      id: 'baston_sabiduria',
      name: 'Bastón de Sabiduría',
      type: 'Equipo',
      cost: 2,
      desc: 'Otorga +2 POW y +1 MND.',
      img: 'assets/baston_sabiduria.png',
      statMod: { pow: 2, mnd: 1 }
    },
    {
      id: 'coraza_titan',
      name: 'Coraza de Titán',
      type: 'Equipo',
      subType: 'Armadura',
      cost: 2,
      desc: 'Otorga +3 ARM de protección física.',
      img: 'assets/coraza_titan.png',
      statMod: { arm: 3 }
    }
  ],
  fields: [
    {
      id: 'bosque_mistico',
      name: 'Bosque Místico',
      type: 'Campo',
      cost: 2,
      img: 'assets/bosque_mistico.png',
      desc: 'Aplica regeneración de +1 HP a Elfo o Mago.'
    }
  ]
};

function generateDeck() {
  let deck = [];
  const source = [
    ...CARD_DATABASE.characters,
    ...CARD_DATABASE.equipments,
    ...CARD_DATABASE.fields
  ];
  for (let i = 0; i < 25; i++) {
    deck.push(JSON.parse(JSON.stringify(source[i % source.length])));
  }
  return deck.sort(() => Math.random() - 0.5);
}