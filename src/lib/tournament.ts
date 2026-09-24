import { supabase } from './supabase'


/* ========================================
   TI'DOC GAMES
   MODE TOURNOI

   Un tournoi enchaîne les 4 jeux, une manche
   par jeu. Chaque manche est une vraie salle
   multijoueur : les quatre jeux existants la
   prennent en charge sans modification
   (présence, fin de partie, résultats).

   Toute la logique de tournoi vit côté serveur
   (voir supabase/migrations). Ce module ne fait
   qu'appeler les fonctions SQL et présenter les
   données.
======================================== */


export const TOURNAMENT_ROUND_COUNT = 4


export type TournamentColor =
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'


export type TournamentRoundScore = {
  round: number
  raw_score: number
  points: number
}


export type TournamentPlayer = {
  player_id: string
  pseudo: string
  avatar: number
  player_order: number
  color: TournamentColor
  total_score: number
  scores: TournamentRoundScore[]
}


export type TournamentRound = {
  round: number
  game: string
  status: 'playing' | 'finished'

  room_id: string
  room_code: string
  room_status: 'waiting' | 'playing' | 'finished'

  finished_at: string | null
}


export type TournamentState = {
  id: string
  code: string
  host_id: string

  status: 'waiting' | 'playing' | 'finished'

  current_round: number
  max_players: number

  created_at: string
  started_at: string | null
  finished_at: string | null

  players: TournamentPlayer[]
  rounds: TournamentRound[]
}


export type OpenTournamentSession = {
  id: string
  code: string
  host_id: string
  host_pseudo: string
  players: number
  max_players: number
  created_at: string
}


/* ========================================
   LES QUATRE MANCHES
   L'ordre doit rester identique à celui de
   public.tournament_game_for_round.
======================================== */

export type TournamentGameInfo = {
  game: string
  label: string
  specialty: string
  path: string
}


export const TOURNAMENT_GAMES: TournamentGameInfo[] = [
  {
    game: 'ecg',
    label: 'Beat Catcher',
    specialty: 'CARDIOLOGIE',
    path: '/multiplayer/ecg/game',
  },
  {
    game: 'bacteria-slash',
    label: 'Bacteria Slash',
    specialty: 'INFECTIOLOGIE',
    path: '/multiplayer/bacteria/game',
  },
  {
    game: 'surgically-insane',
    label: 'Surgically Insane',
    specialty: 'CHIRURGIE',
    path: '/multiplayer/surgically-insane/game',
  },
  {
    game: 'stock-and-stack',
    label: 'Stock & Stack',
    specialty: 'PHARMACIE',
    path: '/multiplayer/stock-and-stack/game',
  },
]


export function getTournamentGame(
  game: string,
): TournamentGameInfo | null {

  return (
    TOURNAMENT_GAMES.find(
      item => item.game === game,
    ) ?? null
  )
}


export function getTournamentGameLabel(
  game: string,
): string {

  return (
    getTournamentGame(game)?.label ??
    game
  )
}


export function getTournamentGameSpecialty(
  game: string,
): string {

  return (
    getTournamentGame(game)?.specialty ??
    'TOURNOI'
  )
}


export function getTournamentGamePath(
  game: string,
): string {

  return (
    getTournamentGame(game)?.path ??
    '/tournament'
  )
}


/* ========================================
   LECTURE D'UNE MANCHE
======================================== */

export function getRoundScore(
  player: TournamentPlayer,
  round: number,
): TournamentRoundScore | null {

  return (
    player.scores.find(
      score => score.round === round,
    ) ?? null
  )
}


export function getTotalRawScore(
  player: TournamentPlayer,
): number {

  return player.scores.reduce(
    (total, score) => total + score.raw_score,
    0,
  )
}


/* ========================================
   CLASSEMENT GÉNÉRAL

   Points de tournoi d'abord, puis score brut
   cumulé, puis ordre d'inscription.
======================================== */

export function sortTournamentPlayers(
  players: TournamentPlayer[],
): TournamentPlayer[] {

  return [...players].sort(

    (a, b) =>
      b.total_score - a.total_score ||
      getTotalRawScore(b) - getTotalRawScore(a) ||
      a.player_order - b.player_order,
  )
}


function sharesRank(
  a: TournamentPlayer,
  b: TournamentPlayer,
): boolean {

  return (
    a.total_score === b.total_score &&
    getTotalRawScore(a) === getTotalRawScore(b)
  )
}


export type TournamentStanding = {
  player: TournamentPlayer
  position: number
}


/* Ex aequo : même position, la suivante est sautée (1, 1, 3). */

export function rankTournamentPlayers(
  players: TournamentPlayer[],
): TournamentStanding[] {

  const sorted =
    sortTournamentPlayers(players)

  let previous: TournamentPlayer | null =
    null

  let position = 0


  return sorted.map(
    (player, index) => {

      if (
        !previous ||
        !sharesRank(previous, player)
      ) {
        position = index + 1
      }

      previous = player

      return {
        player,
        position,
      }
    },
  )
}


