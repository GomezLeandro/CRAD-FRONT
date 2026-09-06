import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

function renderWithRoute(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/admin/turnos']}>
      <Routes>
        <Route path="/admin/login" element={<p>Pantalla de login</p>} />
        <Route path="/admin" element={<p>Dashboard genérico</p>} />
        <Route path="/admin/turnos" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ProtectedRoute', () => {
  it('muestra un estado de carga mientras se resuelve la sesión', () => {
    useAuthMock.mockReturnValue({ profile: null, loading: true, refresh: vi.fn() });
    renderWithRoute(
      <ProtectedRoute>
        <p>Contenido protegido</p>
      </ProtectedRoute>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/verificando sesión/i);
  });

  it('redirige a login si no hay sesión', () => {
    useAuthMock.mockReturnValue({ profile: null, loading: false, refresh: vi.fn() });
    renderWithRoute(
      <ProtectedRoute>
        <p>Contenido protegido</p>
      </ProtectedRoute>
    );
    expect(screen.getByText(/pantalla de login/i)).toBeInTheDocument();
  });

  it('deja pasar a un admin cuando no se restringe por rol', () => {
    useAuthMock.mockReturnValue({
      profile: { id: '1', nombre: 'Ana', role: 'admin', createdAt: '', avatarUrl: null },
      loading: false,
      refresh: vi.fn(),
    });
    renderWithRoute(
      <ProtectedRoute>
        <p>Contenido protegido</p>
      </ProtectedRoute>
    );
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument();
  });

  it('bloquea a un admin en una ruta exclusiva de superadmin', () => {
    useAuthMock.mockReturnValue({
      profile: { id: '1', nombre: 'Ana', role: 'admin', createdAt: '', avatarUrl: null },
      loading: false,
      refresh: vi.fn(),
    });
    renderWithRoute(
      <ProtectedRoute allowedRoles={['superadmin']}>
        <p>Solo superadmin</p>
      </ProtectedRoute>
    );
    expect(screen.getByText(/dashboard genérico/i)).toBeInTheDocument();
    expect(screen.queryByText(/solo superadmin/i)).not.toBeInTheDocument();
  });

  it('deja pasar a un superadmin en una ruta exclusiva de superadmin', () => {
    useAuthMock.mockReturnValue({
      profile: { id: '1', nombre: 'Leandro', role: 'superadmin', createdAt: '', avatarUrl: null },
      loading: false,
      refresh: vi.fn(),
    });
    renderWithRoute(
      <ProtectedRoute allowedRoles={['superadmin']}>
        <p>Solo superadmin</p>
      </ProtectedRoute>
    );
    expect(screen.getByText(/solo superadmin/i)).toBeInTheDocument();
  });
});
