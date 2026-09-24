TI'DOC GAMES - PATCH CIBLÉ TOURNOI SOLO - 23 septembre 2026

Remplacer dans GitHub, sous src/pages/ :
- ECGTournamentSoloGame.tsx
- BacteriaTournamentSoloGame.tsx
Ajouter sous src/pages/ :
- TournamentSoloTeams.css

Les jeux classiques et les modes multijoueurs ne sont pas modifiés.
ECG : 4 couleurs sur les cibles, bots qui font disparaître leurs cibles.
Bacteria : 4 couleurs, bots qui font disparaître leurs bactéries ; ancien HUD solo masqué pendant le jeu ; chronomètre au-dessus du plateau.

ATTENTION : vérification syntaxique TypeScript/TSX passée, mais build complet npm non exécuté dans cet environnement sans dépendances. Vérifier la PR / Preview Vercel avant fusion et sauvegarder la version actuelle. Les animations des bots sont simulées visuellement ; le score final reste calculé par tournamentSolo.ts.
