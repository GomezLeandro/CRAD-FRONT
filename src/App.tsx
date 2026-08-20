import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { TurnosPage } from './pages/admin/TurnosPage';
import { MensajesPage } from './pages/admin/MensajesPage';
import { FacturasPage } from './pages/admin/FacturasPage';
import { TrabajosAdminPage } from './pages/admin/TrabajosAdminPage';
import { ServiciosAdminPage } from './pages/admin/ServiciosAdminPage';
import { UsuariosAdminPage } from './pages/admin/UsuariosAdminPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="turnos" element={<TurnosPage />} />
          <Route path="mensajes" element={<MensajesPage />} />
          <Route path="facturas" element={<FacturasPage />} />
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
