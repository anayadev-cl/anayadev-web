import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminApp } from './paginas/admin/AdminApp'
import { PaginaCompra } from './paginas/PaginaCompra'
import { PaginaMiSolicitud } from './paginas/PaginaMiSolicitud'
import { Publica } from './paginas/Publica'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Publica />} />
        <Route path="/comprar" element={<PaginaCompra />} />
        <Route path="/mi-solicitud/:token" element={<PaginaMiSolicitud />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Publica />} />
      </Routes>
    </BrowserRouter>
  )
}
