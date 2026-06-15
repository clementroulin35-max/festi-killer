import { generateTargetLoop } from "../services/gameEngine.js";

// Pure simulation of the mid-game insertion target swapping logic
function simulatePlayerInsertion(players, newPlayerName) {
  const randomIndex = Math.floor(Math.random() * players.length);
  const playerA = players[randomIndex];
  const playerBName = playerA.target;

  const newPlayer = {
    name: newPlayerName,
    target: playerBName,
  };

  playerA.target = newPlayerName;
  return [...players, newPlayer];
}

// Pure simulation of the instant target abandon logic
function simulateAbandon(players, playerName, costType) {
  const killer = players.find(p => p.name === playerName);
  const victim = players.find(p => p.name === killer.target);

  if (!killer || !victim) return players;

  let diedNow = false;
  if (costType === "lives") {
    killer.lives = Math.max(0, killer.lives - 1.0);
    if (killer.lives === 0 && !killer.isZombie) {
      killer.isZombie = true;
      diedNow = true;
    }
  } else {
    killer.score = Math.max(0, killer.score - 150);
  }

  const oldVictimName = victim.name;
  const oldVictimTarget = victim.target;
  const X = players.find(p => p.target === killer.name);

  if (players.length > 2) {
    if (diedNow || killer.isZombie) {
      if (X) {
        X.target = oldVictimName;
      }
      killer.target = oldVictimTarget;
    } else {
      if (X) {
        X.target = oldVictimName;
      }
      victim.target = killer.name;
      killer.target = oldVictimTarget;
    }
  }

  return players;
}

