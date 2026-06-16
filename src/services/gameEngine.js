// Config & game constants
export const GAME_CONFIG = {
  INITIAL_LIVES: 7,
  INITIAL_SKIPS: 2,
  BONUS_EPHEMERAL: 0,
  BONUS_KILL: 100,
  PENALTY_ACCUSED_CORRECT: -25,
  PENALTY_ABANDON_POINTS: -50,
  PENALTY_ABANDON_LIVES: 0.5,
  PENALTY_ACCUSED_INCORRECT_LIVES: 0.5,
};

// Default pool of 31 actions
export const DEFAULT_ACTIONS = [
  // Micro-défis (+10 pts, -0.5 hearts)
  { id: 1, title: "Le Vol de Style", description: "Faire porter à la cible l'un de tes accessoires pendant au moins 1h.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 2, title: "Le Vol de Style inversé", description: "Échanger un accessoire avec la cible, elle doit le garder 1h.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 3, title: "L'Ami VIP", description: "Faire faire un selfie à la cible avec un bénévole du festival.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 4, title: "Le Paparazzi", description: "Prendre 2 selfies distincts avec la cible en arrière-plan pendant qu'elle boit.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 5, title: "La Crème de la Crème", description: "Faire appliquer de la crème solaire sur le visage/les bras de la cible.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 6, title: "L'Ami Protecteur", description: "Lui faire tenir son verre pendant que tu lui remets sa capuche/chapeau.", difficulty: "micro", points: 10, damage: 0.5 },
  { id: 7, title: "La Star de la Mode", description: "Lui faire valider un compliment ironique sur ton style vestimentaire.", difficulty: "micro", points: 10, damage: 0.5 },

  // Actions Standards (+25 to +40 pts, -1.0 hearts)
  { id: 8, title: "Le Coup de Froid/Chaud", description: "Faire mettre puis retirer un pull à la cible en moins de 10 min.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 9, title: "Le Mixologue", description: "Faire boire la cible dans ton verre après avoir inversé vos verres.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 10, title: "La Blague Beauf", description: "Faire raconter une blague 'Melon et Melèche' à la cible.", difficulty: "standard", points: 25, damage: 1.0 },
  { id: 11, title: "Le Check Secret", description: "Créer et faire exécuter un check personnalisé complexe en 1v1.", difficulty: "standard", points: 40, damage: 1.0 },
  { id: 12, title: "Le Duel de Pouvoir", description: "Faire faire un Shifumi à la cible.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 13, title: "La Punition Sportive", description: "Faire faire une série de pompes à la cible.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 14, title: "L'Ombre du Prédateur", description: "S'asseoir/monter sur la queue de YoshiMat sans qu'elle s'en rende compte.", difficulty: "standard", points: 40, damage: 1.0 },
  { id: 15, title: "Le Fan Absolu", description: "Faire répéter 3 fois 'J'adore ce groupe' sur un style de musique opposé.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 16, title: "Le Syndrome de la Tourette", description: "Faire crier un mot hors contexte (ex: 'Pastèque') à la cible en discussion.", difficulty: "standard", points: 30, damage: 1.0 },
  { id: 17, title: "Le Troc Absurde", description: "Échanger une chaussure/claquette avec elle au camp pendant 5 min.", difficulty: "standard", points: 40, damage: 1.0 },
  { id: 18, title: "Le Masseur du Dimanche", description: "Se faire masser les épaules par la cible pendant 30 secondes.", difficulty: "standard", points: 30, damage: 1.0 },

  // Actions Majeures (+100 to +200 pts, -2.0 hearts)
  { id: 19, title: "L'Apéro Fatal", description: "Faire boire un shot d'un coup à la cible (Alcool ou Soft).", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 20, title: "Le Danseur étoile", description: "Faire danser au moins 30 secondes de Bachata à la cible.", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 21, title: "La Sieste Connectée", description: "Se reposer avec la cible dans le même hamac pendant 10 min.", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 22, title: "La Rando Nocturne", description: "Emmener la cible voir les toiles phosphorescentes (forêt/scène chill) de nuit.", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 23, title: "Le Cavalier", description: "Faire monter la cible sur le dos de quelqu'un.", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 24, title: "Le Brise-Glace", description: "Faire faire/recevoir un massage à la cible par un inconnu.", difficulty: "majeur", points: 200, damage: 2.0 },
  { id: 25, title: "Le Capitaine de Chenille", description: "Faire lancer ou rejoindre une chenille à la cible.", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 26, title: "Le Guide Aveugle", description: "Guider la cible les yeux fermés sur 20 mètres (fausse surprise/boue).", difficulty: "majeur", points: 150, damage: 2.0 },
  { id: 27, title: "L'Instinct Animal", description: "Faire faire le cri d'un animal à la cible pour 'tester sa voix'.", difficulty: "majeur", points: 150, damage: 2.0 },

  // Actions Légendaires (+500 pts, -3.0 hearts)
  { id: 28, title: "Le Strike du Festival", description: "Faire faire une partie de bowling à la fête foraine à la cible.", difficulty: "legendaire", points: 500, damage: 3.0 },
  { id: 29, title: "Le Saute-Mouton", description: "Faire faire un saute-mouton à la cible au milieu de la foule.", difficulty: "legendaire", points: 500, damage: 3.0 },
  { id: 30, title: "L'Étoile de Mer (Spécial Zoé)", description: "Faire faire l'étoile de mer au sol à la cible pendant 20 secondes.", difficulty: "legendaire", points: 500, damage: 3.0 },
  { id: 31, title: "L'Animateur de Camping", description: "Faire lancer une Hola à la cible, suivie par au moins 3 inconnus.", difficulty: "legendaire", points: 500, damage: 3.0 },
];

/**
 * Shuffles an array in place.
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a closed-loop target list.
 * e.g., if players are [A, B, C], and shuffled to [C, A, B]:
 * C targets A
 * A targets B
 * B targets C
 * This guarantees a single closed loop without self-targeting.
 * Returns an object mapping killerName -> targetName
 */
export function generateTargetLoop(playerNames) {
  if (!playerNames || playerNames.length < 2) {
    throw new Error("Il faut au moins 2 joueurs pour former une boucle de cibles.");
  }

  const shuffled = shuffle(playerNames);
  const targets = {};

  for (let i = 0; i < shuffled.length; i++) {
    const killer = shuffled[i];
    const target = shuffled[(i + 1) % shuffled.length];
    targets[killer] = target;
  }

  return targets;
}

/**
 * Returns a random action from the action pool.
 * Can optionally exclude a list of action IDs.
 */
export function getRandomAction(excludeIds = []) {
  const available = DEFAULT_ACTIONS.filter(a => !excludeIds.includes(a.id));
  if (available.length === 0) {
    // If all actions are excluded, fall back to any random action
    return DEFAULT_ACTIONS[Math.floor(Math.random() * DEFAULT_ACTIONS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
