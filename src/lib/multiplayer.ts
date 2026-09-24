import { supabase } from './supabase'
import { initializePlayer } from './player'


export type GameRoom = {
  id: string
  code: string
  game: string
  host_id: string
  status:
    | 'waiting'
    | 'playing'
    | 'finished'
  max_players: number
  created_at: string
  started_at: string | null
  game_seed: number | null
  finished_at: string | null
}



export type RoomPlayer = {
  room_id: string
  player_id: string
  player_order: number
  color:
    | 'green'
    | 'red'
    | 'yellow'
    | 'purple'
  score: number
  lives: number
  eliminated: boolean
  joined_at: string
}


/* ========================================
   GÉNÉRER UN CODE DE PARTIE

   On retire les caractères qui peuvent
   facilement être confondus :
   O / 0 / I / 1
======================================== */

function generateRoomCode() {

  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  let code = ''

  for (
    let i = 0;
    i < 6;
    i += 1
  ) {

    const index =
      Math.floor(
        Math.random() *
        characters.length
      )

    code += characters[index]
  }

  return code
}


/* ========================================
   CRÉER UNE PARTIE

   1. Initialise le joueur.
   2. Génère un code.
   3. Crée la room.
   4. Ajoute l'hôte comme joueur 1.
======================================== */

export async function createGameRoom(
  game: string
): Promise<GameRoom> {

  const player =
    await initializePlayer()

  const MAX_ATTEMPTS = 10


  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt += 1
  ) {

    const code =
      generateRoomCode()


    const {
      data: room,
      error: roomError,
    } = await supabase
      .from('game_rooms')
      .insert({
        code,
        game,
        host_id: player.id,
        status: 'waiting',
        max_players: 4,
      })
      .select(
        `
          id,
code,
game,
host_id,
status,
max_players,
created_at,
started_at,
game_seed,
finished_at
        `
      )
      .single()


    /*
      Le code existe déjà :
      on en génère simplement un autre.
    */

    if (
      roomError?.code ===
      '23505'
    ) {
      continue
    }


    if (roomError) {
      throw roomError
    }


    if (!room) {
      throw new Error(
        'Impossible de créer la partie.'
      )
    }


    /*
      L'hôte devient automatiquement
      le joueur numéro 1, couleur verte.
    */

    const {
      error: playerError,
    } = await supabase
      .from('game_room_players')
      .insert({
        room_id: room.id,
        player_id: player.id,
        player_order: 1,
        color: 'green',
        score: 0,
        lives: 3,
        eliminated: false,
      })


    if (playerError) {

      /*
        Si l'ajout du joueur échoue,
        on supprime la room créée afin
        de ne pas laisser une partie vide.
      */

      await supabase
        .from('game_rooms')
        .delete()
        .eq(
          'id',
          room.id
        )

      throw playerError
    }


    return room as GameRoom
  }


  throw new Error(
    'Impossible de générer un code de partie disponible.'
  )
}

/* ========================================
   JOUEUR AFFICHÉ DANS LE LOBBY
======================================== */

export type LobbyPlayer = {
  player_id: string
  player_order: number

  color:
    | 'green'
    | 'red'
    | 'yellow'
    | 'purple'

  score: number
  lives: number
  eliminated: boolean

  pseudo: string
  avatar: number
}


/* ========================================
   RÉCUPÉRER UNE PARTIE AVEC SON CODE
======================================== */

export async function getGameRoomByCode(
  code: string
): Promise<GameRoom | null> {

  const cleanedCode =
    code
      .trim()
      .toUpperCase()


  const {
    data,
    error,
  } = await supabase
    .from('game_rooms')
    .select(
      `
        id,
code,
game,
host_id,
status,
max_players,
created_at,
started_at,
game_seed,
finished_at
      `
    )
    .eq(
      'code',
      cleanedCode
    )
    .maybeSingle()


  if (error) {
    throw error
  }


  return data as GameRoom | null
}


/* ========================================
   RÉCUPÉRER LES JOUEURS DU LOBBY
======================================== */

