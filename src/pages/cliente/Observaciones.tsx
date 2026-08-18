import { ObservationComposer, ObservationFeed } from '../observaciones/ObservacionUI'
import { useStore } from '../../store'

export function ClienteObservaciones() {
  const { state, user } = useStore()
  const mine = state.vehicles.filter((v) => v.ownerId === user?.id)
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Observaciones</h2>
          <p>Envía notas y fotos. La placa identifica la unidad; entra al detalle con un clic.</p>
        </div>
      </div>
      <div className="grid two">
        <ObservationComposer vehicles={mine} title="Escribir al taller" />
        <ObservationFeed vehicleIds={mine.map((v) => v.id)} />
      </div>
    </>
  )
}
