C'est le moment parfait pour basculer sur la technique ! Maintenant que nos règles sont ultra-solides, on a toutes les clés pour concevoir un outil qui simplifiera la vie des juges et des joueurs sans casser l'ambiance du festival.

Voici la proposition de **Cahier des Charges (CDC)** pour le développement de ton application. Il est pensé pour être **léger, mobile-first** (idéalement une PWA ou une appli web réactive pour éviter de surcharger les téléphones) et taillé pour le réseau capricieux des festivals.

---

# ?? CAHIER DES CHARGES : APPLICATION "KILLER FESTIVAL"

## 1. Objectifs & Philosophie de l'App

* **Objectif principal :** Automatiser la gestion des cibles, le suivi des scores/vies, et les arbitrages pour supprimer la charge mentale des organisateurs/juges.
* **Contraintes Festival :**
* **Mobile-first :** Interface ultra-épurée, boutons larges (utilisables en concert).
* **Économie de batterie :** Mode sombre natif obligatoire.
* **Réseau dégradé :** L'appli doit être légère et capable de gérer un rafraîchissement des données même avec une couverture 4G/5G instable.



---

## 2. Périmètre Applicatif & Rôles

L'application gère trois profils d'utilisateurs bien distincts :

1. **L'Administrateur / Créateur de partie :** Configure le jeu avant le festival.
2. **Le Juge (1 à 2 personnes) :** Valide les actions, gère les litiges et les résurrections.
3. **Le Joueur :** Voit ses objectifs, déclare ses actions et suit ses statistiques.

---

## 3. Spécifications Fonctionnelles (User Stories)

### ?? Vue Joueur : "Mon Profil d'Assassin"

* **Écran d'accueil (Secret) :**
* Affichage de ma **Cible actuelle** (Nom + Photo si possible).
* Affichage de mon **Action actuelle** (Description + sa valeur en Points/Cœurs).
* *Sécurité :* Un bouton "Masquer" pour cacher rapidement l'écran si la cible s'approche.


* **Mes Statistiques (Visibles) :**
* Ma jauge de **Cœurs** (Format graphique : 7 cœurs style Zelda, par tranches de 0,5 cœur).
* Mon **Score** total en points.
* Mon statut actuel : *Vivant* ou *Zombie*.


* **Zone d'Action :**
* Bouton **"J'ai réussi mon Hit !"** : Envoie une notification de validation aux juges.
* Bouton **"Skip Action"** : Consomme un jeton "Skip" (affiché à l'écran) et attribue instantanément une nouvelle action aléatoire de la pool.
* Bouton **"Abandonner Cible"** : Demande un changement de cible. L'app applique automatiquement la pénalité (-50 pts / -0,5 cœur) après validation d'un juge.
* Bouton **"Contre-attaque !"** : Permet de dénoncer son tueur. Ouvre un menu pour sélectionner le joueur suspecté et l'action devinée.



### ?? Vue Juge : "Le Tribunal du Festival"

* **Le Tableau de Bord (Live Feed) :** Flux d'activité en temps réel (ex: *"Jean a déclaré un Hit sur Zoé"*).
* **Gestion des Validations :**
* Interface de validation des Hits en 2 clics : `[Accepter]` ou `[Refuser]`.
* Si `[Accepter]` : L'app recalcule automatiquement les scores du tueur (+ bonus élimination si les PV tombent à 0), retire les cœurs à la victime, et attribue automatiquement un nouveau duo Cible/Action au tueur.


* **Résolution des Litiges (Contre-attaques) :**
* Le juge clique sur le litige en cours. L'app lui affiche si la cible avait raison ou tort.
* Le juge applique la sentence d'un clic (Pénalité tueur ou Pénalité parano pour la cible).


* **Mode Dieu :** Possibilité de modifier manuellement le score, les cœurs ou le statut (Zombie/Vivant) d'un joueur en cas de bug humain ou de médiation externe.

### ?? Vue Admin : "Le Game Designer"

* **Initialisation :** Écran pour entrer la liste des participants (7 à 10 noms).
* **Gestion de la Pool :** Base de données des 31 actions configurées avec leur niveau de difficulté (Micro, Standard, Majeur, Légendaire) et les points associés.
* **Lancement :** Un bouton "Lancer la partie" qui effectue le premier tirage aléatoire des cœurs de cible et des actions (algorithme de boucle fermée : A tue B, B tue C... et personne ne se cible lui-même).

---

## 4. Spécifications Techniques Recommandées

Pour que le développement soit rapide (idéal pour un projet entre potes) et efficace :

* **Architecture :** Web App / PWA (Progressive Web App). Pas besoin de s'embêter avec les stores Apple ou Google. Un simple lien URL suffit, et les joueurs peuvent "l'ajouter à l'écran d'accueil".
* **Stack suggérée :**
* *Frontend :* Vue.js / React avec TailwindCSS (pour un design propre, rapide et responsive) ou Flutter Web.
* *Backend & Database :* **Firebase** ou **Supabase**. C'est parfait pour ce projet : base de données en temps réel (pour les notifications des juges) et système d'authentification ultra-simple (connexion via email ou juste un pseudo + code secret par joueur).


* **Gestion du Mode Hors-Ligne (Offline First) :** Le state de l'application doit être stocké localement (LocalStorage) pour que le joueur puisse consulter sa cible même s'il est au fond d'une fosse de concert sans réseau. Les requêtes (comme les demandes de validation) sont mises en attente et envoyées dès que le réseau revient.

---

## 5. Écrans Clés à Maquetter (UI)

1. **Écran de Login :** Entrée du pseudo + Code PIN unique à 4 chiffres (fourni par l'admin).
2. **Dashboard Joueur :** Le cœur du jeu (Cible, Action, Cœurs restants, Bouton Panic/Masquer).
3. **Classement Général (Leaderboard) :** Affichage des scores de tout le monde en fin de journée pour faire monter la pression, et suivi des 3 trophées (Prédateur, Survivant, Joueur Fou).

Tu as ici une base de développement prête à être donnée à un pote dev ou balancée dans un outil de génération de code / IA pour commencer à coder l'ossature ! Qu'en penses-tu ?