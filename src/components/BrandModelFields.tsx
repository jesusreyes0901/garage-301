import { useId, useMemo } from 'react'
import { CAR_BRANDS, modelsForBrand } from '../carCatalog'

type Props = {
  brand: string
  model: string
  year: string | number
  onBrand: (v: string) => void
  onModel: (v: string) => void
  onYear: (v: string) => void
  required?: boolean
  yearMin?: number
  yearMax?: number
}

export function BrandModelFields({
  brand,
  model,
  year,
  onBrand,
  onModel,
  onYear,
  required = false,
  yearMin = 1950,
  yearMax = new Date().getFullYear() + 1,
}: Props) {
  const brandListId = useId()
  const modelListId = useId()
  const models = useMemo(() => modelsForBrand(brand), [brand])

  return (
    <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
      <label>
        Marca
        <input
          list={brandListId}
          value={brand}
          onChange={(e) => {
            onBrand(e.target.value)
            onModel('')
          }}
          placeholder="Ej. Toyota, Nissan…"
          autoComplete="off"
          required={required}
        />
        <datalist id={brandListId}>
          {CAR_BRANDS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </label>
      <label>
        Modelo
        <input
          list={modelListId}
          value={model}
          onChange={(e) => onModel(e.target.value)}
          placeholder={models.length ? 'Elige o escribe el modelo' : 'Escribe el modelo'}
          autoComplete="off"
          required={required}
        />
        <datalist id={modelListId}>
          {models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>
      <label>
        Año
        <input
          type="number"
          min={yearMin}
          max={yearMax}
          value={year}
          onChange={(e) => onYear(e.target.value)}
          placeholder="2020"
          required={required}
        />
      </label>
    </div>
  )
}
