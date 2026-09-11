import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminApp } from './paginas/admin/AdminApp'
import { Publica } from './paginas/Publica'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Publica />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Publica />} />
      </Routes>
    </BrowserRouter>
  )
}
