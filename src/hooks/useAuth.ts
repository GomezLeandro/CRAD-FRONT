import { useEffect, useState, useCallback } from 'react';
import { obtenerPerfilActual, onAuthStateChange } from '../services/authService';
import type { Profile } from '../types/domain';

interface AuthCoreState {
  profile: Profile | null;
  loading: boolean;
}

interface AuthState extends AuthCoreState {
  /** Vuelve a pedir el perfil (por ejemplo, después de cambiar el avatar o el nombre desde "Mi perfil"). */
  refresh: () => Promise<void>;
}

/**
 * Único lugar de la app que sabe "quién está logueado y con qué rol".
 * Los componentes consumen este hook — nunca llaman a authService
 * directamente para saber el estado de sesión.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthCoreState>({ profile: null, loading: true });

  const refresh = useCallback(async () => {
    const result = await obtenerPerfilActual();
    setState({ profile: result.ok ? result.data : null, loading: false });
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = onAuthStateChange(refresh);
    return unsubscribe;
  }, [refresh]);

  return { ...state, refresh };
}
