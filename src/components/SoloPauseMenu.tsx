import { useTranslation } from '../hooks/useTranslation'
import './SoloPauseMenu.css'
import { createPortal } from 'react-dom'

type SoloPauseMenuProps = {
  paused: boolean
  onPause: () => void
  onResume: () => void
  onReturn: () => void
  label?: string
}

export default function SoloPauseMenu({
  paused,
  onPause,
  onResume,
  onReturn,
  label,
}: SoloPauseMenuProps) {
  const { t } = useTranslation()

  return createPortal(
    <>
      {!paused && (
        <button
          type="button"
          className="solo-pause-button"
          aria-label={t('pause.action')}
          onClick={onPause}
        >
          <span aria-hidden="true">Ⅱ</span>
          {t('pause.button')}
        </button>
      )}

      {paused && (
        <div className="solo-pause-overlay" role="dialog" aria-modal="true" aria-label={label ?? t('pause.title')}>
          <div className="solo-pause-card">
            <div className="solo-pause-mark" aria-hidden="true">
              <span />
              <span />
            </div>
            <p className="solo-pause-kicker">{t('pause.inProgress')}</p>
            <h2>{label ?? t('pause.title')}</h2>
            <p className="solo-pause-description">{t('pause.description')}</p>
            <div className="solo-pause-actions">
              <button type="button" onClick={onResume}>
                <span>{t('pause.resume')}</span> <b>▶</b>
              </button>
              <button type="button" className="solo-pause-secondary" onClick={onReturn}>
                <span>{t('pause.return')}</span> <b>→</b>
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}
