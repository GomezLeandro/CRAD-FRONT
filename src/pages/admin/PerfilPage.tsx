import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  actualizarAvatar,
  actualizarEmail,
  actualizarNombrePropio,
  actualizarPassword,
  obtenerEmailActual,
  subirAvatar,
} from '../../services/authService';
import styles from './PerfilPage.module.css';

export function PerfilPage() {
  const { profile, refresh } = useAuth();

  const [emailActual, setEmailActual] = useState('');
  const [nombre, setNombre] = useState('');
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [nombreGuardando, setNombreGuardando] = useState(false);
  const [nombreMensaje, setNombreMensaje] = useState('');
  const [nombreError, setNombreError] = useState('');

  const [emailNuevo, setEmailNuevo] = useState('');
  const [emailGuardando, setEmailGuardando] = useState(false);
  const [emailMensaje, setEmailMensaje] = useState('');
  const [emailError, setEmailError] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [passwordGuardando, setPasswordGuardando] = useState(false);
  const [passwordMensaje, setPasswordMensaje] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (profile) setNombre(profile.nombre);
  }, [profile]);

  useEffect(() => {
    obtenerEmailActual().then((r) => {
      if (r.ok) setEmailActual(r.data);
    });
  }, []);

  async function cambiarAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError('');
    setSubiendoAvatar(true);
    const subida = await subirAvatar(file);
    if (!subida.ok) {
      setSubiendoAvatar(false);
      setAvatarError(subida.error.message);
      return;
    }
    const guardado = await actualizarAvatar(subida.data);
    setSubiendoAvatar(false);
    if (!guardado.ok) {
      setAvatarError(guardado.error.message);
      return;
    }
    await refresh();
  }

  async function guardarNombre(e: FormEvent) {
    e.preventDefault();
    setNombreError('');
    setNombreMensaje('');
    setNombreGuardando(true);
    const result = await actualizarNombrePropio(nombre);
    setNombreGuardando(false);
    if (!result.ok) {
      setNombreError(result.error.message);
      return;
    }
    setNombreMensaje('Nombre actualizado.');
    await refresh();
  }

  async function guardarEmail(e: FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailMensaje('');
    setEmailGuardando(true);
    const result = await actualizarEmail(emailNuevo);
    setEmailGuardando(false);
    if (!result.ok) {
      setEmailError(result.error.message);
      return;
    }
    setEmailMensaje(`Te enviamos un email de confirmación a ${emailNuevo}. El cambio se aplica cuando lo confirmes.`);
    setEmailNuevo('');
  }

  async function guardarPassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMensaje('');

    if (password !== passwordConfirmar) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setPasswordGuardando(true);
    const result = await actualizarPassword(password);
    setPasswordGuardando(false);
    if (!result.ok) {
      setPasswordError(result.error.message);
      return;
    }
    setPasswordMensaje('Contraseña actualizada.');
    setPassword('');
    setPasswordConfirmar('');
  }

  const iniciales = (profile?.nombre ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div>
      <h1 className={styles.title}>Mi perfil</h1>

      <section className={styles.card}>
        <p className={styles.cardTitle}>Foto de perfil</p>
        <div className={styles.avatarRow}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarInitials}>{iniciales}</div>
          )}
          <label className={`${styles.avatarLabel} ${subiendoAvatar ? styles.avatarLabelDisabled : ''}`}>
            {subiendoAvatar ? 'Subiendo...' : 'Cambiar foto'}
            <input
              type="file"
              accept="image/*"
              onChange={cambiarAvatar}
              disabled={subiendoAvatar}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        {avatarError && <p className="error">{avatarError}</p>}
      </section>

      <section className={styles.card}>
        <p className={styles.cardTitle}>Nombre</p>
        <form onSubmit={guardarNombre} className={styles.form}>
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          {nombreError && <p className="error">{nombreError}</p>}
          {nombreMensaje && <p className={styles.success}>{nombreMensaje}</p>}
          <button type="submit" className="btn btn-navy" disabled={nombreGuardando}>
            {nombreGuardando ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <p className={styles.cardTitle}>Email</p>
        {emailActual && <p className={styles.currentValue}>Actual: {emailActual}</p>}
        <form onSubmit={guardarEmail} className={styles.form}>
          <div className="field">
            <label htmlFor="emailNuevo">Nuevo email</label>
            <input
              id="emailNuevo"
              type="email"
              value={emailNuevo}
              onChange={(e) => setEmailNuevo(e.target.value)}
              required
            />
          </div>
          {emailError && <p className="error">{emailError}</p>}
          {emailMensaje && <p className={styles.success}>{emailMensaje}</p>}
          <button type="submit" className="btn btn-navy" disabled={emailGuardando}>
            {emailGuardando ? 'Enviando...' : 'Cambiar email'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <p className={styles.cardTitle}>Contraseña</p>
        <form onSubmit={guardarPassword} className={styles.form}>
          <div className="field">
            <label htmlFor="password">Contraseña nueva</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="passwordConfirmar">Repetir contraseña</label>
            <input
              id="passwordConfirmar"
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {passwordError && <p className="error">{passwordError}</p>}
          {passwordMensaje && <p className={styles.success}>{passwordMensaje}</p>}
          <button type="submit" className="btn btn-navy" disabled={passwordGuardando}>
            {passwordGuardando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}
