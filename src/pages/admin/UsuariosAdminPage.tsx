import { useEffect, useState } from 'react';
import { listarPerfiles, actualizarRolPerfil } from '../../services/authService';
import type { Profile, UserRole } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function UsuariosAdminPage() {
  const [perfiles, setPerfiles] = useState<Profile[]>([]);

  async function cargar() {
    const r = await listarPerfiles();
    if (r.ok) setPerfiles(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarRol(id: string, role: UserRole) {
    await actualizarRolPerfil(id, role);
    cargar();
  }

  return (
    <div>
      <h1 className={styles.title}>Usuarios del panel</h1>
      <p style={{ fontSize: 13, color: 'var(--steel)', marginBottom: 20, maxWidth: 560 }}>
        Para dar de alta un usuario nuevo, invitalo desde el dashboard de Supabase (Authentication →
        Users) o corré la Edge Function de invitación — por seguridad, esa operación no se puede
        hacer desde el navegador (ver README).
      </p>
      <div className={styles.list}>
        {perfiles.map((p) => (
          <div key={p.id} className={styles.row}>
            <div>
              <strong>{p.nombre}</strong>
              <p className={styles.sub}>{p.role}</p>
            </div>
            <select
              value={p.role}
              onChange={(e) => cambiarRol(p.id, e.target.value as UserRole)}
            >
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
