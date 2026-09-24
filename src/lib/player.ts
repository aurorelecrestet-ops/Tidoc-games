import { supabase } from './supabase'

export type Player = {
  id: string
  pseudo: string
  avatar: number
  created_at: string
  updated_at: string
  last_active_at: string | null
}


/* ========================================
   GÉNÉRER UN PSEUDO AUTOMATIQUE
======================================== */

function generateAutomaticPseudo() {
  const number =
    Math.floor(
      1000 + Math.random() * 9000
    )

  return `TiDoc-${number}`
}


/* ========================================
   RÉCUPÉRER OU CRÉER LA SESSION ANONYME
======================================== */

async function getOrCreateAnonymousUser() {
  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (sessionData.session?.user) {
    return sessionData.session.user
  }


  const {
    data,
    error,
  } = await supabase.auth.signInAnonymously()

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error(
      "Impossible de créer le joueur anonyme."
    )
  }

  return data.user
}


/* ========================================
   CHERCHER LE PROFIL DU JOUEUR
======================================== */

async function getPlayerProfile(
  userId: string
): Promise<Player | null> {

  const {
    data,
    error,
  } = await supabase
    .from('players')
    .select(
      'id, pseudo, avatar, created_at, updated_at'
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as Player | null
}


/* ========================================
   CRÉER UN NOUVEAU PROFIL

   On essaie plusieurs pseudos si jamais
   TiDoc-XXXX existe déjà.
======================================== */

async function createPlayerProfile(
  userId: string
): Promise<Player> {

  const MAX_ATTEMPTS = 20

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt += 1
  ) {

    const pseudo =
      generateAutomaticPseudo()

    const {
      data,
      error,
    } = await supabase
      .from('players')
      .insert({
        id: userId,
        pseudo,
        avatar: 1,
      })
      .select(
        'id, pseudo, avatar, created_at, updated_at'
      )
      .single()


    if (!error && data) {
      return data as Player
    }


    /*
      PostgreSQL 23505 =
      violation d'une contrainte UNIQUE.

      Ici, le pseudo généré existe
      probablement déjà : on réessaie.
    */

    if (error?.code === '23505') {
      continue
    }


    throw error
  }


  throw new Error(
    "Impossible de générer un pseudo disponible."
  )
}
/* ========================================
   ENREGISTRER L'OUVERTURE DE L'APPLICATION

   Une simple ouverture de Ti'Doc Games
   compte comme une activité.

   Ne modifie pas updated_at :
   cette colonne reste réservée aux
   modifications du profil.
======================================== */

async function recordPlayerActivity(
  userId: string
): Promise<Player> {

  const {
    data,
    error,
  } = await supabase
    .from('players')
    .update({
      last_active_at:
        new Date().toISOString(),
    })
    .eq('id', userId)
    .select(
      'id, pseudo, avatar, created_at, updated_at, last_active_at'
    )
    .single()

  if (error) {
    throw error
  }

  return data as Player
}

/* ========================================
   INITIALISER LE JOUEUR

   1. Récupérer ou créer la session.
   2. Récupérer le profil existant.
   3. Sinon, créer le profil.
   4. Enregistrer l'ouverture de l'app.
======================================== */

export async function initializePlayer():
Promise<Player> {

  const user =
    await getOrCreateAnonymousUser()

  const existingPlayer =
    await getPlayerProfile(user.id)

  if (existingPlayer) {

    return recordPlayerActivity(
      user.id
    )

  }

  await createPlayerProfile(
    user.id
  )

  return recordPlayerActivity(
    user.id
  )
}


/* ========================================
   MODIFIER LE PSEUDO
======================================== */

export async function updatePlayerPseudo(
  pseudo: string
): Promise<Player> {

  const cleanedPseudo =
    pseudo.trim()

  if (
    cleanedPseudo.length < 3 ||
    cleanedPseudo.length > 16
  ) {
    throw new Error(
      'Le pseudo doit contenir entre 3 et 16 caractères.'
    )
  }


  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!userData.user) {
    throw new Error(
      'Joueur non connecté.'
    )
  }


  const {
    data,
    error,
  } = await supabase
    .from('players')
    .update({
      pseudo: cleanedPseudo,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      userData.user.id
    )
    .select(
      'id, pseudo, avatar, created_at, updated_at'
    )
    .single()


  if (error?.code === '23505') {
    throw new Error(
      'Ce pseudo est déjà utilisé.'
    )
  }

  if (error) {
    throw error
  }

  return data as Player
}


/* ========================================
   MODIFIER L'AVATAR
======================================== */

export async function updatePlayerAvatar(
  avatar: number
): Promise<Player> {

  if (
    !Number.isInteger(avatar) ||
    avatar < 1 ||
    avatar > 10
  ) {
    throw new Error(
      'Avatar invalide.'
    )
  }


  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!userData.user) {
    throw new Error(
      'Joueur non connecté.'
    )
  }


  const {
    data,
    error,
  } = await supabase
    .from('players')
    .update({
      avatar,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      userData.user.id
    )
    .select(
      'id, pseudo, avatar, created_at, updated_at'
    )
    .single()


  if (error) {
    throw error
  }

  return data as Player
}


/* ========================================
   ENVOYER UN SCORE

   La fonction SQL Supabase garde
   automatiquement le meilleur score.
======================================== */

export async function submitBestScore(
  game: string,
  score: number
): Promise<number> {

  const {
    data,
    error,
  } = await supabase.rpc(
    'submit_best_score',
    {
      p_game: game,
      p_score:
        Math.max(
          0,
          Math.floor(score)
        ),
    }
  )

  if (error) {
    throw error
  }

  return Number(data)
}

/* ========================================
   CLASSEMENT D'UN JEU
======================================== */

export type LeaderboardEntry = {
  player_id: string
  pseudo: string
  avatar: number
  score: number
  isCurrentPlayer: boolean
}


export async function getLeaderboard(
  game: string,
  limit = 10
): Promise<LeaderboardEntry[]> {

  /*
    Récupération du joueur actuel
    pour pouvoir mettre sa ligne
    en évidence dans le classement.
  */

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }


  const currentUserId =
    userData.user?.id ?? null


  /*
    Récupération des meilleurs scores
    avec le profil correspondant.
  */

  const {
    data,
    error,
  } = await supabase
    .from('scores')
    .select(`
      player_id,
      score,
      players (
        pseudo,
        avatar
      )
    `)
    .eq(
      'game',
      game
    )
    .order(
      'score',
      {
        ascending: false,
      }
    )
    .limit(limit)


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

      pseudo:
        profile?.pseudo ??
        'TiDoc',

      avatar:
        profile?.avatar ??
        1,

      score:
        Number(row.score),

      isCurrentPlayer:
        row.player_id ===
        currentUserId,
    }
  })
}