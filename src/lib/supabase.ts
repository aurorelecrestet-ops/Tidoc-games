import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Vercel : renseigner VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
// (ou VITE_SUPABASE_ANON_KEY en repli, nom historique Supabase).
// IMPORTANT : ne jamais jeter d'erreur au chargement du module,
// sinon React ne monte pas et Vercel n'affiche que le fond bleu.

function normalizeSupabaseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  let cleaned = value.trim().replace(/^["']|["']$/g, '').trim()
  if (!cleaned) return undefined
  // Cas le plus robuste : ne garder que l'origin (protocole + hôte).
  // Ça couvre TOUTES les erreurs de copier-coller depuis le dashboard :
  // https://xxx.supabase.co/rest/v1, /auth/v1, /storage/v1/...,
  // avec ou sans slash final, query, espace, guillemets.
  // Le client supabase-js ajoute lui-même /rest/v1, /auth/v1, etc.
  // S'il reçoit une URL avec un chemin, il double le chemin et
  // PostgREST répond 404 PGRST125 « Invalid path specified in request URL ».
  try {
    const parsed = new URL(cleaned)
    if (parsed.pathname && parsed.pathname !== '/') {
      console.warn(
        `[Supabase] VITE_SUPABASE_URL contenait un chemin ("${parsed.pathname}") — réduit à "${parsed.origin}". ` +
          `Corrigez la variable Vercel avec uniquement l'origin (ex. https://xxx.supabase.co), puis redeployez.`,
      )
      return parsed.origin
    }
    // Même sans chemin, on repart de l'origin pour éliminer
    // slash final, query (?…), hash (#…) ou port exotique mal copié.
    if (parsed.search || parsed.hash || cleaned !== parsed.origin) {
      return parsed.origin
    }
    return cleaned.replace(/\/+$/, '')
  } catch {
    // Valeur non parseable : repli sur l'ancien nettoyage par suffixes connus.
    cleaned = cleaned
      .replace(/\/rest\/v1\/?(?:.*)?$/i, '')
      .replace(/\/auth\/v1\/?(?:.*)?$/i, '')
      .replace(/\/storage\/v1\/?(?:.*)?$/i, '')
      .replace(/\/functions\/v1\/?(?:.*)?$/i, '')
      .replace(/\/realtime\/v1\/?(?:.*)?$/i, '')
      .replace(/\/+$/, '')
    return cleaned ? cleaned : undefined
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeEnvValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().replace(/^["']|["']$/g, '').trim()
  return trimmed ? trimmed : undefined
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)

const supabaseKey =
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ??
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY)

/* ========================================
   TRACEUR RÉSEAU (visible même sur Safari
   iPhone/iPad sans console) : enregistre
   la DERNIÈRE URL réellement appelée et
   son statut. Header.tsx l'affiche.
======================================== */

export type SupabaseLastCall = {
  url: string
  method: string
  status: number | string
  at: string
}

export const supabaseLastCalls: SupabaseLastCall[] = []

function recordSupabaseCall(
  url: string,
  method: string,
  status: number | string,
) {
  supabaseLastCalls.push({
    url: String(url).slice(0, 300),
    method,
    status,
    at: new Date().toISOString().slice(11, 19),
  })
  if (supabaseLastCalls.length > 5) {
    supabaseLastCalls.shift()
  }
}

function tracingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url
  const method =
    init?.method ??
    (typeof input === 'object' && 'method' in input
      ? (input as Request).method
      : 'GET') ??
    'GET'
  return fetch(input as RequestInfo, init).then(
    (response) => {
      recordSupabaseCall(url, method, response.status)
      return response
    },
    (error) => {
      recordSupabaseCall(
        url,
        method,
        error instanceof Error ? `ERR:${error.message.slice(0, 80)}` : 'ERR',
      )
      throw error
    },
  )
}

export function getSupabaseLastCallLine(): string {
  if (supabaseLastCalls.length === 0) {
    return 'aucun appel réseau enregistré'
  }
  return supabaseLastCalls
    .map((call) => `${call.at} ${call.method} ${call.status} ${call.url}`)
    .join('\n')
}

export const supabaseConfigError =
  !supabaseUrl
    ? 'VITE_SUPABASE_URL est manquante dans les variables Vercel.'
    : !isHttpUrl(supabaseUrl)
      ? `VITE_SUPABASE_URL est invalide ("${supabaseUrl}"). Elle doit commencer par https://, sans espace ni guillemet.`
      : !supabaseKey
        ? 'VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY) est manquante dans les variables Vercel.'
        : null

function createMissingConfigClient(message: string): SupabaseClient {
  // Client factice : l'import du module réussit toujours, l'erreur
  // n'est levée qu'au moment d'un vrai appel réseau, et Header.tsx
  // l'affiche déjà sans masquer les menus.
  const fail = () => {
    throw new Error(message)
  }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy(
            {},
            {
              get(_authTarget, authProp) {
                if (authProp === 'onAuthStateChange') {
                  return () => ({
                    data: {
                      subscription: { unsubscribe() {} },
                    },
                  })
                }
                return fail
              },
            },
          )
        }
        return fail
      },
    },
  ) as unknown as SupabaseClient
}

export const supabase: SupabaseClient =
  supabaseConfigError || !supabaseUrl || !supabaseKey || !isHttpUrl(supabaseUrl)
    ? createMissingConfigClient(
        supabaseConfigError ?? 'Configuration Supabase manquante.',
      )
    : createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: tracingFetch,
        },
      })

/* ========================================
   INFOS DE DIAGNOSTIC (sans exposer la clé)
   Utilisées par Header.tsx pour afficher
   une erreur actionnable au lieu d'un
   simple "Invalid path specified...".
======================================== */

export const supabaseEffectiveOrigin: string | null =
  supabaseUrl ?? null

export const supabaseHasKey: boolean =
  Boolean(supabaseKey)

export const supabaseRestBaseUrl: string | null =
  supabaseUrl ? new URL('rest/v1', `${supabaseUrl}/`).href : null

export const supabaseDebugLine: string =
  `origin=${supabaseUrl ?? '∅'} rest=${supabaseRestBaseUrl ?? '∅'} clé=${supabaseKey ? 'ok' : 'MANQUANTE'}`

if (supabaseConfigError) {
  console.error(`[Supabase] ${supabaseConfigError}`)
}
