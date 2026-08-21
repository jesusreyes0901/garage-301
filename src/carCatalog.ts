/** Catálogo de marcas y modelos comunes en México (sugerencias + escritura libre). */
export const CAR_BRANDS = [
  'Toyota',
  'Nissan',
  'Chevrolet',
  'Ford',
  'Volkswagen',
  'Honda',
  'Hyundai',
  'Kia',
  'Mazda',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Jeep',
  'Dodge',
  'Ram',
  'GMC',
  'Suzuki',
  'Mitsubishi',
  'Subaru',
  'Renault',
  'Peugeot',
  'Seat',
  'Tesla',
  'BYD',
  'MG',
  'Chirey',
  'JAC',
  'Otro',
] as const

export const CAR_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'Yaris', 'RAV4', 'Hilux', 'Tacoma', 'Prius', 'Avanza', 'Sienna', '4Runner'],
  Nissan: ['Versa', 'Sentra', 'Altima', 'March', 'Kicks', 'X-Trail', 'Frontier', 'NP300', 'Maxima', 'Pathfinder'],
  Chevrolet: ['Aveo', 'Spark', 'Onix', 'Cavalier', 'Trax', 'Tracker', 'Equinox', 'Silverado', 'Tahoe', 'Captiva'],
  Ford: ['Fiesta', 'Focus', 'Escape', 'Explorer', 'Edge', 'Mustang', 'F-150', 'Ranger', 'Bronco', 'Maverick'],
  Volkswagen: ['Jetta', 'Vento', 'Polo', 'Golf', 'Tiguan', 'Taos', 'Virtus', 'T-Cross', 'Amarok', 'Passat'],
  Honda: ['Civic', 'Accord', 'City', 'Fit', 'CR-V', 'HR-V', 'Pilot', 'Odyssey', 'BR-V'],
  Hyundai: ['Accent', 'Elantra', 'Tucson', 'Creta', 'Santa Fe', 'Venue', 'Kona', 'i10', 'Palisade'],
  Kia: ['Rio', 'Forte', 'Seltos', 'Sportage', 'Sorento', 'Soul', 'Carnival', 'Niro'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'MX-5'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5', 'X6'],
  'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE', 'GLB'],
  Audi: ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', 'Q7'],
  Jeep: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator'],
  Dodge: ['Attitude', 'Charger', 'Challenger', 'Durango', 'Journey'],
  Ram: ['1500', '2500', '700', 'ProMaster'],
  GMC: ['Terrain', 'Acadia', 'Sierra', 'Yukon', 'Canyon'],
  Suzuki: ['Swift', 'Vitara', 'S-Cross', 'Jimny', 'Ignis', 'Ertiga'],
  Mitsubishi: ['Lancer', 'Mirage', 'Outlander', 'Montero Sport', 'Xpander', 'L200'],
  Subaru: ['Impreza', 'Legacy', 'Forester', 'Outback', 'XV', 'Crosstrek'],
  Renault: ['Kwid', 'Logan', 'Duster', 'Captur', 'Oroch', 'Koleos', 'Stepway'],
  Peugeot: ['208', '2008', '3008', '5008', '301', 'Partner'],
  Seat: ['Ibiza', 'León', 'Arona', 'Ateca', 'Tarraco'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  BYD: ['Dolphin', 'Seal', 'Song Plus', 'Yuan Plus', 'Han', 'Tang'],
  MG: ['MG3', 'MG5', 'ZS', 'HS', 'RX5', 'One'],
  Chirey: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5'],
  JAC: ['E10X', 'Sei 2', 'Sei 4', 'T8', 'Frison'],
  Otro: [],
}

export function modelsForBrand(brand: string) {
  const key = Object.keys(CAR_MODELS).find((b) => b.toLowerCase() === brand.trim().toLowerCase())
  return key ? CAR_MODELS[key] : []
}

export function normalizeBrand(brand: string) {
  const key = CAR_BRANDS.find((b) => b.toLowerCase() === brand.trim().toLowerCase())
  return key || brand.trim()
}
