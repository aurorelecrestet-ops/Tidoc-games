import {
  getRoundScore,
  TOURNAMENT_GAMES,
  TOURNAMENT_ROUND_COUNT,
  type TournamentColor,
  type TournamentPlayer,
} from './tournament'


/* ========================================
   MODE TOURNOI SOLO — 3 ROBOTS

   Le tournoi solo ne sollicite pas le serveur :
   la partie vit dans le navigateur (localStorage),
   comme les records solo.

   Le barème est celui du multijoueur :
   points = nombre de joueurs − rang + 1 (minimum 1),
   avec rangs partagés en cas d'ex aequo.
   Les quatre manches gardent l'ordre de
   TOURNAMENT_GAMES (un test le vérifie).
============================================ */


export const SOLO_TOURNAMENT_STORAGE_KEY =
  'tidoc-solo-tournament'


export type SoloTournamentCup = 'externe' | 'interne' | 'docteur'

export const SOLO_TOURNAMENT_CUPS: ReadonlyArray<{
  id: SoloTournamentCup
  name: string
  difficulty: string
  description: string
  trophy: string
}> = [
  { id: 'externe', name: 'Coupe Externe', difficulty: 'FACILE', description: 'Des robots débutants pour découvrir le tournoi.', trophy: '🥉' },
  { id: 'interne', name: 'Coupe Interne', difficulty: 'NORMAL', description: 'Des adversaires de niveau intermédiaire.', trophy: '🥈' },
  { id: 'docteur', name: 'Coupe Docteur', difficulty: 'DIFFICILE', description: 'Des robots expérimentés pour un vrai défi.', trophy: '🥇' },
]

const PLAYER_COUNT = 4


const BOT_NAMES = [
  'Robot Léo',
  'Robot Nina',
  'Robot Max',
]


const BOT_COLORS: TournamentColor[] = [
  'red',
  'yellow',
  'purple',
]


const BOT_AVATARS = [2, 3, 4]


export type SoloTournamentIdentity = {
  id: string
  pseudo: string
  avatar: number
}


export type SoloTournamentState = {
  id: string
  created_at: string
  round_started_at?: string

  status: 'playing' | 'finished'
  current_round: number

  human_player_id: string
  cup?: SoloTournamentCup // Tournois plus anciens : valeur par défaut 'interne'
  players: TournamentPlayer[]
}


type SoloStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>


/* ========================================
   LECTURE ET ABANDON
============================================ */

export function getSoloTournament(
  storage: SoloStorage = window.localStorage,
): SoloTournamentState | null {

  try {

    const raw =
      storage.getItem(SOLO_TOURNAMENT_STORAGE_KEY)


    if (!raw) {
      return null
    }


    const state =
      JSON.parse(raw) as SoloTournamentState


    if (
      !state ||
      (state.status !== 'playing' &&
        state.status !== 'finished') ||
      !Number.isInteger(state.current_round) ||
      state.current_round < 1 ||
      !Array.isArray(state.players) ||
      state.players.length !== PLAYER_COUNT
    ) {
      return null
    }


    return state

  } catch {

    /* Donnée illisible : on repart d'un tournoi propre. */

    return null
  }
}


export function abandonSoloTournament(
  storage: SoloStorage = window.localStorage,
): void {

  try {
    storage.removeItem(SOLO_TOURNAMENT_STORAGE_KEY)
  } catch {
    /* Le tournoi reste gérable sans stockage. */
  }
}


/* ========================================
   DÉMARRER UN TOURNOI

   Le joueur est le joueur 1 (vert),
   les trois robots prennent les places restantes.
============================================ */

export function startSoloTournament(
  identity: SoloTournamentIdentity,
  storage: SoloStorage = window.localStorage,
  cup: SoloTournamentCup = 'interne',
): SoloTournamentState {

  const players: TournamentPlayer[] = [

    {
      player_id: identity.id,
      pseudo: identity.pseudo,
      avatar: identity.avatar,
      player_order: 1,
      color: 'green',
      total_score: 0,
      scores: [],
    },

    ...BOT_NAMES.map(
      (name, index) => ({
        player_id: `solo-bot-${index + 1}`,
        pseudo: name,
        avatar: BOT_AVATARS[index],
        player_order: index + 2,
        color: BOT_COLORS[index],
        total_score: 0,
        scores: [],
      }),
    ),
  ]


  const nowIso = new Date().toISOString()
  const state: SoloTournamentState = {
    id:
      `solo-${Date.now().toString(36)}` +
      `-${Math.random().toString(36).slice(2, 8)}`,
    created_at: nowIso,
    round_started_at: nowIso,

    status: 'playing',
    current_round: 1,

    human_player_id: identity.id,
    cup,
    players,
  }


  storage.setItem(
    SOLO_TOURNAMENT_STORAGE_KEY,
    JSON.stringify(state),
  )


  return state
}


