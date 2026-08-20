import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/domain';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, solo estos roles pueden pasar. Si no, alcanza con estar logueado. */
  allowedRoles?: UserRole[];
}

/**
 * Gate de rutas en el frontend. IMPORTANTE: esto es UX, no seguridad
 * real — un usuario podría saltarse este componente editando el JS del
 * navegador. La seguridad real vive en las políticas RLS de Postgres,
 * que rechazan la operación en la base pase lo que pase acá (ver
 * /supabase/policies.sql). Este componente solo evita que alguien sin
 * permisos vea pantallas que de todas formas no van a poder usar.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <p role="status">Verificando sesión…</p>;
  }

  if (!profile) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
