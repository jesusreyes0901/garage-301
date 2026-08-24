export function BrandLogo({
  height = 56,
  className = '',
}: {
  height?: number
  className?: string
}) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src="/logo-garage-301.png"
      alt="Garaje 301"
      style={{ height, width: 'auto' }}
    />
  )
}
