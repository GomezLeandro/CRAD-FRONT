import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  listarPerfiles,
  actualizarRolPerfil,
  invitarUsuario,
  resetearPasswordGenerica,
  eliminarUsuario,
} from '../../services/authService';
import type { Profile, UserRole } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

const PASSWORD_GENERICA = 'Crad2026$';

export function UsuariosAdminPage() {
  const { profile: propio } = useAuth();
  const [perfiles, setPerfiles] = useState<Profile[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState('');
  const [blanqueandoId, setBlanqueandoId] = useState<string | null>(null);
  const [blanqueado, setBlanqueado] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

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

  async function blanquearPassword(p: Profile) {
    const confirmado = window.confirm(
      `¿Blanquear la contraseña de ${p.nombre}? Va a poder entrar con "${PASSWORD_GENERICA}" y después la puede cambiar desde su perfil.`
    );
    if (!confirmado) return;

    setBlanqueandoId(p.id);
    setBlanqueado(null);
    setError('');
    const result = await resetearPasswordGenerica(p.id);
    setBlanqueandoId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setBlanqueado(p.id);
  }

  async function eliminar(p: Profile) {
    const confirmado = window.confirm(
      `¿Borrar a ${p.nombre}? Pierde el acceso al panel de inmediato. Esto no se puede deshacer.`
    );
    if (!confirmado) return;

    setEliminandoId(p.id);
    setError('');
    const result = await eliminarUsuario(p.id);
    setEliminandoId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviado('');
    setEnviando(true);

    const result = await invitarUsuario(nombre, email, role);

    setEnviando(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setEnviado(`Le enviamos una invitación por email a ${email}.`);
    setNombre('');
    setEmail('');
    setRole('admin');
  }

  return (
    <div>
      <h1 className={styles.title}>Usuarios del panel</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="role">Rol</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}
        {enviado && <p style={{ fontSize: 13, color: 'var(--navy)' }}>{enviado}</p>}

        <button type="submit" className="btn btn-navy" disabled={enviando}>
          {enviando ? 'Enviando invitación...' : 'Invitar usuario'}
        </button>
      </form>

      <div className={styles.list}>
        {perfiles.map((p) => (
          <div key={p.id} className={styles.row}>
            <div>
              <strong>{p.nombre}</strong>
              <p className={styles.sub}>
                {p.role}
                {blanqueado === p.id && ' · contraseña blanqueada'}
              </p>
            </div>
            <select
              value={p.role}
              onChange={(e) => cambiarRol(p.id, e.target.value as UserRole)}
            >
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <button
              className={styles.toggle}
              disabled={blanqueandoId === p.id}
              onClick={() => blanquearPassword(p)}
            >
              {blanqueandoId === p.id ? 'Blanqueando...' : 'Blanquear contraseña'}
            </button>
            {p.id !== propio?.id && (
              <button
                className={styles.deleteBtn}
                disabled={eliminandoId === p.id}
                onClick={() => eliminar(p)}
              >
                {eliminandoId === p.id ? 'Borrando...' : 'Eliminar usuario'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