/* ========================================
   CLASSEMENT D'UNE MANCHE

   Même barème que advance_tournament_round :
   score décroissant, puis ordre d'inscription ;
   ex aequo partagé, rang suivant sauté.
============================================ */

type RoundEntry = {
  player: TournamentPlayer
  raw: number
}


type RankedRoundEntry = RoundEntry & {
  rank: number
  points: number
}


function rankRoundEntries(
  entries: RoundEntry[],
): RankedRoundEntry[] {

  const sorted = [...entries].sort(
    (a, b) =>
      b.raw - a.raw ||
      a.player.player_order - b.player.player_order,
  )


  let rank = 0


  return sorted.map(
    (entry, index) => {

      if (
        index === 0 ||
        entry.raw !== sorted[index - 1].raw
      ) {
        rank = index + 1
      }


      return {
        ...entry,
        rank,
        points: Math.max(
          1,
          sorted.length - rank + 1,
        ),
      }
    },
  )
}


/* ========================================
   SCORE DES ROBOTS

   Les robots jouent « autour » du score du joueur
   (facteur déterministe par tournoi, manche et place)
   pour rester justes quelle que soit l'échelle du jeu.
============================================ */

function hashSeed(value: string): number {

  let hash = 2166136261


  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }


  return hash >>> 0
}


