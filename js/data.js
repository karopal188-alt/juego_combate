// Lore, Fighters, Interactive Arenas, and 3-Act Story Campaign Data
window.GAME_DATA = {
  realms: [
    {
      id: 'terra',
      name: 'Terra (Reino Mortal)',
      color: '#f4b942',
      summary:
        'Nuestro mundo. Sus defensores son artistas marciales secretos, agentes especiales y guerreros espirituales que desconocen el peligro real hasta que el torneo comienza. Ha perdido 9 veces seguidas.'
    },
    {
      id: 'valthor',
      name: 'Valthor (El Imperio Ceniza)',
      color: '#ff4b3e',
      summary:
        'Un mundo volcánico y despiadado gobernado por el Emperador Malakor. Si gana este décimo torneo consecutivo, tendrá el derecho sagrado de invadir Terra y drenar su energía vital.'
    },
    {
      id: 'vacio',
      name: 'El Vacío Etéreo',
      color: '#b46bff',
      summary:
        'Una dimensión intermedia habitada por espectros, ninjas malditos y dioses caídos que manipulan el torneo desde las sombras para sus propios fines.'
    },
    {
      id: 'umbral',
      name: 'El Umbral y el Eclipse Rojo',
      color: '#ff9636',
      summary:
        'Cada mil años, los tres soles se alinean en un eclipse rojo abriendo El Umbral. Los Antiguos impusieron el torneo a muerte para evitar guerras totales hasta completar diez victorias.'
    }
  ],

  fighters: {
    kaelen: {
      id: 'kaelen',
      name: 'KAELEN',
      title: 'El Monje de Fuego',
      realm: 'TERRA',
      realmColor: '#ff7b24',
      palette: {
        skin: '#d99e75',
        primary: '#c9232c',
        secondary: '#f4b942',
        dark: '#22141c',
        accent: '#ff8a2b',
        glow: '#ffae34'
      },
      stats: { speed: 4.5, jump: 12.6, power: 1.05, defense: 1.0, weight: 1.0 },
      bio: 'Guerrero exiliado de un templo oculto en las montañas. Canaliza llamas internas y entra al torneo para vengar a su maestro, asesinado por sicarios de Valthor.',
      moves: {
        special: { name: 'Llamarada Solar', cost: 1, type: 'projectile', color: '#ff7b24', speed: 9.2, dmg: 13 },
        element: { name: 'Patada Dragón', cost: 2, type: 'dash', color: '#ff3b2e', speed: 12.5, dmg: 20 },
        ultimate: { name: 'Furia del Sol Ancestral', cost: 3, type: 'pillar', color: '#ffd147', dmg: 34 },
        fatality: 'INCINERACIÓN DEL TEMPLO'
      },
      quote: 'Las llamas de mi templo jamás se extinguen.'
    },

    vespera: {
      id: 'vespera',
      name: 'VESPERA',
      title: 'Ninja del Hielo',
      realm: 'CLAN LINAJE BLANCO',
      realmColor: '#5ce1e6',
      palette: {
        skin: '#e2c5b8',
        primary: '#1f4e78',
        secondary: '#b8f3ff',
        dark: '#0f1726',
        accent: '#5ce1e6',
        glow: '#8ff6ff'
      },
      stats: { speed: 5.1, jump: 13.1, power: 0.96, defense: 0.94, weight: 0.92 },
      bio: 'Asesina letal que domina el hielo y las sombras. Sirve a Valthor por obligación, pero busca liberar a su clan de una maldición de sangre. Rival directa de Kaelen.',
      moves: {
        special: { name: 'Daga Glacial', cost: 1, type: 'projectile', color: '#5ce1e6', speed: 10.2, dmg: 11, slow: 90 },
        element: { name: 'Paso Sombrío', cost: 2, type: 'teleport_strike', color: '#8ef9ff', dmg: 18 },
        ultimate: { name: 'Ventisca Maldita', cost: 3, type: 'nova', color: '#6ff7ff', dmg: 32, slow: 120 },
        fatality: 'CERO ABSOLUTO'
      },
      quote: 'El hielo guarda secretos que Valthor no controla.'
    },

    espectro: {
      id: 'espectro',
      name: 'ESPECTRO CERO',
      title: 'El Ninja Vengativo',
      realm: 'EL VACÍO ETÉREO',
      realmColor: '#c77dff',
      palette: {
        skin: '#9486a8',
        primary: '#2f1947',
        secondary: '#f5b700',
        dark: '#0d0714',
        accent: '#39ff88',
        glow: '#b46bff'
      },
      stats: { speed: 4.8, jump: 12.8, power: 1.04, defense: 0.96, weight: 0.98 },
      bio: 'Antiguo guerrero traicionado y resucitado con fuego infernal del Vacío Etéreo. Busca destruir al líder del clan de Vespera por la masacre de su familia.',
      moves: {
        special: { name: 'Cadena Infernal', cost: 1, type: 'harpoon', color: '#f5b700', speed: 11.4, dmg: 12 },
        element: { name: 'Fuego del Vacío', cost: 2, type: 'teleport_strike', color: '#39ff88', dmg: 19 },
        ultimate: { name: 'Juicio del Infierno', cost: 3, type: 'pillar', color: '#b46bff', dmg: 35 },
        fatality: 'ALIENTO DEL VACÍO'
      },
      quote: '¡VEN AQUÍ! Nadie escapa a la condena del Vacío.'
    },

    jaxen: {
      id: 'jaxen',
      name: 'JAXEN VANCE',
      title: 'Soldado Cibernético',
      realm: 'TERRA',
      realmColor: '#4da6ff',
      palette: {
        skin: '#8f6148',
        primary: '#3e5c3a',
        secondary: '#9bb3c9',
        dark: '#192026',
        accent: '#3ec7ff',
        glow: '#6be0ff'
      },
      stats: { speed: 4.1, jump: 12.0, power: 1.15, defense: 1.12, weight: 1.16 },
      bio: 'Comandante de fuerzas especiales de Terra. Perdió ambos brazos en una emboscada interdimensional y usa prótesis hidráulicas cargadas de energía.',
      moves: {
        special: { name: 'Cañón Hidráulico', cost: 1, type: 'projectile', color: '#4dc9ff', speed: 8.6, dmg: 15 },
        element: { name: 'Golpe Sísmico', cost: 2, type: 'shockwave', color: '#68e1ff', dmg: 21 },
        ultimate: { name: 'Sobrecarga Táctica', cost: 3, type: 'nova', color: '#45b7ff', dmg: 36 },
        fatality: 'TRITURADORA HIDRÁULICA'
      },
      quote: 'Acero terrestre contra hechicería oscura. Hagan sus apuestas.'
    },

    malakor: {
      id: 'malakor',
      name: 'LORD MALAKOR',
      title: 'Emperador de Ceniza',
      realm: 'VALTHOR',
      realmColor: '#ff2a4b',
      palette: {
        skin: '#7e6a80',
        primary: '#59081b',
        secondary: '#d4af37',
        dark: '#12060d',
        accent: '#ff2a4b',
        glow: '#ff477e'
      },
      stats: { speed: 4.4, jump: 12.5, power: 1.18, defense: 1.12, weight: 1.1 },
      bio: 'Hechicero inmortal gobernante de Valthor. Roba las almas y habilidades de los guerreros que derrota y pretende abrir El Umbral por la fuerza.',
      moves: {
        special: { name: 'Orbe Roba-Almas', cost: 1, type: 'projectile', color: '#ff2a6d', speed: 8.2, dmg: 14, drain: 5 },
        element: { name: 'Pilar de Ceniza', cost: 2, type: 'pillar', color: '#ff5226', dmg: 22 },
        ultimate: { name: 'Eclipse de Almas', cost: 3, type: 'nova', color: '#ff1f4b', dmg: 38, drain: 12 },
        fatality: 'COSECHA DEL EMPERADOR'
      },
      quote: 'Nueve victorias ya son mías. ¡Terra será ceniza!'
    }
  },

  arenas: {
    umbral: {
      id: 'umbral',
      name: 'Isla del Umbral',
      realm: 'DIMENSIÓN NEUTRAL',
      desc: 'Templo suspendido fuera del tiempo. Contiene Runas de Chi en plataformas elevadas.',
      skyTop: '#16071c',
      skyBot: '#3c1026',
      sunColor: '#ff4252',
      groundColor: '#2c2038',
      trimColor: '#8d6bb5',
      hazardType: 'runes',
      platforms: [
        { x: 110, y: 345, w: 195, h: 16, oneWay: true },
        { x: 655, y: 345, w: 195, h: 16, oneWay: true },
        { x: 360, y: 245, w: 240, h: 16, oneWay: true }
      ]
    },
    valthor: {
      id: 'valthor',
      name: 'Forja de Ceniza',
      realm: 'VALTHOR',
      desc: 'Puentes volcánicos sobre magma vivo. ¡Cuidado con los géiseres de lava eruptivos!',
      skyTop: '#1f0606',
      skyBot: '#59150b',
      sunColor: '#ff7024',
      groundColor: '#291514',
      trimColor: '#cf4827',
      hazardType: 'lava',
      geysers: [250, 480, 710],
      platforms: [
        { x: 95, y: 345, w: 205, h: 16, oneWay: true },
        { x: 375, y: 275, w: 210, h: 16, oneWay: true },
        { x: 660, y: 345, w: 205, h: 16, oneWay: true }
      ]
    },
    vacio: {
      id: 'vacio',
      name: 'Santuario del Vacío',
      realm: 'EL VACÍO ETÉREO',
      desc: 'Ruinas espectrales con portales laterales que teletransportan al otro extremo.',
      skyTop: '#080517',
      skyBot: '#211047',
      sunColor: '#b56bff',
      groundColor: '#1b1433',
      trimColor: '#7848cc',
      hazardType: 'portals',
      portals: [
        { x: 65, y: 312, targetX: 875, targetY: 312 },
        { x: 895, y: 312, targetX: 85, targetY: 312 }
      ],
      platforms: [
        { x: 40, y: 350, w: 165, h: 16, oneWay: true },
        { x: 755, y: 350, w: 165, h: 16, oneWay: true },
        { x: 280, y: 265, w: 160, h: 16, oneWay: true },
        { x: 520, y: 265, w: 160, h: 16, oneWay: true }
      ]
    },
    eclipse: {
      id: 'eclipse',
      name: 'Cima del Eclipse Rojo',
      realm: 'EL COLAPSO DE REINOS',
      desc: 'Altar final bajo los tres soles sangrantes. Caen meteoros y plataformas tiemblan.',
      skyTop: '#1c020a',
      skyBot: '#5c0719',
      sunColor: '#ff1f3d',
      groundColor: '#260e18',
      trimColor: '#e6b145',
      hazardType: 'eclipse',
      platforms: [
        { x: 130, y: 345, w: 185, h: 16, oneWay: true, unstable: true },
        { x: 645, y: 345, w: 185, h: 16, oneWay: true, unstable: true },
        { x: 365, y: 240, w: 230, h: 16, oneWay: true }
      ]
    }
  },

  acts: [
    {
      id: 'act1',
      badge: 'ACTO 1: LA INVITACIÓN',
      title: 'La Invocación al Umbral',
      summary:
        'El Maestro Orin recluta a los defensores de Terra hacia la Isla del Umbral. Kaelen enfrenta a su rival Vespera y a una emboscada de Espectro Cero.',
      fights: [
        {
          player: 'kaelen',
          enemy: 'vespera',
          arena: 'umbral',
          difficulty: 'easy',
          preDialogue: [
            {
              speaker: 'MAESTRO ORIN',
              realm: 'GUARDIÁN DE TERRA',
              left: 'orin',
              right: 'kaelen',
              text: 'Los tres soles se alinean en rojo. Terra ha caído nueve veces ante Valthor. Si perdemos este décimo torneo, nuestro mundo será absorbido.'
            },
            {
              speaker: 'KAELEN',
              realm: 'MONJE DE FUEGO',
              left: 'orin',
              right: 'kaelen',
              text: 'Los sicarios de Valthor asesinaron a mi maestro. Honraré su memoria en la Isla del Umbral y defenderé Terra.'
            },
            {
              speaker: 'VESPERA',
              realm: 'CLAN LINAJE BLANCO',
              left: 'kaelen',
              right: 'vespera',
              text: 'Un monje exiliado... Mi clan sirve a Valthor por una maldición de sangre. No te interpongas, Kaelen, o el hielo sellará tu destino.'
            }
          ]
        },
        {
          player: 'kaelen',
          enemy: 'espectro',
          arena: 'vacio',
          difficulty: 'normal',
          preDialogue: [
            {
              speaker: 'ESPECTRO CERO',
              realm: 'EL VACÍO ETÉREO',
              left: 'kaelen',
              right: 'espectro',
              text: 'El Vacío Etéreo observa este torneo. El clan de Vespera exterminó a los míos... ¡y tú arderás primero como advertencia!'
            },
            {
              speaker: 'KAELEN',
              realm: 'TERRA',
              left: 'kaelen',
              right: 'espectro',
              text: '¡No soy tu enemigo, espectro! Pero si el Vacío busca sangre, probará la llama de Terra.'
            }
          ]
        }
      ]
    },
    {
      id: 'act2',
      badge: 'ACTO 2: TRAICIONES Y ALIANZAS',
      title: 'La Conspiración de Valthor',
      summary:
        'Descubren que Lord Malakor hace trampa para abrir el portal por la fuerza. Jaxen resiste en la Forja de Ceniza y Vespera traiciona a Valthor.',
      fights: [
        {
          player: 'jaxen',
          enemy: 'vespera',
          arena: 'valthor',
          difficulty: 'normal',
          preDialogue: [
            {
              speaker: 'JAXEN VANCE',
              realm: 'FUERZAS DE TERRA',
              left: 'jaxen',
              right: 'vespera',
              text: 'Mis sensores detectan grietas ilegales bajo la Forja. ¡Malakor está violando las leyes de los Antiguos para invadir sin ganar el torneo!'
            },
            {
              speaker: 'VESPERA',
              realm: 'CLAN LINAJE BLANCO',
              left: 'jaxen',
              right: 'vespera',
              text: '¿Qué...? Malakor prometió romper la maldición de mi clan si vencía limpiamente. ¡Demuéstrame que Terra tiene fuerza para detenerlo!'
            }
          ]
        },
        {
          player: 'vespera',
          enemy: 'espectro',
          arena: 'valthor',
          difficulty: 'normal',
          preDialogue: [
            {
              speaker: 'VESPERA',
              realm: 'ALIADA DE TERRA',
              left: 'vespera',
              right: 'espectro',
              text: 'Renuncio a Valthor. Malakor manipuló a mi clan y usó tu odio, Espectro Cero. ¡Únete a nosotros o enfréntame ahora!'
            },
            {
              speaker: 'ESPECTRO CERO',
              realm: 'EL VACÍO ETÉREO',
              left: 'vespera',
              right: 'espectro',
              text: 'Palabras vacías no devuelven a mi familia. ¡Ven aquí y responde por tu linaje!'
            }
          ]
        }
      ]
    },
    {
      id: 'act3',
      badge: 'ACTO 3: EL SACRIFICIO Y EL CLÍMAX',
      title: 'El Despertar del Eclipse',
      summary:
        'El Maestro Orin se sacrifica protegiendo el sello. Kaelen despierta su poder ancestral dorado y enfrenta a Malakor mientras los reinos colapsan.',
      fights: [
        {
          player: 'kaelen',
          enemy: 'jaxen',
          arena: 'umbral',
          difficulty: 'normal',
          preDialogue: [
            {
              speaker: 'MAESTRO ORIN',
              realm: 'ÚLTIMO ALIENTO',
              left: 'orin',
              right: 'kaelen',
              text: 'Malakor ha roto el sello central... Usaré mi espíritu para contener la brecha unos minutos. ¡Kaelen, recibe la Llama Ancestral!'
            },
            {
              speaker: 'JAXEN VANCE',
              realm: 'TERRA',
              left: 'kaelen',
              right: 'jaxen',
              text: 'El Maestro Orin cayó... Kaelen, si vas a subir a la cima contra Malakor, prueba ahora si tu nuevo fuego resiste el impacto total.'
            }
          ]
        },
        {
          player: 'kaelen',
          enemy: 'malakor',
          arena: 'eclipse',
          difficulty: 'hard',
          awakened: true,
          preDialogue: [
            {
              speaker: 'LORD MALAKOR',
              realm: 'EMPERADOR DE VALTHOR',
              left: 'kaelen',
              right: 'malakor',
              text: 'El viejo guardián murió en vano. ¡Los tres soles sangran y las almas de Terra alimentarán mi imperio eterno!'
            },
            {
              speaker: 'KAELEN (DESPERTAR)',
              realm: 'CAMPEÓN DE TERRA',
              left: 'kaelen',
              right: 'malakor',
              text: '¡Por el Maestro Orin, por Vespera y por todo Terra! ¡Este décimo torneo termina aquí, Malakor!'
            }
          ]
        }
      ]
    }
  ]
};