function runTests() {
  console.log("=== Début des tests unitaires sur l'algorithme des cibles ===");
  let passedCount = 0;
  let testCount = 0;

  const runTest = (name, testFn) => {
    testCount++;
    try {
      testFn();
      console.log(`✅ TEST PASSED: ${name}`);
      passedCount++;
    } catch (error) {
      console.error(`❌ TEST FAILED: ${name}\n`, error.message);
    }
  };

  // Test 1: Boucle fermée avec 3 joueurs
  runTest("Boucle fermée valide avec 3 joueurs", () => {
    const players = ["A", "B", "C"];
    const targets = generateTargetLoop(players);
    
    players.forEach(p => {
      if (targets[p] === p) throw new Error(`${p} se cible lui-même`);
    });

    const visited = new Set();
    let current = "A";
    for (let i = 0; i < players.length; i++) {
      visited.add(current);
      current = targets[current];
    }
    
    if (current !== "A") throw new Error("La boucle ne se referme pas sur le point de départ");
    if (visited.size !== players.length) throw new Error(`Tous les joueurs n'ont pas été visités. Visités: ${visited.size}`);
  });

  // Test 2: Boucle fermée avec 10 joueurs
  runTest("Boucle fermée valide avec 10 joueurs", () => {
    const players = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"];
    const targets = generateTargetLoop(players);
    
    players.forEach(p => {
      if (targets[p] === p) throw new Error(`${p} se cible lui-même`);
    });

    const visited = new Set();
    let current = "P1";
    for (let i = 0; i < players.length; i++) {
      visited.add(current);
      current = targets[current];
    }
    
    if (current !== "P1") throw new Error("La boucle ne se referme pas sur le point de départ");
    if (visited.size !== players.length) throw new Error(`Tous les joueurs n'ont pas été visités. Visités: ${visited.size}`);
  });

  // Test 3: Robustesse sur 1000 simulations
  runTest("Robustesse sur 1000 simulations (pas d'erreurs ni de sous-boucles)", () => {
    const players = ["A", "B", "C", "D", "E", "F", "G"];
    for (let s = 0; s < 1000; s++) {
      const targets = generateTargetLoop(players);
      
      players.forEach(p => {
        if (targets[p] === p) throw new Error(`Simulation ${s}: ${p} se cible lui-même`);
      });

      const visited = new Set();
      let current = "A";
      for (let i = 0; i < players.length; i++) {
        visited.add(current);
        current = targets[current];
      }
      
      if (current !== "A" || visited.size !== players.length) {
        throw new Error(`Simulation ${s}: Boucle disjoint ou incomplète générée. Taille visitée: ${visited.size}`);
      }
    }
  });

  // Test 4: Levée d'erreur si moins de 2 joueurs
  runTest("Levée d'erreur avec moins de 2 joueurs", () => {
    try {
      generateTargetLoop(["Seul"]);
      throw new Error("Devrait lever une erreur pour 1 joueur");
    } catch (e) {
      if (!e.message.includes("Il faut au moins 2 joueurs")) {
        throw new Error("Message d'erreur inattendu: " + e.message);
      }
    }
  });

  // Test 5: Insertion en cours de partie
  runTest("Insertion d'un joueur en cours de partie préserve la boucle fermée unique", () => {
    const playerNames = ["YoshiMat", "Zoé", "Lucas", "Koilkn", "Sophie"];
    const initialTargets = generateTargetLoop(playerNames);

    let playersState = playerNames.map(name => ({
      name,
      target: initialTargets[name]
    }));

    playersState = simulatePlayerInsertion(playersState, "LateComer");

    if (playersState.length !== 6) {
      throw new Error("La taille des joueurs insérés est incorrecte");
    }

    const targetsMap = {};
    playersState.forEach(p => {
      targetsMap[p.name] = p.target;
    });

    playersState.forEach(p => {
      if (p.target === p.name) {
        throw new Error(`Le joueur inséré ${p.name} se cible lui-même`);
      }
    });

    const visited = new Set();
    let current = "YoshiMat";
    for (let i = 0; i < playersState.length; i++) {
      visited.add(current);
      current = targetsMap[current];
    }

    if (current !== "YoshiMat") {
      throw new Error("La boucle d'insertion ne se referme pas sur le point de départ");
    }
    if (visited.size !== 6) {
      throw new Error(`Toutes les cibles de la boucle d'insertion n'ont pas été parcourues (visité: ${visited.size})`);
    }
  });

  // NEW Test 6: Abandon de cible instantané (vivant et zombie)
  runTest("Abandon de cible instantané préserve la boucle fermée unique (Standard et Zombification)", () => {
    const playerNames = ["A", "B", "C", "D"];
    const initialTargets = generateTargetLoop(playerNames);

    // Scenario 1: Abandon standard (survit)
    let playersState = playerNames.map(name => ({
      name,
      target: initialTargets[name],
      lives: 7.0,
      score: 300,
      isZombie: false
    }));

    // Player A abandons target B with lives penalty (A survives, lives: 6.0)
    playersState = simulateAbandon(playersState, "A", "lives");

    // Check lives
    const A = playersState.find(p => p.name === "A");
    if (A.lives !== 6.0 || A.isZombie) {
      throw new Error("Pénalité de vie d'abandon standard incorrectement appliquée");
    }

    // Check loop
    let targetsMap = {};
    playersState.forEach(p => { targetsMap[p.name] = p.target; });
    let visited = new Set();
    let current = "A";
    for (let i = 0; i < playersState.length; i++) {
      visited.add(current);
      current = targetsMap[current];
    }
    if (current !== "A" || visited.size !== 4) {
      throw new Error("Boucle brisée après abandon standard");
    }

    // Scenario 2: Abandon de zombification (meurt)
    playersState = playerNames.map(name => ({
      name,
      target: initialTargets[name],
      lives: name === "A" ? 1.0 : 7.0, // A only has 1 life
      score: 300,
      isZombie: false
    }));

    // Player A abandons target B with lives penalty (A dies, becomes zombie)
    playersState = simulateAbandon(playersState, "A", "lives");
    
    const A_zombie = playersState.find(p => p.name === "A");
    if (A_zombie.lives !== 0.0 || !A_zombie.isZombie) {
      throw new Error("Zombification non appliquée après perte du dernier coeur");
    }

    // Check active loop integrity (A should be bypassed)
    // Loop of active players should exclude A. Active list: B, C, D
    targetsMap = {};
    playersState.forEach(p => { targetsMap[p.name] = p.target; });
    
    // Traversal from B should visit B, C, D and return to B, bypassing A.
    visited = new Set();
    current = "B";
    for (let i = 0; i < 3; i++) {
      visited.add(current);
      current = targetsMap[current];
    }
    if (current !== "B") {
      throw new Error("Boucle active brisée après zombification du joueur A");
    }
    if (visited.has("A")) {
      throw new Error("Le joueur zombie A n'a pas été contourné dans la boucle active");
    }

    // A (Zombie) should still target someone (C)
    if (!A_zombie.target) {
      throw new Error("Le zombie A a perdu sa cible");
    }
  });

  console.log(`\n=== Bilan des tests : ${passedCount}/${testCount} réussis ===`);
  if (passedCount !== testCount) {
    process.exit(1);
  }
}

runTests();
