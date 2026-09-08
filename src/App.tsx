import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/admin/LoginPage';
import { ResetPasswordPage } from './pages/admin/ResetPasswordPage';
import { TurnosPage } from './pages/admin/TurnosPage';
import { MensajesPage } from './pages/admin/MensajesPage';
import { SolicitudesObraPage } from './pages/admin/SolicitudesObraPage';
import { FacturasPage } from './pages/admin/FacturasPage';
import { TrabajosAdminPage } from './pages/admin/TrabajosAdminPage';
import { ServiciosAdminPage } from './pages/admin/ServiciosAdminPage';
import { UsuariosAdminPage } from './pages/admin/UsuariosAdminPage';
import { GastosAdminPage } from './pages/admin/GastosAdminPage';
import { FinanzasDashboardPage } from './pages/admin/FinanzasDashboardPage';
import { PerfilPage } from './pages/admin/PerfilPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FinanzasDashboardPage />} />
          <Route path="turnos" element={<TurnosPage />} />
          <Route path="mensajes" element={<MensajesPage />} />
          <Route path="solicitudes-obra" element={<SolicitudesObraPage />} />
          <Route path="facturas" element={<FacturasPage />} />
          <Route path="gastos" element={<GastosAdminPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route
            path="trabajos"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <TrabajosAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="servicios"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <ServiciosAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <UsuariosAdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
