import type { ReactNode } from 'react'

interface NodoLista {
  tipo: 'ul' | 'ol'
  texto: string
  hijos: NodoLista[]
}

const ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/

function conNegritas(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-semibold text-blanco">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      parte
    ),
  )
}

function parsearLista(lineas: string[]): NodoLista[] {
  const raices: NodoLista[] = []
  const pila: { sangria: number; nodo: NodoLista }[] = []

  for (const linea of lineas) {
    const coincidencia = linea.match(ITEM)
    if (!coincidencia) continue

    const sangria = coincidencia[1].length
    const nodo: NodoLista = {
      tipo: coincidencia[2] === '-' || coincidencia[2] === '*' ? 'ul' : 'ol',
      texto: coincidencia[3],
      hijos: [],
    }

    while (pila.length > 0 && pila[pila.length - 1].sangria >= sangria) pila.pop()
    if (pila.length === 0) raices.push(nodo)
    else pila[pila.length - 1].nodo.hijos.push(nodo)
    pila.push({ sangria, nodo })
  }

  return raices
}

function Lista({ nodos }: { nodos: NodoLista[] }) {
  const ordenada = nodos[0]?.tipo === 'ol'
  const clases = `my-3 space-y-1.5 pl-5 text-bruma marker:text-cian/80 ${
    ordenada ? 'list-decimal' : 'list-disc'
  }`
  const items = nodos.map((nodo, i) => (
    <li key={i} className="leading-relaxed">
      {conNegritas(nodo.texto)}
      {nodo.hijos.length > 0 && <Lista nodos={nodo.hijos} />}
    </li>
  ))

  return ordenada ? <ol className={clases}>{items}</ol> : <ul className={clases}>{items}</ul>
}

export function MarkdownLegal({ contenido }: { contenido: string }) {
  const lineas = contenido.replace(/\r\n/g, '\n').split('\n')
  const bloques: ReactNode[] = []
  let parrafo: string[] = []
  let i = 0

  const cerrarParrafo = () => {
    if (parrafo.length === 0) return
    bloques.push(
      <p key={`p-${bloques.length}`} className="my-3 leading-relaxed text-bruma">
        {conNegritas(parrafo.join(' '))}
      </p>,
    )
    parrafo = []
  }

  while (i < lineas.length) {
    const linea = lineas[i]

    if (linea.trim() === '') {
      cerrarParrafo()
      i++
      continue
    }

    if (linea.startsWith('# ')) {
      cerrarParrafo()
      bloques.push(
        <h1 key={`h1-${bloques.length}`} className="text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
          {conNegritas(linea.slice(2))}
        </h1>,
      )
      i++
      continue
    }

    if (linea.startsWith('## ')) {
      cerrarParrafo()
      bloques.push(
        <h2 key={`h2-${bloques.length}`} className="mt-8 text-xl font-semibold text-blanco">
          {conNegritas(linea.slice(3))}
        </h2>,
      )
      i++
      continue
    }

    if (ITEM.test(linea)) {
      cerrarParrafo()
      const inicio = i
      while (i < lineas.length && ITEM.test(lineas[i])) i++
      bloques.push(
        <Lista key={`lista-${bloques.length}`} nodos={parsearLista(lineas.slice(inicio, i))} />,
      )
      continue
    }

    parrafo.push(linea)
    i++
  }

  cerrarParrafo()

  return <div>{bloques}</div>
}
