import { tr } from '../i18n/gameText'
import { useNavigate } from 'react-router-dom'
import './Aide.css'

const helpSections = [
  ['Choisir un jeu', 'Depuis l’accueil, ouvre le mode Solo ou Multijoueur, puis sélectionne une spécialité. Chaque carte indique le principe du jeu et l’action à lancer.'],
  ['Jouer en solo', 'Les records solo sont enregistrés dans ton navigateur. Pendant une partie, le bouton Pause arrête le jeu et la musique. Tu peux reprendre ou retourner au menu principal.'],
  ['Jouer à plusieurs', 'Choisis un jeu multijoueur, crée une salle ou rejoins une salle avec son code. Attends les autres joueurs dans le lobby avant de commencer.'],
  ['Profil et classements', 'Ton avatar et ton pseudo se gèrent depuis le bouton de profil. Les classements affichent les meilleurs scores associés à ton profil.'],
  ['Son et confidentialité', 'Les volumes se règlent dans Paramètres. La page Confidentialité explique les données utilisées et les préférences disponibles.'],
] as const

export default function Aide() {
  const navigate = useNavigate()

  return (
    <section className="help-page">
      <button type="button" className="help-back" onClick={() => navigate('/')}>
        {tr("← Retour à l’accueil")}</button>

      <div className="help-heading">
        <p className="help-eyebrow">TI’DOC GAMES</p>
        <h1>{tr("Besoin d’")}<span>{tr("aide")}</span> ?</h1>
        <p>{tr("Retrouve ici les principales règles pour utiliser l’application.")}</p>
      </div>

      <div className="help-grid">
        {helpSections.map(([title, text]) => (
          <article className="help-card" key={title}>
            <span className="help-card-icon" aria-hidden="true">?</span>
            <h2>{tr(title)}</h2>
            <p>{tr(text)}</p>
          </article>
        ))}
      </div>

      <div className="help-contact">
        <strong>{tr("Une question ou un problème ?")}</strong>
        <p>{tr("Écris à ")}<a href="mailto:tidoc.congres@gmail.com">tidoc.congres@gmail.com</a>.</p>
      </div>
    </section>
  )
}
