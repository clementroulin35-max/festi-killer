import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { 
  generateTargetLoop, 
  getRandomAction, 
  DEFAULT_ACTIONS, 
  DEFAULT_FOUNTAIN_POOL,
  GAME_CONFIG 
} from "../services/gameEngine";

const GameContext = createContext();

const initialGameState = {
  started: false,
  players: [],
  history: [],
  actionPool: DEFAULT_ACTIONS,
  lastSkipAwardedDate: null,
};

export const GameProvider = ({ children }) => {
  const [gameCode, setGameCode] = useState(() => {
    return localStorage.getItem("cookillers_game_code") || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem("cookillers_current_user");
    return (cached && cached !== "null") ? cached : null;
  });

  const [gameState, setGameState] = useState(initialGameState);
  const [loading, setLoading] = useState(false);

  // Sync gameCode and currentUser with LocalStorage
  useEffect(() => {
    if (gameCode) {
      localStorage.setItem("cookillers_game_code", gameCode);
    } else {
      localStorage.removeItem("cookillers_game_code");
    }
  }, [gameCode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("cookillers_current_user", currentUser);
    } else {
      localStorage.removeItem("cookillers_current_user");
    }
  }, [currentUser]);

  // Fetch complete state from Supabase
  const fetchGameState = async (code) => {
    if (!code) return;
    try {
      // 1. Get Game info
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", code)
        .maybeSingle();

      if (gameError) throw gameError;
      
      // If room doesn't exist, reset code
      if (!gameData) {
        setGameCode(null);
        setGameState(initialGameState);
        return;
      }

      // 2. Get Players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_code", code);

      if (playersError) throw playersError;

      // 3. Get Actions from pool
      const { data: actionPoolsData, error: poolError } = await supabase
        .from("action_pools")
        .select("*")
        .eq("game_code", code);

      if (poolError) throw poolError;

      // 4. Get History
      const { data: historyData, error: historyError } = await supabase
        .from("history")
        .select("*")
        .eq("game_code", code)
        .order("timestamp", { ascending: false });

      if (historyError) throw historyError;

      // Format players for local state compatibility
      const formattedPlayers = (playersData || []).map(p => ({
        name: p.name,
        pin: p.pin,
        lives: Number(p.lives),
        score: p.score,
        skips: p.skips,
        isZombie: p.is_zombie,
        target: p.target,
        actionId: p.action_id,
        actionEphemeral: p.action_ephemeral,
        photo: p.photo,
        fountainUsesToday: p.fountain_uses_today || 0,
        fountainRefreshesToday: p.fountain_refreshes_today === null ? 3 : p.fountain_refreshes_today,
        fountainTotalUses: p.fountain_total_uses || 0,
        fountainActiveType: p.fountain_active_type,
        fountainActiveTitle: p.fountain_active_title,
        fountainActiveDescription: p.fountain_active_description,
      }));

      // Format action pool
      const formattedActionPool = (actionPoolsData || []).map(a => ({
        id: a.action_id,
        title: a.title,
        description: a.description,
        difficulty: a.difficulty,
        points: a.points,
        damage: Number(a.damage),
        isEphemeral: a.is_ephemeral
      }));

      // Format history
      const formattedHistory = (historyData || []).map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        type: h.type,
        status: h.status,
        killer: h.killer,
        target: h.target,
        actionId: h.action_id,
        actionTitle: h.action_title,
        points: h.points,
        damage: Number(h.damage),
        isEphemeral: h.is_ephemeral,
        message: h.message,
        metadata: h.metadata,
        responseText: h.response_text,
        photoProof: h.photo_proof
      }));

      const newState = {
        started: gameData.started,
        players: formattedPlayers,
        actionPool: formattedActionPool.length > 0 ? formattedActionPool : DEFAULT_ACTIONS,
        history: formattedHistory,
        lastSkipAwardedDate: gameData.last_skip_awarded_date
      };

      setGameState(newState);
      
      // Cache for offline-first fallback
      localStorage.setItem(`cache_cookillers_${code}`, JSON.stringify(newState));
    } catch (err) {
      console.error("Erreur fetchGameState Supabase :", err);
      // Load from LocalStorage Cache
      const cached = localStorage.getItem(`cache_cookillers_${code}`);
      if (cached) {
        setGameState(JSON.parse(cached));
      }
    }
  };

  // Subscribe to realtime database changes when gameCode changes
  useEffect(() => {
    if (!gameCode) {
      setGameState(initialGameState);
      return;
    }

    fetchGameState(gameCode);

    const subscription = supabase
      .channel(`realtime_room:${gameCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `game_code=eq.${gameCode}` },
        () => fetchGameState(gameCode)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_code=eq.${gameCode}` },
        () => fetchGameState(gameCode)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_pools", filter: `game_code=eq.${gameCode}` },
        () => fetchGameState(gameCode)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "history", filter: `game_code=eq.${gameCode}` },
        () => fetchGameState(gameCode)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [gameCode]);

  // Helper to log history event directly to Supabase
  const logEvent = async (type, details) => {
    if (!gameCode) return;
    const newEvent = {
      game_code: gameCode,
      type,
      status: details.status || "pending",
      killer: details.killer || null,
      target: details.target || null,
      action_id: details.actionId || null,
      action_title: details.actionTitle || null,
      points: details.points || 0,
      damage: details.damage || 0,
      is_ephemeral: !!details.isEphemeral,
      message: details.message,
      metadata: details.metadata || null,
      response_text: details.responseText || null,
      photo_proof: details.photoProof || null
    };

    const { data, error } = await supabase.from("history").insert([newEvent]).select();
    if (error) {
      console.error("Erreur insertion log historique :", error);
    }
    return data ? data[0]?.id : null;
  };

  // ROOM ACTIONS
  const createRoom = async (code, gmPin = "0000") => {
    setLoading(true);
    try {
      const upperCode = code.toUpperCase().trim();
      
      // 1. Create Room in games
      const { error: gameError } = await supabase
        .from("games")
        .insert([{ game_code: upperCode, started: false, gm_pin: gmPin }]);

      if (gameError) throw gameError;

      // 2. Populate starting action pools
      const actionsToInsert = DEFAULT_ACTIONS.map(a => ({
        game_code: upperCode,
        action_id: a.id,
        title: a.title,
        description: a.description,
        difficulty: a.difficulty,
        points: a.points,
        damage: a.damage,
        is_ephemeral: false
      }));

      const { error: poolError } = await supabase
        .from("action_pools")
        .insert(actionsToInsert);

      if (poolError) throw poolError;

      // 2b. Populate starting fountain pool
      const fountainToInsert = DEFAULT_FOUNTAIN_POOL.map(f => ({
        game_code: upperCode,
        type: f.type,
        difficulty: f.difficulty,
        title: f.title,
        description: f.description
      }));

      const { error: fountainPoolError } = await supabase
        .from("fountain_pool")
        .insert(fountainToInsert);

      if (fountainPoolError) throw fountainPoolError;

      setGameCode(upperCode);
      return upperCode;
    } catch (err) {
      console.error("Erreur de création de salon :", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code) => {
    const upperCode = code.toUpperCase().trim();
    const { data, error } = await supabase
      .from("games")
      .select("game_code")
      .eq("game_code", upperCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error(`Le salon "${upperCode}" n'existe pas.`);
    }
    setGameCode(upperCode);
    return upperCode;
  };

  // 13. Dynamic Player Insertion Mid-Game
  const insertPlayerMidGame = async (playerName, customPin = "0000") => {
    const cleanName = playerName.trim();
    if (!cleanName || !gameCode) return;

    if (gameState.players.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Le joueur "${cleanName}" existe déjà dans la partie.`);
    }

    setLoading(true);
    try {
      const players = gameState.players;
      
      const randomIndex = Math.floor(Math.random() * players.length);
      const playerA = players[randomIndex];
      const playerBName = playerA.target;
      
      const usedActionIds = players.map(p => p.actionId);
      const pool = gameState.actionPool;
      
      const available = pool.filter(a => !usedActionIds.includes(a.id));
      const initialAction = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      const initialActionId = initialAction ? initialAction.id : null;

      // 1. Insert new player (targets B)
      await supabase
        .from("players")
        .insert([{
          game_code: gameCode,
          name: cleanName,
          pin: customPin,
          lives: GAME_CONFIG.INITIAL_LIVES,
          score: 0,
          skips: GAME_CONFIG.INITIAL_SKIPS,
          is_zombie: false,
          target: playerBName,
          action_id: initialActionId,
          action_ephemeral: false,
          fountain_refreshes_today: 3,
          fountain_uses_today: 0
        }]);

      // 2. Update player A to target new player
      await supabase
        .from("players")
        .update({ target: cleanName })
        .eq("game_code", gameCode)
        .eq("name", playerA.name);

      await logEvent("player_joined", {
        status: "approved",
        message: `📢 Nouveau participant inséré en cours de partie ! ${cleanName} rejoint la partie.`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (playerName) => {
    if (!gameCode) return;
    setLoading(true);
    try {
      const playerToRemove = gameState.players.find(p => p.name === playerName);
      if (playerToRemove && playerToRemove.target) {
        const killerOfRemoved = gameState.players.find(p => p.target === playerName && p.name !== playerName);
        if (killerOfRemoved) {
          let newTarget = playerToRemove.target;
          if (newTarget === killerOfRemoved.name) {
            newTarget = null;
          }
          await supabase
            .from("players")
            .update({ target: newTarget })
            .eq("game_code", gameCode)
            .eq("name", killerOfRemoved.name);
        }
      }

      await supabase
        .from("players")
        .delete()
        .eq("game_code", gameCode)
        .eq("name", playerName);
      
      await logEvent("player_kicked", {
        status: "approved",
        message: `${playerName} a été retiré de la partie par le GM.`
      });
      
      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur suppression joueur :", err);
    } finally {
      setLoading(false);
    }
  };

  const requestPinRecovery = async (code, name) => {
    const cleanName = name.trim();
    const { data: player } = await supabase
      .from("players")
      .select("pin")
      .eq("game_code", code)
      .eq("name", cleanName)
      .maybeSingle();

    if (!player) {
      throw new Error(`Le joueur "${cleanName}" n'est pas enregistré dans ce salon.`);
    }

    await logEvent("pin_recovery", {
      killer: cleanName,
      status: "pending",
      message: `[RECUPERATION PIN] ${cleanName} a oublié son code PIN. PIN enregistré : ${player.pin}`
    });
  };

  const dismissPinRecovery = async (historyId) => {
    setLoading(true);
    try {
      await supabase
        .from("history")
        .update({ status: "approved" })
        .eq("id", historyId);
      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loginPlayer = async (code, name, pin) => {
    const cleanName = name.trim();
    const cleanPin = pin.trim();

    // Check if player exists in table
    const { data: player, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_code", code)
      .eq("name", cleanName)
      .maybeSingle();

    if (error) throw error;

    if (player) {
      // Check PIN
      if (player.pin !== cleanPin) {
        throw new Error("Ce pseudo est déjà pris dans ce salon. Saisissez votre bon code PIN pour vous connecter ou choisissez un autre pseudo.");
      }
    } else {
      // If game started, dynamically inject the player with their chosen pin!
      const { data: game } = await supabase.from("games").select("started").eq("game_code", code).single();
      
      const { count } = await supabase
        .from("players")
        .select("*", { count: 'exact', head: true })
        .eq("game_code", code);

      if (game?.started && (count || 0) >= 3) {
        await insertPlayerMidGame(cleanName, cleanPin);
      } else {
        // Allow signup during setup or if there are less than 3 players in a started game
        const { error: insertError } = await supabase
          .from("players")
          .insert([{
            game_code: code,
            name: cleanName,
            pin: cleanPin,
            lives: GAME_CONFIG.INITIAL_LIVES,
            score: 0,
            skips: GAME_CONFIG.INITIAL_SKIPS,
            is_zombie: false,
            fountain_refreshes_today: 3,
            fountain_uses_today: 0
          }]);

        if (insertError) throw insertError;

        // If this makes it exactly 3 players, and the game is started, trigger the real game loop
        if (game?.started && (count || 0) === 2) {
          const { data: currentPlayers } = await supabase
            .from("players")
            .select("name")
            .eq("game_code", code);
          const newPlayerNames = currentPlayers ? currentPlayers.map(p => p.name) : [cleanName];
          await startRealGameLoop(code, newPlayerNames);
        }
      }
    }

    setCurrentUser(cleanName);
    return cleanName;
  };

  const loginGM = async (code, pin) => {
    const cleanPin = pin.trim();
    const { data: game, error } = await supabase
      .from("games")
      .select("gm_pin")
      .eq("game_code", code)
      .maybeSingle();

    if (error) throw new Error("Erreur de connexion à la base de données.");
    if (!game) throw new Error(`Le salon "${code}" n'existe pas.`);

    const expectedPin = game.gm_pin || "0000";
    if (cleanPin !== expectedPin) {
      throw new Error("Code PIN GM incorrect.");
    }

    setCurrentUser("GM");
    return "GM";
  };

  const startRealGameLoop = async (code, playerNames) => {
    const targets = generateTargetLoop(playerNames);
    
    // Get current actions from pool
    const { data: dbActions } = await supabase.from("action_pools").select("*").eq("game_code", code);
    const actionPool = dbActions && dbActions.length > 0 ? dbActions : DEFAULT_ACTIONS;

    // Update each player with targets and actions
    for (const name of playerNames) {
      // Draw distinct random action
      const randomAction = actionPool[Math.floor(Math.random() * actionPool.length)];

      await supabase
        .from("players")
        .update({
          target: targets[name],
          action_id: randomAction.action_id || randomAction.id,
          action_ephemeral: false
        })
        .eq("game_code", code)
        .eq("name", name);
    }



    await logEvent("game_started", {
      message: "La partie a commencé !",
      status: "approved"
    });
  };

  // 1. Initialiser la partie (GM)
  const initializeGame = async (playerNames) => {
    setLoading(true);
    try {
      // Update game status
      await supabase
        .from("games")
        .update({
          started: true
        })
        .eq("game_code", gameCode);

      if (playerNames && playerNames.length >= 3) {
        await startRealGameLoop(gameCode, playerNames);
      } else {
        await logEvent("game_started_waiting", {
          message: "Le salon est ouvert ! En attente de joueurs pour démarrer...",
          status: "approved"
        });
      }

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser la partie (GM)
  const resetGame = async () => {
    if (!gameCode) return;
    setLoading(true);
    try {
      // Delete room data cascade
      await supabase.from("games").delete().eq("game_code", gameCode);
      setGameCode(null);
      setCurrentUser("GM");
      setGameState(initialGameState);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Déclarer un Hit (Joueur)
  const declareHit = async (killerName) => {
    const killer = gameState.players.find(p => p.name === killerName);
    if (!killer) return;

    const action = gameState.actionPool.find(a => a.id === killer.actionId);
    if (!action) return;

    const finalPoints = action.points;

    await logEvent("hit_declaration", {
      killer: killerName,
      target: killer.target,
      actionId: action.id,
      actionTitle: action.title,
      points: finalPoints,
      damage: action.damage,
      isEphemeral: false,
      message: `${killerName} déclare avoir réussi son action "${action.title}" sur ${killer.target}.`,
      metadata: {
        actionTitle: action.title,
        actionDescription: action.description
      }
    });
  };

  // 3. Valider un Hit (GM)
  const approveHit = async (historyId) => {
    const event = gameState.history.find(e => e.id === historyId);
    if (!event || event.status !== "pending") return;

    setLoading(true);
    try {
      const killer = gameState.players.find(p => p.name === event.killer);
      const victim = gameState.players.find(p => p.name === event.target);

      if (!killer || !victim) return;

      let newVictimLives = victim.lives;
      let damageApplied = event.damage;
      let diedNow = false;
      let newVictimIsZombie = victim.isZombie;

      // Zombie mode rules
      if (killer.isZombie || victim.isZombie) {
        damageApplied = 0;
      } else {
        newVictimLives = Math.max(0, victim.lives - damageApplied);
        if (newVictimLives === 0) {
          newVictimIsZombie = true;
          diedNow = true;
        }
      }

      // Add points
      let pointsGained = event.points;
      if (diedNow) {
        pointsGained += GAME_CONFIG.BONUS_KILL;
      }
      if (killer.isZombie) {
        pointsGained = Math.floor(pointsGained / 2);
      }
      const newKillerScore = killer.score + pointsGained;

      // Loop update
      let newKillerTarget = killer.target;
      let victimUpdate = { lives: newVictimLives, is_zombie: newVictimIsZombie };
      let playersToUpdate = [];

      if (diedNow) {
        newKillerTarget = victim.target;
      } else {
        if (gameState.players.length > 2) {
          const X = gameState.players.find(p => p.target === killer.name);
          if (X) {
            playersToUpdate.push({ name: X.name, target: victim.name });
          }
          victimUpdate.target = killer.name;
          newKillerTarget = victim.target;
        }
      }

      if (newKillerTarget === killer.name) {
        const alternative = gameState.players.find(p => p.name !== killer.name && !p.isZombie);
        newKillerTarget = alternative ? alternative.name : null;
      }
      playersToUpdate = playersToUpdate.filter(p => p.name !== p.target);

      // Draw random action
      const pool = gameState.actionPool;
      const usedActionIds = gameState.players.map(p => p.actionId);
      const available = pool.filter(a => !usedActionIds.includes(a.id));
      const newAction = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      const newActionId = newAction ? newAction.id : null;

      // 1. Update victim in database
      await supabase
        .from("players")
        .update(victimUpdate)
        .eq("game_code", gameCode)
        .eq("name", victim.name);

      // 2. Update killer
      await supabase
        .from("players")
        .update({
          score: newKillerScore,
          skips: killer.skips + 1,
          target: newKillerTarget,
          action_id: newActionId,
          action_ephemeral: false
        })
        .eq("game_code", gameCode)
        .eq("name", killer.name);

      // 3. Update other loops players if any
      for (const p of playersToUpdate) {
        await supabase
          .from("players")
          .update({ target: p.target })
          .eq("game_code", gameCode)
          .eq("name", p.name);
      }

      // 4. Approve history event
      await supabase
        .from("history")
        .update({ status: "approved" })
        .eq("id", historyId);

      // Log hit validation
      let systemMsg = `${killer.name} gagne +${pointsGained} pts (${event.actionTitle}).`;
      if (damageApplied > 0) {
        systemMsg += ` ${victim.name} perd ${damageApplied} coeurs (reste ${newVictimLives} coeurs).`;
      } else {
        systemMsg += ` ${victim.name} ne perd pas de coeur (Mode Zombie).`;
      }
      if (diedNow) {
        systemMsg += ` ${victim.name} est éliminé et devient un ZOMBIE ! Bonus Coup de Grâce (+${GAME_CONFIG.BONUS_KILL} pts) pour ${killer.name}.`;
      }

      const actionItem = gameState.actionPool.find(a => a.id === event.actionId);
      const actionDesc = event.metadata?.actionDescription || actionItem?.description || "";

      await logEvent("hit_validation", {
        killer: killer.name,
        target: victim.name,
        actionId: event.actionId,
        actionTitle: event.actionTitle,
        points: pointsGained,
        damage: damageApplied,
        status: "approved",
        message: systemMsg,
        metadata: {
          actionTitle: event.actionTitle,
          actionDescription: actionDesc
        }
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Refuser un Hit (GM)
  const rejectHit = async (historyId) => {
    setLoading(true);
    try {
      const event = gameState.history.find(e => e.id === historyId);
      if (!event) return;

      await supabase
        .from("history")
        .update({ status: "rejected" })
        .eq("id", historyId);

      await logEvent("hit_rejection", {
        status: "approved",
        message: `Le GM a rejeté la déclaration de Hit de ${event.killer} sur ${event.target}.`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Skip Action (Joueur)
  const skipAction = async (playerName) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player || player.skips <= 0) return;

    setLoading(true);
    try {
      const pool = gameState.actionPool;
      const usedActionIds = gameState.players.map(p => p.actionId);
      const oldAction = pool.find(a => a.id === player.actionId);
      
      const available = pool.filter(a => !usedActionIds.includes(a.id));
      const newAction = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      const newActionId = newAction ? newAction.id : null;

      await supabase
        .from("players")
        .update({
          skips: player.skips - 1,
          action_id: newActionId,
          action_ephemeral: false
        })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      await logEvent("skip", {
        killer: playerName,
        status: "approved",
        message: `${playerName} a utilisé un Skip. Action changée : "${oldAction?.title || ''}" ➔ "${newAction.title}". Skips restants : ${player.skips - 1}.`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 6. Abandonner la cible INSTANTANÉMENT
  const abandonTargetInstant = async (playerName, costType) => {
    const killer = gameState.players.find(p => p.name === playerName);
    const victim = gameState.players.find(p => p.name === killer.target);

    if (!killer || !victim) return;

    setLoading(true);
    try {
      let systemMsg = `${killer.name} abandonne sa cible ${victim.name}. `;
      let diedNow = false;
      let newLives = killer.lives;
      let newScore = killer.score;
      let newIsZombie = killer.isZombie;

      // Apply penalty
      if (costType === "score") {
        newScore = Math.max(0, killer.score - 50);
        systemMsg += `Pénalité instantanée appliquée : -50 pts (nouveau score : ${newScore} pts).`;
      } else {
        if (!killer.isZombie) {
          newLives = Math.max(0, killer.lives - 0.5);
          systemMsg += `Pénalité instantanée appliquée : -0.5 cœur (reste ${newLives} coeurs).`;
          if (newLives === 0) {
            newIsZombie = true;
            diedNow = true;
          }
        }
      }

      const oldVictimName = victim.name;
      const oldVictimTarget = victim.target;

      let newKillerTarget = killer.target;
      let playersToUpdate = [];

      // Update target cycle closed-loop
      if (gameState.players.length > 2) {
        const X = gameState.players.find(p => p.target === killer.name);
        
        if (diedNow || killer.isZombie) {
          if (X) {
            playersToUpdate.push({ name: X.name, target: oldVictimName });
          }
          newKillerTarget = oldVictimTarget;
        } else {
          if (X) {
            playersToUpdate.push({ name: X.name, target: oldVictimName });
          }
          playersToUpdate.push({ name: victim.name, target: killer.name });
          newKillerTarget = oldVictimTarget;
        }
      }

      if (newKillerTarget === killer.name) {
        const alternative = gameState.players.find(p => p.name !== killer.name && !p.isZombie);
        newKillerTarget = alternative ? alternative.name : null;
      }
      playersToUpdate = playersToUpdate.filter(p => p.name !== p.target);

      // 1. Update killer stats
      await supabase
        .from("players")
        .update({
          lives: newLives,
          score: newScore,
          is_zombie: newIsZombie,
          target: newKillerTarget
        })
        .eq("game_code", gameCode)
        .eq("name", killer.name);

      // 2. Update loop players
      for (const p of playersToUpdate) {
        await supabase
          .from("players")
          .update({ target: p.target })
          .eq("game_code", gameCode)
          .eq("name", p.name);
      }

      systemMsg += ` Nouvelle cible : ${newKillerTarget}.`;
      if (diedNow) {
        systemMsg += ` ${killer.name} n'a plus d'énergie et devient un ZOMBIE ! 💀`;
      }

      await logEvent("abandon_validation", {
        killer: killer.name,
        status: "approved",
        message: systemMsg
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 8. Contre-attaque (Joueur)
  const counterAttack = async (accuserName, suspectName, accusedActionText) => {
    await logEvent("counter_attack", {
      killer: suspectName,
      target: accuserName,
      isEphemeral: false,
      message: `${accuserName} contre-attaque ! Accuse ${suspectName} de vouloir lui nuire.` + (accusedActionText ? ` Défi suspecté : "${accusedActionText}".` : " (Aucun détail précisé)"),
      metadata: { accusedActionText }
    });
  };

  // 9. Résolution contre-attaque (GM)
  const resolveCounterAttack = async (historyId, isCorrect) => {
    const event = gameState.history.find(e => e.id === historyId);
    if (!event || event.status !== "pending") return;

    setLoading(true);
    try {
      const killer = gameState.players.find(p => p.name === event.killer);
      const victim = gameState.players.find(p => p.name === event.target);

      if (!killer || !victim) return;

      let systemMsg = "";
      const pool = gameState.actionPool;

      if (isCorrect) {
        // Accused is indeed guilty
        const oldAction = pool.find(a => a.id === killer.actionId);
        const usedActionIds = gameState.players.map(p => p.actionId);
        
        const available = pool.filter(a => !usedActionIds.includes(a.id));
        const newAction = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : pool[Math.floor(Math.random() * pool.length)];

        const newActionId = newAction ? newAction.id : null;
        const newKillerScore = Math.max(0, killer.score + GAME_CONFIG.PENALTY_ACCUSED_CORRECT);

        // Update killer
        await supabase
          .from("players")
          .update({
            score: newKillerScore,
            action_id: newActionId,
            action_ephemeral: false
          })
          .eq("game_code", gameCode)
          .eq("name", killer.name);

        systemMsg = `Contre-attaque réussie ! ${victim.name} démasque son tueur ${killer.name}. L'action de ${killer.name} "${oldAction?.title}" est brûlée. Pénalité pour ${killer.name} : -25 pts. La cible reste identique.`;
      } else {
        // Accusation incorrect (paranoid penalty)
        let damage = GAME_CONFIG.PENALTY_ACCUSED_INCORRECT_LIVES;
        let diedNow = false;
        let newVictimLives = victim.lives;
        let newVictimIsZombie = victim.isZombie;

        if (!victim.isZombie) {
          newVictimLives = Math.max(0, victim.lives - damage);
          if (newVictimLives === 0) {
            newVictimIsZombie = true;
            diedNow = true;
          }
        }

        // Update victim
        await supabase
          .from("players")
          .update({
            lives: newVictimLives,
            is_zombie: newVictimIsZombie
          })
          .eq("game_code", gameCode)
          .eq("name", victim.name);

        systemMsg = `Contre-attaque échouée ! Fausse accusation de ${victim.name}. Pénalité de paranoïa : -0.5 coeur pour ${victim.name} (reste ${newVictimLives}).`;
        if (diedNow) {
          systemMsg += ` ${victim.name} devient un ZOMBIE !`;
        }
      }

      // Mark event as resolved
      await supabase
        .from("history")
        .update({ status: isCorrect ? "approved" : "rejected" })
        .eq("id", historyId);

      // Log result
      await logEvent("counter_attack_resolution", {
        status: "approved",
        message: systemMsg
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 10. Résurrection (GM)
  const resurrectZombie = async (playerName) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player || !player.isZombie) return;

    setLoading(true);
    try {
      let playersToUpdate = [];

      // Reintegration loop
      if (gameState.players.length > 2) {
        const otherKiller = gameState.players.find(p => p.name !== playerName && p.target === player.target);
        if (otherKiller) {
          playersToUpdate.push({ name: otherKiller.name, target: player.name });
        }
      }

      // Update resurrected player
      await supabase
        .from("players")
        .update({
          is_zombie: false,
          lives: 2.0
        })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      // Update loop
      for (const p of playersToUpdate) {
        await supabase
          .from("players")
          .update({ target: p.target })
          .eq("game_code", gameCode)
          .eq("name", p.name);
      }

      await logEvent("resurrect", {
        status: "approved",
        message: `RÉSURRECTION ! ${playerName} revient à la vie avec 2 cœurs ! Réintégré dans la boucle de cibles.`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 11. Mode Dieu (GM override)
  const manualEditPlayer = async (playerName, score, lives, isZombie, newName = null, newPin = null) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player) return;

    setLoading(true);
    try {
      const wasZombie = player.isZombie;
      const targetScore = Math.max(0, score);
      const targetLives = Math.max(0, Math.min(GAME_CONFIG.INITIAL_LIVES, lives));
      const targetZombie = isZombie || targetLives === 0;

      let playersToUpdate = [];

      // Si le nom a changé, vérifier si le nouveau nom n'est pas déjà pris
      if (newName && newName.trim().toLowerCase() !== playerName.toLowerCase()) {
        const nameExists = gameState.players.some(p => p.name.toLowerCase() === newName.trim().toLowerCase());
        if (nameExists) {
          throw new Error("Ce pseudo est déjà utilisé par un autre joueur dans ce salon.");
        }
      }

      if (wasZombie && !targetZombie) {
        if (gameState.players.length > 2) {
          const otherKiller = gameState.players.find(p => p.name !== playerName && p.target === player.target);
          if (otherKiller) {
            playersToUpdate.push({ name: otherKiller.name, target: player.name });
          }
        }
      } else if (!wasZombie && targetZombie) {
        const X = gameState.players.find(p => p.target === player.name);
        if (X) {
          playersToUpdate.push({ name: X.name, target: player.target });
        }
      }

      // 1. Si le nom a changé, mettre à jour le champ target des autres joueurs qui ciblaient playerName
      if (newName && newName.trim() !== playerName) {
        const finalNewName = newName.trim();
        await supabase
          .from("players")
          .update({ target: finalNewName })
          .eq("game_code", gameCode)
          .eq("target", playerName);
      }

      // 2. Mettre à jour la ligne du joueur
      const updates = {
        score: targetScore,
        lives: targetLives,
        is_zombie: targetZombie
      };
      if (newPin) updates.pin = newPin.trim();
      if (newName && newName.trim() !== playerName) updates.name = newName.trim();

      await supabase
        .from("players")
        .update(updates)
        .eq("game_code", gameCode)
        .eq("name", playerName);

      // 3. Mettre à jour les cibles du reste de la boucle
      for (const p of playersToUpdate) {
        const targetPlayerName = p.name === playerName && newName ? newName.trim() : p.name;
        const targetVal = p.target === playerName && newName ? newName.trim() : p.target;

        await supabase
          .from("players")
          .update({ target: targetVal })
          .eq("game_code", gameCode)
          .eq("name", targetPlayerName);
      }

      let msg = `Modification manuelle de ${playerName} par le GM : Score = ${targetScore}, Vies = ${targetLives}, Zombie = ${targetZombie ? "Oui" : "Non"}`;
      if (newName && newName.trim() !== playerName) msg += `, Nouveau Nom = ${newName.trim()}`;
      if (newPin && newPin.trim() !== player.pin) msg += `, Nouveau PIN = ${newPin.trim()}`;
      msg += ".";

      await logEvent("manual_edit", {
        status: "approved",
        message: msg
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- FONTAINE DE VIE SYSTEM ---

  const getFountainPair = async (code, totalUses, currentActionTitle = null, currentVeriteTitle = null) => {
    let difficulty = "facile";
    if (totalUses >= 3 && totalUses <= 4) {
      difficulty = "moyen";
    } else if (totalUses >= 5) {
      difficulty = "difficile";
    }

    // Récupérer les actions
    let { data: actions, error: errA } = await supabase
      .from("fountain_pool")
      .select("*")
      .eq("game_code", code)
      .eq("type", "action")
      .eq("difficulty", difficulty);

    if (errA) throw errA;

    // Récupérer les vérités
    let { data: verites, error: errV } = await supabase
      .from("fountain_pool")
      .select("*")
      .eq("game_code", code)
      .eq("type", "verite")
      .eq("difficulty", difficulty);

    if (errV) throw errV;

    // Choisir l'action
    let chosenAction = null;
    if (actions && actions.length > 0) {
      const filtered = currentActionTitle ? actions.filter(a => a.title !== currentActionTitle) : actions;
      const list = filtered.length > 0 ? filtered : actions;
      chosenAction = list[Math.floor(Math.random() * list.length)];
    } else {
      chosenAction = {
        title: `Action ${difficulty.toUpperCase()}`,
        description: `Faire une action amusante/absurde liée au festival de niveau ${difficulty}. (Ex: trinquer avec 3 inconnus en même temps)`
      };
    }

    // Choisir la vérité
    let chosenVerite = null;
    if (verites && verites.length > 0) {
      const filtered = currentVeriteTitle ? verites.filter(v => v.title !== currentVeriteTitle) : verites;
      const list = filtered.length > 0 ? filtered : verites;
      chosenVerite = list[Math.floor(Math.random() * list.length)];
    } else {
      chosenVerite = {
        title: `Vérité ${difficulty.toUpperCase()}`,
        description: `Révéler une vérité croustillante/honnête de niveau ${difficulty} à ton groupe de jeu.`
      };
    }

    return {
      action: chosenAction.title || chosenAction.description,
      verite: chosenVerite.title || chosenVerite.description
    };
  };

  const drawFountainChallenge = async (playerName, type) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player) return;

    if (player.isZombie) {
      throw new Error("Les zombies ne peuvent pas utiliser la Fontaine.");
    }

    setLoading(true);
    try {
      const totalUses = player.fountainTotalUses || 0;
      const pair = await getFountainPair(gameCode, totalUses);

      await supabase
        .from("players")
        .update({
          fountain_active_type: type,
          fountain_active_title: "PAIRE_ACTIVE",
          fountain_active_description: JSON.stringify(pair)
        })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur drawFountainChallenge :", err);
    } finally {
      setLoading(false);
    }
  };

  const skipFountainChallenge = async (playerName) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player) return;

    if (player.fountainRefreshesToday <= 0) {
      throw new Error("Vous n'avez plus de relances disponibles.");
    }

    setLoading(true);
    try {
      const totalUses = player.fountainTotalUses || 0;
      
      let currentAction = null;
      let currentVerite = null;
      if (player.fountainActiveTitle === "PAIRE_ACTIVE" && player.fountainActiveDescription) {
        try {
          const parsed = JSON.parse(player.fountainActiveDescription);
          currentAction = parsed.action;
          currentVerite = parsed.verite;
        } catch (e) {
          console.error(e);
        }
      }

      const pair = await getFountainPair(gameCode, totalUses, currentAction, currentVerite);

      await supabase
        .from("players")
        .update({
          fountain_refreshes_today: Math.max(0, player.fountainRefreshesToday - 1),
          fountain_active_title: "PAIRE_ACTIVE",
          fountain_active_description: JSON.stringify(pair)
        })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur skipFountainChallenge :", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchFountainCategory = async (playerName, category) => {
    if (!gameCode) return;
    try {
      await supabase
        .from("players")
        .update({ fountain_active_type: category })
        .eq("game_code", gameCode)
        .eq("name", playerName);
      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmFountainChallenge = async (playerName, responseText = null, photoProof = null) => {
    const player = gameState.players.find(p => p.name === playerName);
    if (!player) return;

    if (player.isZombie) {
      throw new Error("Les zombies ne peuvent pas utiliser la Fontaine.");
    }

    if ((player.fountainUsesToday || 0) >= 2) {
      throw new Error("Vous avez atteint la limite quotidienne de 2 utilisations de la Fontaine.");
    }

    setLoading(true);
    try {
      const currentLives = player.lives || 0;
      const newLives = Math.min(7.0, currentLives + 0.5);

      const activeTitle = player.fountainActiveTitle;
      const activeDesc = player.fountainActiveDescription;
      const activeType = player.fountainActiveType;

      let challengeText = "";
      if (activeDesc) {
        if (activeTitle === "PAIRE_ACTIVE") {
          try {
            const pair = JSON.parse(activeDesc);
            challengeText = activeType === "action" ? pair.action : pair.verite;
          } catch (e) {
            challengeText = activeDesc;
          }
        } else {
          challengeText = activeTitle || activeDesc;
        }
      }

      await supabase
        .from("players")
        .update({
          lives: newLives,
          fountain_uses_today: (player.fountainUsesToday || 0) + 1,
          fountain_total_uses: (player.fountainTotalUses || 0) + 1,
          fountain_active_type: null,
          fountain_active_title: null,
          fountain_active_description: null
        })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      let logMsg = `Soin Fontaine : ${playerName} a validé un défi de fontaine (+0.5 cœur, total: ${newLives} ❤️).`;

      await logEvent("fountain_heal", {
        status: "approved",
        message: logMsg,
        killer: playerName,
        responseText,
        photoProof,
        metadata: {
          challengeText,
          challengeType: activeType
        }
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur confirmFountainChallenge :", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 12. Morning Skips
  const triggerMorningSkips = async () => {
    if (!gameCode) return;
    setLoading(true);
    try {
      // Fetch all players for the room
      const { data: dbPlayers } = await supabase.from("players").select("name, skips, fountain_refreshes_today").eq("game_code", gameCode);
      if (dbPlayers) {
        for (const p of dbPlayers) {
          const currentRefreshes = p.fountain_refreshes_today === null ? 3 : p.fountain_refreshes_today;
          await supabase
            .from("players")
            .update({ 
              skips: p.skips + 1,
              fountain_uses_today: 0,
              fountain_refreshes_today: currentRefreshes + 3
            })
            .eq("game_code", gameCode)
            .eq("name", p.name);
        }
      }

      // Mettre à jour la date de dernière attribution dans la table games
      await supabase
        .from("games")
        .update({
          last_skip_awarded_date: new Date().toISOString()
        })
        .eq("game_code", gameCode);

      await logEvent("morning_skip", {
        status: "approved",
        message: "Réveil du matin ! Tous les joueurs reçoivent +1 jeton Skip."
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // (insertPlayerMidGame has been moved up to resolve reference in loginPlayer)

  // 14. Suggest action (Player)
  const suggestAction = async (playerName, title, description, points, damage, category = "defi", difficulty = null) => {
    let msg = `${playerName} suggère d'ajouter l'action "${title}" (« ${description} », +${points} pts, -${damage} coeurs).`;
    if (category === "action_fountain") {
      msg = `${playerName} suggère une action fontaine : "${title}" (« ${description} », difficulté: ${difficulty}).`;
    } else if (category === "verite_fountain") {
      msg = `${playerName} suggère une vérité fontaine : "${title}" (« ${description} », difficulté: ${difficulty}).`;
    }

    await logEvent("action_suggestion", {
      killer: playerName,
      status: "pending",
      message: msg,
      metadata: { title, description, points, damage, category, difficulty }
    });
  };

  // 15. Approve suggested action (GM)
  const approveSuggestedAction = async (historyId, points, damage) => {
    const event = gameState.history.find(e => e.id === historyId);
    if (!event || event.status !== "pending") return;

    setLoading(true);
    try {
      const category = event.metadata?.category || "defi";

      if (category === "defi") {
        let difficulty = "standard";
        if (points <= 15) difficulty = "micro";
        else if (points >= 300) difficulty = "legendaire";
        else if (points >= 100) difficulty = "majeur";

        const pool = gameState.actionPool;
        const nextId = Math.max(...pool.map(a => a.id), 0) + 1;

        // 1. Insert action in action_pools
        await supabase
          .from("action_pools")
          .insert([{
            game_code: gameCode,
            action_id: nextId,
            title: event.metadata.title,
            description: event.metadata.description,
            difficulty,
            points: Number(points),
            damage: Number(damage),
            is_ephemeral: false
          }]);

        // 2. Approve event
        await supabase
          .from("history")
          .update({ status: "approved" })
          .eq("id", historyId);

        await logEvent("action_added", {
          status: "approved",
          message: `🛠️ Action approuvée et ajoutée par le GM : "${event.metadata.title}" (+${points} pts, -${damage} coeurs).`
        });
      } else {
        // Fontaine suggestion
        const type = category === "action_fountain" ? "action" : "verite";
        const difficulty = event.metadata?.difficulty || "facile";

        // Insert in fountain_pool
        await supabase
          .from("fountain_pool")
          .insert({
            game_code: gameCode,
            type,
            title: event.metadata.title,
            description: event.metadata.description,
            difficulty
          });

        // Approve event
        await supabase
          .from("history")
          .update({ status: "approved" })
          .eq("id", historyId);

        await logEvent("action_added", {
          status: "approved",
          message: `🛠️ Défi Fontaine (${type === "action" ? "Action" : "Vérité"}) approuvé et ajouté par le GM : "${event.metadata.title}" (difficulté: ${difficulty}).`
        });
      }

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 16. Reject suggested action (GM)
  const rejectSuggestedAction = async (historyId) => {
    setLoading(true);
    try {
      const event = gameState.history.find(e => e.id === historyId);
      if (!event) return;

      await supabase
        .from("history")
        .update({ status: "rejected" })
        .eq("id", historyId);

      await logEvent("action_suggestion_rejection", {
        status: "approved",
        message: `Le GM a rejeté la suggestion d'action de ${event.killer} ("${event.metadata?.title}").`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 17. Add custom action directly (GM)
  const addCustomActionDirectly = async (title, description, points, damage) => {
    if (!gameCode) return;
    setLoading(true);
    try {
      let difficulty = "standard";
      if (points <= 15) difficulty = "micro";
      else if (points >= 300) difficulty = "legendaire";
      else if (points >= 100) difficulty = "majeur";

      const pool = gameState.actionPool;
      const nextId = Math.max(...pool.map(a => a.id), 0) + 1;

      await supabase
        .from("action_pools")
        .insert([{
          game_code: gameCode,
          action_id: nextId,
          title,
          description,
          difficulty,
          points: Number(points),
          damage: Number(damage),
          is_ephemeral: false
        }]);

      await logEvent("action_added", {
        status: "approved",
        message: `🛠️ Action ajoutée directement par le GM : "${title}" (+${points} pts, -${damage} coeurs).`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 18. Delete action from pool (GM)
  const deleteAction = async (actionId) => {
    if (!gameCode) return;
    setLoading(true);
    try {
      // 1. Delete from pool
      await supabase
        .from("action_pools")
        .delete()
        .eq("game_code", gameCode)
        .eq("action_id", actionId);

      // Fetch fresh pool
      const { data: dbActions } = await supabase.from("action_pools").select("*").eq("game_code", gameCode);
      const updatedPool = dbActions && dbActions.length > 0 ? dbActions : DEFAULT_ACTIONS;

      // 2. Draw new actions for players currently holding this deleted action
      const playersHoldingAction = gameState.players.filter(p => p.actionId === actionId);
      for (const p of playersHoldingAction) {
        const usedActionIds = gameState.players.map(pl => pl.actionId).filter(id => id !== actionId);
        const available = updatedPool.filter(a => !usedActionIds.includes(a.action_id || a.id));
        
        const newAction = available.length > 0 
          ? available[Math.floor(Math.random() * available.length)]
          : updatedPool[Math.floor(Math.random() * updatedPool.length)];

        const newId = newAction ? (newAction.action_id || newAction.id) : null;

        await supabase
          .from("players")
          .update({ action_id: newId })
          .eq("game_code", gameCode)
          .eq("name", p.name);
      }

      await logEvent("action_deleted", {
        status: "approved",
        message: `🛠️ Action supprimée par le GM (ID : ${actionId}).`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 19. Edit action from pool (GM)
  const editAction = async (actionId, title, description, points, damage) => {
    if (!gameCode) return;
    setLoading(true);
    try {
      let difficulty = "standard";
      if (points <= 15) difficulty = "micro";
      else if (points >= 300) difficulty = "legendaire";
      else if (points >= 100) difficulty = "majeur";

      await supabase
        .from("action_pools")
        .update({
          title,
          description,
          difficulty,
          points: Number(points),
          damage: Number(damage),
          is_ephemeral: false
        })
        .eq("game_code", gameCode)
        .eq("action_id", actionId);

      await logEvent("action_edited", {
        status: "approved",
        message: `🛠️ Action modifiée par le GM : "${title}" (+${points} pts, -${damage} coeurs).`
      });

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 21. Activer / Désactiver un joueur (geler ses stats et le retirer/réintégrer de la boucle des cibles)
  const togglePlayerActiveStatus = async (playerName, active) => {
    if (!gameCode || !gameState.started) return;
    setLoading(true);
    try {
      const player = gameState.players.find(p => p.name === playerName);
      if (!player) return;

      const activePlayers = gameState.players.filter(p => p.target && p.name !== playerName);

      if (!active) {
        // Deactivate player: remove from target loop
        if (activePlayers.length < 2) {
          throw new Error("Impossible de désactiver ce joueur : il doit rester au moins 2 joueurs actifs.");
        }

        // Find who targets the player being deactivated
        const X = gameState.players.find(p => p.target === playerName);
        // Find the target of the player being deactivated
        const Y = player.target;

        let playersToUpdate = [];
        if (X && Y) {
          playersToUpdate.push({ name: X.name, target: Y });
        }

        // Update deactivated player
        await supabase
          .from("players")
          .update({
            target: null,
            action_id: null,
            action_ephemeral: false
          })
          .eq("game_code", gameCode)
          .eq("name", playerName);

        // Update loop
        for (const p of playersToUpdate) {
          await supabase
            .from("players")
            .update({ target: p.target })
            .eq("game_code", gameCode)
            .eq("name", p.name);
        }

        await logEvent("player_deactivated", {
          status: "approved",
          message: `📢 ${playerName} quitte le festival temporairement. Son score (${player.score} pts) et ses cœurs (${player.lives}) sont gelés.`
        });
      } else {
        // Activate player: integrate back into target loop
        if (activePlayers.length === 0) {
          throw new Error("Aucun joueur actif à cibler pour réintégrer.");
        }

        // Pick a random active player A
        const randomPlayerA = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        const targetC = randomPlayerA.target;

        // Draw new action for the reactivated player
        const pool = gameState.actionPool;
        const usedActionIds = gameState.players.map(p => p.actionId).filter(Boolean);
        const available = pool.filter(a => !usedActionIds.includes(a.id));
        const newAction = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : pool[Math.floor(Math.random() * pool.length)];

        const newActionId = newAction ? newAction.id : null;

        // 1. Update reactivated player (A -> player -> C)
        await supabase
          .from("players")
          .update({
            target: targetC,
            action_id: newActionId,
            action_ephemeral: false
          })
          .eq("game_code", gameCode)
          .eq("name", playerName);

        // 2. Update player A to target the reactivated player
        await supabase
          .from("players")
          .update({ target: playerName })
          .eq("game_code", gameCode)
          .eq("name", randomPlayerA.name);

        await logEvent("player_activated", {
          status: "approved",
          message: `📢 ${playerName} revient au festival et réintègre la boucle des cibles !`
        });
      }

      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur togglePlayerActiveStatus :", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 20. Save player profile photo (Player Setup)
  const savePlayerPhoto = async (playerName, photoBase64) => {
    if (!gameCode) return;
    setLoading(true);
    try {
      await supabase
        .from("players")
        .update({ photo: photoBase64 })
        .eq("game_code", gameCode)
        .eq("name", playerName);

      await fetchGameState(gameCode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSuggestedAction = async (historyId) => {
    try {
      const { error } = await supabase
        .from("history")
        .delete()
        .eq("id", historyId)
        .neq("status", "approved");

      if (error) throw error;
      await fetchGameState(gameCode);
    } catch (err) {
      console.error("Erreur suppression suggestion :", err);
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentUser,
      setCurrentUser,
      gameCode,
      setGameCode,
      loading,
      createRoom,
      joinRoom,
      loginPlayer,
      loginGM,
      removePlayer,
      requestPinRecovery,
      dismissPinRecovery,
      initializeGame,
      resetGame,
      declareHit,
      approveHit,
      rejectHit,
      skipAction,
      abandonTargetInstant,
      counterAttack,
      resolveCounterAttack,
      resurrectZombie,
      manualEditPlayer,
      triggerMorningSkips,
      insertPlayerMidGame,
      suggestAction,
      approveSuggestedAction,
      rejectSuggestedAction,
      deleteSuggestedAction,
      addCustomActionDirectly,
      deleteAction,
      editAction,
      savePlayerPhoto,
      togglePlayerActiveStatus,
      drawFountainChallenge,
      skipFountainChallenge,
      confirmFountainChallenge,
      switchFountainCategory
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
