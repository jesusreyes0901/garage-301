import { ObservationComposer, ObservationFeed } from '../observaciones/ObservacionUI'
import { useStore } from '../../store'

export function TallerObservaciones() {
  const { state } = useStore()
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Observaciones</h2>
          <p>Notas técnicas con fotos. Toca la placa o la foto para ver el detalle del vehículo.</p>
        </div>
      </div>
      <div className="grid two">
        <ObservationComposer vehicles={state.vehicles} title="Nueva nota con evidencia" />
        <ObservationFeed />
      </div>
    </>
  )
}
