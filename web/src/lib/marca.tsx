export function NombreConZia({ nombre }: { nombre: string }) {
  const coincidencia = nombre.match(/^(.*)(zia)$/i)
  if (!coincidencia) return <>{nombre}</>
  return (
    <>
      {coincidencia[1]}
      <span className="texto-gradiente">{coincidencia[2]}</span>
    </>
  )
}