function mulberry32(seed: number): () => number {

  let current = seed


  return () => {
    current = (current + 0x6d2b79f5) | 0

    let value = current
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}


/* ========================================
   CONFIGURATIONS DE PERFORMANCE DES ROBOTS
   ======================================== */

type GameScoreConfig = {
  step: number
  ranges: Record<SoloTournamentCup, [number, number]>
}

const BOT_GAME_CONFIGS: Record<string, GameScoreConfig> = {
  ecg: {
    step: 50,
    ranges: {
      externe: [800, 1800],
      interne: [1800, 3200],
      docteur: [3000, 4500],
    },
  },
  'bacteria-slash': {
    step: 10,
    ranges: {
      externe: [300, 700],
      interne: [700, 1200],
      docteur: [1100, 1800],
    },
  },
  'surgically-insane': {
    step: 25,
    ranges: {
      externe: [600, 1200],
      interne: [1200, 1900],
      docteur: [1800, 2600],
    },
  },
  'stock-and-stack': {
    step: 50,
    ranges: {
      externe: [400, 1000],
      interne: [1000, 2200],
      docteur: [2000, 3600],
    },
  },
}

/* Offsets individuels par ordre de robot (2, 3, 4) pour différencier leur niveau */
const BOT_SKILL_OFFSETS: Record<number, number> = {
  2: -0.08, // Robot Léo (légèrement en-dessous de la moyenne de la tranche)
  3: 0.0,   // Robot Nina (dans la moyenne)
  4: 0.08,  // Robot Max (légèrement au-dessus)
}



export type BotScoreOptions = {
  stateId: string
  round: number
  botOrder: number
  cup?: SoloTournamentCup
  elapsed: number
  humanScore?: number
}

export function computeBotScore({
  stateId,
  round,
  botOrder,
  cup = 'interne',
  elapsed,
}: BotScoreOptions): number {
  const safeElapsed = Math.max(0, Math.floor(elapsed))

  const game = TOURNAMENT_GAMES[round - 1]?.game ?? 'ecg'

  const random = mulberry32(hashSeed(`${stateId}:${round}:${botOrder}`))

  const config = BOT_GAME_CONFIGS[game] ?? {
    step: 10,
    ranges: {
      externe: [300, 700],
      interne: [700, 1200],
      docteur: [1100, 1800],
    },
  }

  const [baseMin, baseMax] = config.ranges[cup] ?? config.ranges.interne
  const rangeWidth = baseMax - baseMin

  const botOffset = (BOT_SKILL_OFFSETS[botOrder] ?? 0) * rangeWidth
  const rnd = random()

  let finalTargetScore = baseMin + rnd * rangeWidth + botOffset
  finalTargetScore = Math.max(0, finalTargetScore)

  /* Simulation progressive du score au fil du temps (jusqu'à 45s) */
  const TARGET_DURATION = 45
  const progressRatio = Math.min(1, safeElapsed / TARGET_DURATION)

  /* Fluctuation légère au cours du temps sans détruire la monotonie */
  const stepRnd = (hashSeed(`${stateId}:${round}:${botOrder}:${safeElapsed}`) % 100) / 100
  const jitter = progressRatio < 1 ? (stepRnd - 0.5) * 0.02 * finalTargetScore : 0

  let currentRaw = finalTargetScore * progressRatio + jitter
  currentRaw = Math.max(0, Math.min(finalTargetScore, currentRaw))

  const step = config.step
  return Math.round(currentRaw / step) * step
}

export function ensureRoundStarted(
  storage: SoloStorage = window.localStorage,
): SoloTournamentState | null {
  try {
    const state = getSoloTournament(storage)
    if (!state || state.status !== 'playing') return null
    if (!state.round_started_at) {
      state.round_started_at = new Date().toISOString()
      storage.setItem(SOLO_TOURNAMENT_STORAGE_KEY, JSON.stringify(state))
    }
    return state
  } catch {
    return null
  }
}


/* ========================================
   ENREGISTRER LA MANCHE

   Appelée par les quatre jeux solo à la fin de
   la partie. Idempotente : seule la manche
   courante du tournoi est enregistrée, une seule fois.

   Retourne l'état mis à jour, ou null si la
   partie ne concerne pas la manche courante
   (aucun tournoi, tournoi terminé, manche déjà
   jouée, jeu sans rapport).
============================================ */

export function recordSoloRound(
  game: string,
  rawScore: number,
  storage: SoloStorage = window.localStorage,
  elapsedSeconds?: number,
  frozenBotScores?: Record<string, number>,
): SoloTournamentState | null {

  try {

    const state = getSoloTournament(storage)


    if (!state || state.status === 'finished') {
      return null
    }


    const round = state.current_round
    const expected =
      TOURNAMENT_GAMES[round - 1]?.game ?? null


    if (expected === null || expected !== game) {
      return null
    }


    const human = state.players.find(
      player =>
        player.player_id === state.human_player_id,
    )


    if (!human || getRoundScore(human, round)) {
      return null
    }


    const safeScore =
      Math.max(0, Math.floor(rawScore))

    let elapsed = elapsedSeconds
    if (elapsed === undefined) {
      if (state.round_started_at) {
        const startedAt = new Date(state.round_started_at).getTime()
        if (!isNaN(startedAt) && startedAt > 0) {
          const diff = Math.floor((Date.now() - startedAt) / 1000)
          if (diff >= 45) {
            elapsed = diff
          }
        }
      }
    }
    if (elapsed === undefined || isNaN(elapsed) || elapsed < 0) {
      elapsed = 45
    }

    const entries: RoundEntry[] =
      state.players.map(player => ({
        player,
        raw:
          player.player_id === state.human_player_id
            ? safeScore
            : frozenBotScores?.[String(player.player_order)] ?? computeBotScore({
                stateId: state.id,
                round,
                botOrder: player.player_order,
                cup: state.cup ?? 'interne',
                elapsed,
              }),
      }))


    for (const entry of rankRoundEntries(entries)) {

      entry.player.scores.push({
        round,
        raw_score: entry.raw,
        points: entry.points,
      })

      entry.player.total_score += entry.points
    }


    if (round >= TOURNAMENT_ROUND_COUNT) {
      state.status = 'finished'
    } else {
      state.current_round = round + 1
      state.round_started_at = new Date().toISOString()
    }


    storage.setItem(
      SOLO_TOURNAMENT_STORAGE_KEY,
      JSON.stringify(state),
    )


    return state

  } catch {

    /* Stockage indisponible : le jeu reste jouable. */

    return null
  }
}


/* ========================================
   DERNIÈRE MANCHE ENREGISTRÉE

   Sert à l'écran de tournoi pour annoncer
   les points de la manche précédente.
============================================ */

export function getSoloLastScoredRound(
  state: SoloTournamentState,
): number {

  return state.status === 'finished'
    ? TOURNAMENT_ROUND_COUNT
    : state.current_round - 1
}


/* ========================================
   ROUTES DU TOURNOI SOLO
============================================ */

export function getSoloTournamentGamePath(
  game: string,
): string {

  const known = TOURNAMENT_GAMES.some(
    item => item.game === game,
  )


  return known
    ? `/tournament/solo/${game}`
    : '/tournament/solo'

}


/*
  Depuis un écran de fin de partie (ou la pause),
  le joueur revient au tournoi quand la partie
  concernait la manche à jouer ou déjà validée ;
  sinon il retrouve le menu solo habituel.
*/

export function getSoloTournamentReturnPath(
  game: string,
  storage: SoloStorage = window.localStorage,
): string {

  try {

    const state = getSoloTournament(storage)


    if (!state) {
      return '/solo'
    }


    const round =
      TOURNAMENT_GAMES.findIndex(
        item => item.game === game,
      ) + 1


    if (round < 1) {
      return '/solo'
    }


    const lastScored =
      getSoloLastScoredRound(state)


    if (
      round <= lastScored ||
      round === state.current_round
    ) {
      return '/tournament/solo'
    }


    return '/solo'

  } catch {

    return '/solo'
  }
}
