import { tr } from '../i18n/gameText'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearLocalRecords } from '../lib/localRecords'
import './Parametres.css'
import './ConditionsUtilisation.css'
import './SettingsDetails.css'

export default function PreferencesConfidentialite() {
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  function eraseRecords() {
    try {
      clearLocalRecords()
      setConfirming(false)
      setError(false)
      setMessage('Les quatre records solo de ce navigateur ont été effacés. Tes scores en ligne sont conservés.')
    } catch {
      setError(true)
      setMessage('L’effacement n’a pas pu être terminé. Vérifie que ton navigateur autorise l’accès au stockage, puis réessaie.')
    }
  }

  return <section className="settings-page settings-legal-page settings-details-page">
    <Link className="settings-back" to="/parametres">{tr("← Retour aux paramètres")}</Link>
    <div className="settings-heading">
      <p className="settings-eyebrow">TI’DOC GAMES</p>
      <h1>{tr("Préférences de ")}<span>{tr("confidentialité")}</span></h1>
      <p className="settings-subtitle">{tr("Gère les données conservées sur cet appareil et retrouve les informations sur ton profil.")}</p>
    </div>
    <div className="settings-content">
      <article className="settings-card settings-legal-document">
        <section className="settings-legal-section">
          <h2>{tr("Records sur cet appareil")}</h2>
          <p>{tr("Ton navigateur conserve un meilleur score pour ECG, Bacteria Slash, Surgically Insane et Stock & Stack. Tu peux effacer ces quatre records locaux.")}</p>
          <p>{tr("Cette action conserve ton profil, ta session et tes réglages audio. Les scores déjà envoyés aux classements en ligne restent enregistrés. De nouveaux records locaux pourront être enregistrés lors de tes prochaines parties.")}</p>
          {!confirming ? <button type="button" className="settings-master-button" onClick={() => { setConfirming(true); setMessage('') }}>{tr("Effacer les records locaux")}</button> : <div className="settings-confirmation" role="group" aria-labelledby="erase-records-title">
            <h3 id="erase-records-title">{tr("Effacer les quatre records locaux ?")}</h3>
            <p>{tr("Cette action est définitive pour ce navigateur. Ferme les parties ouvertes dans les autres onglets pour éviter qu’elles enregistrent à nouveau un score.")}</p>
            <div className="settings-detail-actions">
              <button type="button" className="settings-master-button" onClick={eraseRecords}>{tr("Confirmer l’effacement")}</button>
              <button type="button" className="settings-inline-reset-button" onClick={() => { setConfirming(false); setMessage('') }}>{tr("Annuler")}</button>
            </div>
          </div>}
          <p role={error ? 'alert' : 'status'} className={message ? 'settings-share-message' : undefined}>{tr(message)}</p>
        </section>
        <section className="settings-legal-section">
          <h2>{tr("Préférences audio")}</h2>
          <p>{tr("Les volumes et l’activation des musiques et des effets sont mémorisés dans ce navigateur. Tu peux les modifier ou les réinitialiser depuis les paramètres audio.")}</p>
          <Link to="/parametres">{tr("Gérer les réglages audio →")}</Link>
        </section>
        <section className="settings-legal-section">
          <h2>{tr("Profil et données en ligne")}</h2>
          <p>{tr("Ta session permet de retrouver ton profil, tes scores et tes parties. Effacer les données du site depuis ton navigateur peut te faire perdre l’accès au profil, sans supprimer les données enregistrées en ligne.")}</p>
          <p>{tr("Pour demander l’accès, la rectification ou la suppression de tes données, contacte Ti’Doc en indiquant le pseudo concerné et ta demande. Ne communique jamais ton jeton de session ni un mot de passe.")}</p>
          <a className="settings-legal-email" href={`mailto:tidoc.congres@gmail.com?subject=${encodeURIComponent(tr("Demande relative aux données Ti’Doc Games"))}`}>tidoc.congres@gmail.com</a>
        </section>
        <section className="settings-legal-section">
          <h2>{tr("Comprendre l’utilisation des données")}</h2>
          <p>{tr("Retrouve les données utilisées par le jeu, leur visibilité et les informations sur leur conservation dans la politique de confidentialité.")}</p>
          <Link className="settings-privacy-link" to="/parametres/politique-confidentialite">
            <span className="settings-privacy-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 4 6v6c0 4.5 8 9 8 9s8-4.5 8-9V6l-8-3Z" />
                <path d="m8.5 12 2.5 2.5 4.5-5" />
              </svg>
            </span>
            <span className="settings-privacy-link-copy"><strong>{tr("Lire la politique de confidentialité")}</strong><span>{tr("Tes données, tes droits et nos engagements")}</span></span>
            <span className="settings-privacy-link-arrow" aria-hidden="true">→</span>
          </Link>
        </section>
      </article>
    </div>
  </section>
}
