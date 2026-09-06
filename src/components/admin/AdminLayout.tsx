import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const { profile } = useAuth();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>CRAD Admin</div>
        <nav className={styles.nav}>
          <NavLink to="/admin" end>
            Panel principal
          </NavLink>
          <NavLink to="/admin/turnos">Turnos</NavLink>
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
