export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <img src={src} alt="Evidencia" onClick={(e) => e.stopPropagation()} />
      <button className="btn secondary" type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  )
}
