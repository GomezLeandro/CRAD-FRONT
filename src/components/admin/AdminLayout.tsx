import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';
import { contarMensajesNoLeidos } from '../../services/mensajesService';
import { contarSolicitudesObraNoLeidas } from '../../services/solicitudesObraService';
import styles from './AdminLayout.module.css';

/** Cada cuánto se refresca el conteo de no leídos en el sidebar. */
const POLL_MS = 30_000;

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className={styles.badge}>{count > 99 ? '99+' : count}</span>;
}

export function AdminLayout() {
  const { profile } = useAuth();
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [obraNoLeidas, setObraNoLeidas] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function refrescar() {
      const [mensajes, obra] = await Promise.all([
        contarMensajesNoLeidos(),
        contarSolicitudesObraNoLeidas(),
      ]);
      if (cancelado) return;
      if (mensajes.ok) setMensajesNoLeidos(mensajes.data);
      if (obra.ok) setObraNoLeidas(obra.data);
    }

    refrescar();
    const interval = setInterval(refrescar, POLL_MS);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>CRAD Admin</div>
        <nav className={styles.nav}>
          <NavLink to="/admin" end>
            Panel principal
          </NavLink>
          <NavLink to="/admin/turnos">Turnos</NavLink>
          <NavLink to="/admin/mensajes">
            Mensajes <NavBadge count={mensajesNoLeidos} />
          </NavLink>
          <NavLink to="/admin/solicitudes-obra">
            Solicitudes de obra <NavBadge count={obraNoLeidas} />
          </NavLink>
          <NavLink to="/admin/facturas">Facturación</NavLink>
          {profile?.role === 'superadmin' && (
            <>
              <div className={styles.divider}>Superadmin</div>
              <NavLink to="/admin/trabajos">Trabajos</NavLink>
              <NavLink to="/admin/servicios">Servicios</NavLink>
              <NavLink to="/admin/usuarios">Usuarios</NavLink>
            </>
          )}
        </nav>
        <div className={styles.footer}>
          <Link to="/admin/perfil" className={styles.userLink}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className={styles.avatar} />
            ) : (
              <span className={styles.avatarInitials}>
                {(profile?.nombre ?? '?')
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('')}
              </span>
            )}
            <span className={styles.userInfo}>
              {profile?.nombre} · <span>{profile?.role}</span>
            </span>
          </Link>
          <button className={styles.logoutBtn} onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
