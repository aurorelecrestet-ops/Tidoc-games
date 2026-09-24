import { tr } from '../i18n/gameText'
import { Link } from 'react-router-dom'
import licenses from '../data/openSourceLicenses.json'
import './Parametres.css'
import './ConditionsUtilisation.css'
import './SettingsDetails.css'

export default function LicencesOpenSource() {
  return <section className="settings-page settings-legal-page settings-details-page">
    <Link className="settings-back" to="/parametres">{tr("← Retour aux paramètres")}</Link>
    <div className="settings-heading">
      <p className="settings-eyebrow">TI’DOC GAMES</p>
      <h1>{tr("Licences ")}<span>{tr("open source")}</span></h1>
      <p className="settings-subtitle">{tr("Les bibliothèques qui contribuent au fonctionnement de Ti’Doc Games.")}</p>
    </div>
    <div className="settings-content">
      <div className="settings-card settings-legal-document">
        <section className="settings-legal-section">
          <h2>{tr("Crédits et notices")}</h2>
          <p>{tr("Cette liste présente les ")}{licenses.length} {tr(" dépendances de production installées pour cette version, y compris leurs dépendances indirectes. Ouvre une bibliothèque pour consulter ses mentions originales.")}</p>
          <p>{tr("Ces licences concernent les bibliothèques citées. Elles ne définissent pas les droits d’utilisation du nom Ti’Doc, des illustrations ou des musiques du jeu.")}</p>
        </section>
        {licenses.map(library => <details className="settings-license" key={library.name}>
          <summary><span><strong>{library.name}</strong><small>{tr("Version ")}{library.version}</small></span><span className="settings-license-badge">{library.license}</span></summary>
          {library.notices.map(notice => <div key={notice.file}><p className="settings-license-filename">{notice.file}</p><pre>{notice.text}</pre></div>)}
        </details>)}
      </div>
    </div>
  </section>
}