export async function getRoomPlayers(
  roomId: string
): Promise<LobbyPlayer[]> {

  const {
    data,
    error,
  } = await supabase
    .from('game_room_players')
    .select(`
      player_id,
      player_order,
      color,
      score,
      lives,
      eliminated,
      players (
        pseudo,
        avatar
      )
    `)
    .eq(
      'room_id',
      roomId
    )
    .order(
      'player_order',
      {
        ascending: true,
      }
    )


  if (error) {
    throw error
  }


  return (
    data ?? []
  ).map((row: any) => {

    const profile =
      Array.isArray(row.players)
        ? row.players[0]
        : row.players

    return {
      player_id:
        row.player_id,

      player_order:
        row.player_order,

      color:
        row.color,

      score:
        Number(row.score),

      lives:
        Number(row.lives),

      eliminated:
        Boolean(row.eliminated),

      pseudo:
        profile?.pseudo ??
        'TiDoc',

      avatar:
        profile?.avatar ??
        1,
    }
  })
}

/* ========================================
   REJOINDRE UNE PARTIE
======================================== */

export async function joinGameRoom(
  code: string
): Promise<GameRoom> {

  const player =
    await initializePlayer()

  const room =
    await getGameRoomByCode(code)

  if (!room) {
    throw new Error(
      'Partie introuvable.'
    )
  }

  /*
    On récupère les participants avant
    de vérifier le statut de la partie.
  */

  const currentPlayers =
    await getRoomPlayers(room.id)

  const alreadyJoined =
    currentPlayers.find(
      item =>
        item.player_id === player.id
    )

  /*
    Un ancien participant peut retrouver
    sa partie, même si elle est terminée.
  */

  if (alreadyJoined) {
    return room
  }

  /*
    Un nouveau joueur ne peut rejoindre
    qu'une partie encore en attente.
  */

  if (room.status !== 'waiting') {
    throw new Error(
      room.status === 'finished'
        ? 'Cette partie est terminée.'
        : 'Cette partie a déjà commencé.'
    )
  }

  /*
    Vérifier si la salle est complète.
  */

  if (
    currentPlayers.length >=
    room.max_players
  ) {
    throw new Error(
      'Cette partie est complète.'
    )
  }

  const nextOrder =
    currentPlayers.length + 1

  const colors = [
    'green',
    'red',
    'yellow',
    'purple',
  ] as const

  const color =
    colors[nextOrder - 1]

  const {
    error,
  } = await supabase
    .from('game_room_players')
    .insert({
      room_id: room.id,
      player_id: player.id,
      player_order: nextOrder,
      color,
      score: 0,
      lives: 3,
      eliminated: false,
    })

  if (error) {
    throw error
  }

  return room
}

/* ========================================
   DÉMARRER UNE PARTIE
======================================== */

export async function startGameRoom(

  roomId: string
): Promise<GameRoom> {

  const {
    data,
    error,
  } = await supabase.rpc(
    'start_multiplayer_game',
    {
      p_room_id: roomId,
    }
  )


  if (error) {
    throw error
  }


  if (!data) {
    throw new Error(
      'Impossible de démarrer la partie.'
    )
  }


  return data as GameRoom
}


/* ========================================
   ID DU JOUEUR ACTUEL
======================================== */

export async function getCurrentPlayerId():
Promise<string | null> {

  const {
    data,
    error,
  } =
    await supabase.auth.getUser()


  if (error) {
    throw error
  }


  return (
    data.user?.id ??
    null
  )
}

/* ========================================
   METTRE À JOUR SON SCORE MULTIJOUEUR
======================================== */

export async function updateMultiplayerScore(
  roomId: string,
  score: number,
): Promise<void> {

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!userData.user) {
    throw new Error(
      'Joueur non connecté.',
    )
  }

  const {
    error,
  } = await supabase
    .from('game_room_players')
    .update({
      score:
        Math.max(
          0,
          Math.floor(score),
        ),
    })
    .eq(
      'room_id',
      roomId,
    )
    .eq(
      'player_id',
      userData.user.id,
    )

  if (error) {
    throw error
  }
}


/* ========================================
   ÉLIMINER LE JOUEUR ACTUEL
======================================== */

export async function eliminateMultiplayerPlayer(
  roomId: string,
  score: number,
): Promise<void> {

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!userData.user) {
    throw new Error(
      'Joueur non connecté.',
    )
  }

  const {
    error,
  } = await supabase
    .from('game_room_players')
    .update({
      score:
        Math.max(
          0,
          Math.floor(score),
        ),

      eliminated: true,

      eliminated_at:
        new Date().toISOString(),
    })
    .eq(
      'room_id',
      roomId,
    )
    .eq(
      'player_id',
      userData.user.id,
    )

  if (error) {
    throw error
  }

  const {
    error: finishError,
  } = await supabase.rpc(
    'finish_multiplayer_game_if_complete',
    {
      p_room_id: roomId,
    },
  )

  if (finishError) {
    throw finishError
  }
}