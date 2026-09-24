import { fr } from './fr'
import { ro } from './ro'
import { en } from './en'
import { es } from './es'
import { it } from './it'
import { gameTextRo } from './gameText.ro'
import { gameTextEn } from './gameText.en'
import { gameTextEs } from './gameText.es'
import { gameTextIt } from './gameText.it'
import { getLanguage, type Language } from './languages'

const romanian: Record<string, string> = Object.assign(Object.create(null), gameTextRo)
const english: Record<string, string> = Object.assign(Object.create(null), gameTextEn)
const spanish: Record<string, string> = Object.assign(Object.create(null), gameTextEs)
const italian: Record<string, string> = Object.assign(Object.create(null), gameTextIt)
for (const key of Object.keys(fr) as (keyof typeof fr)[]) {
  romanian[fr[key]] = ro[key]
  english[fr[key]] = en[key]
  spanish[fr[key]] = es[key]
  italian[fr[key]] = it[key]
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const templatesFor = (dictionary: Record<string, string>) =>
  Object.entries(dictionary)
    .filter(([source]) => /\{\d+\}/.test(source))
    .map(([source, translation]) => {
      const indexes: string[] = []
      const parts = source.split(/(\{\d+\})/)
      const pattern = parts.map(part => {
        if (/^\{\d+\}$/.test(part)) {
          indexes.push(part)
          return '([\\s\\S]*?)'
        }
        return escapeRegex(part).replace(/\s+/g, '\\s+')
      }).join('')
      return { pattern: new RegExp(`^${pattern}$`), indexes, translation }
    })

const romanianTemplates = templatesFor(romanian)
const englishTemplates = templatesFor(english)
const spanishTemplates = templatesFor(spanish)
const italianTemplates = templatesFor(italian)

/** Translate interface text only; never pass player names, codes or server IDs. */
export function translateGameText(language: Language, text: string): string {
  if (language !== 'ro' && language !== 'en' && language !== 'es' && language !== 'it') return text
  const dictionary =
    language === 'en' ? english
    : language === 'es' ? spanish
    : language === 'it' ? italian
    : romanian
  const source = normalize(text)
  const translated = dictionary[source]
  const leading = text.match(/^\s*/)?.[0] ?? ''
  const trailing = text.match(/\s*$/)?.[0] ?? ''
  if (translated !== undefined) return leading + translated + trailing
  const templates =
    language === 'en' ? englishTemplates
    : language === 'es' ? spanishTemplates
    : language === 'it' ? italianTemplates
    : romanianTemplates
  for (const template of templates) {
    const match = template.pattern.exec(text.trim())
    if (!match) continue
    const values = Object.fromEntries(template.indexes.map((index, i) => [index, match[i + 1]]))
    return leading + template.translation.replace(/\{\d+\}/g, token => values[token] ?? token) + trailing
  }
  return text
}

/** Non-string conditional JSX results pass through unchanged. */
export function tr<T>(value: T): T {
  return (typeof value === 'string' ? translateGameText(getLanguage(), value) : value) as T
}

/** Translate the sentence before inserting values, preserving names and punctuation. */
export function formatGameText(source: string, ...values: unknown[]): string {
  return tr(source).replace(/\{(\d+)\}/g, (token, index: string) => String(values[Number(index)] ?? token))
}