export function isTournamentFinished(
  state: TournamentState | null,
): boolean {

  return state?.status === 'finished'
}


export function getCurrentRound(
  state: TournamentState,
): TournamentRound | null {

  return (
    state.rounds.find(
      round => round.round === state.current_round,
    ) ?? null
  )
}


export function countPlayedRounds(
  state: TournamentState,
): number {

  return state.rounds.filter(
    round =>
      round.status === 'finished' ||
      round.room_status === 'finished',
  ).length
}


/* ========================================
   APPELS AU SERVEUR
======================================== */

type TournamentRpcError = {
  code?: string
  message?: string
}


function tournamentError(
  error: TournamentRpcError | null,
  fallback: string,
): Error {

  /*
    Les messages métier viennent du SQL
    (raise exception, code P0001).
  */

  if (
    error?.code === 'P0001' &&
    error.message
  ) {
    return new Error(error.message)
  }


  /*
    Migration non appliquée sur le projet :
    on l'annonce clairement au lieu d'un
    message technique.
  */

  if (
    error?.code === 'PGRST202' ||
    error?.message?.includes(
      'does not exist',
    )
  ) {
    return new Error(
      'Le mode tournoi n’est pas encore activé sur le serveur.',
    )
  }


  return new Error(fallback)
}


async function tournamentRpc<T>(
  name: string,
  args: Record<string, unknown>,
  fallback: string,
): Promise<T> {

  const {
    data,
    error,
  } = await supabase.rpc(
    name,
    args,
  )


  if (error) {
    throw tournamentError(
      error,
      fallback,
    )
  }


  return data as T
}


export async function createTournamentSession():
Promise<TournamentState> {

  return tournamentRpc<TournamentState>(
    'create_tournament_session',
    {},
    'Impossible de créer le tournoi.',
  )
}


export async function joinTournamentSession(
  code: string,
): Promise<TournamentState> {

  return tournamentRpc<TournamentState>(
    'join_tournament_session',
    {
      p_code: code
        .trim()
        .toUpperCase(),
    },
    'Impossible de rejoindre ce tournoi.',
  )
}


export async function getTournamentState(
  code: string,
): Promise<TournamentState | null> {

  return tournamentRpc<TournamentState | null>(
    'get_tournament_state',
    {
      p_code: code
        .trim()
        .toUpperCase(),
    },
    'Impossible de charger le tournoi.',
  )
}


export async function startTournamentSession(
  sessionId: string,
): Promise<TournamentState> {

  return tournamentRpc<TournamentState>(
    'start_tournament_session',
    {
      p_session_id: sessionId,
    },
    'Impossible de démarrer le tournoi.',
  )
}


export async function advanceTournamentRound(
  sessionId: string,
): Promise<TournamentState> {

  return tournamentRpc<TournamentState>(
    'advance_tournament_round',
    {
      p_session_id: sessionId,
    },
    'Impossible de passer à la manche suivante.',
  )
}


/* ========================================
   LANCER LA MANCHE (HÔTE UNIQUEMENT)

   Démarre la salle de la manche : seul l'hôte
   peut appeler (vérifié par host_id). Le top
   départ pose started_at : les invités entrent
   ensemble grâce au suivi automatique.
======================================== */

export async function startTournamentRound(
  roomId: string,
): Promise<TournamentState> {

  return tournamentRpc<TournamentState>(
    'start_tournament_round',
    {
      p_room_id: roomId,
    },
    'Impossible de lancer la partie.',
  )
}


export async function leaveTournamentSession(
  sessionId: string,
): Promise<void> {

  await tournamentRpc<null>(
    'leave_tournament_session',
    {
      p_session_id: sessionId,
    },
    'Impossible de quitter le tournoi.',
  )
}


export async function getOpenTournamentSessions():
Promise<OpenTournamentSession[]> {

  const sessions =
    await tournamentRpc<OpenTournamentSession[] | null>(
      'get_open_tournament_sessions',
      {},
      'Impossible de charger les tournois en cours.',
    )


  return sessions ?? []
}


/* ========================================
   RETOUR AU TOURNOI DEPUIS UNE SALLE

   Utilisé par les écrans de fin de partie des
   quatre jeux : si la salle est une manche de
   tournoi, le joueur revient au tournoi au lieu
   du menu multijoueur.
======================================== */

export async function getTournamentReturnPath(
  roomId: string,
): Promise<string | null> {

  try {

    const {
      data,
      error,
    } = await supabase.rpc(
      'get_tournament_session_code_for_room',
      {
        p_room_id: roomId,
      },
    )


    if (error) {
      return null
    }


    if (
      typeof data === 'string' &&
      data.length > 0
    ) {
      return `/tournament/round/${data}`
    }


    return null

  } catch {

    /*
      Une salle classique, ou une migration
      absente : on laisse le comportement
      habituel.
    */

    return null
  }
}
