import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, solicitarRecuperacionPassword } from '../../services/authService';
import { BuildingBlueprint } from '../../components/icons/BuildingBlueprint';
import styles from './LoginPage.module.css';

type Mode = 'login' | 'recover';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverError, setRecoverError] = useState('');
  const [recoverSent, setRecoverSent] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    navigate('/admin', { replace: true });
  }

  async function handleRecoverSubmit(e: FormEvent) {
    e.preventDefault();
    setRecoverError('');
    setRecoverLoading(true);

    const result = await solicitarRecuperacionPassword(recoverEmail);

    setRecoverLoading(false);
    if (!result.ok) {
      setRecoverError(result.error.message);
      return;
    }
    setRecoverSent(true);
  }

  function backToLogin() {
    setMode('login');
    setRecoverSent(false);
    setRecoverError('');
    setRecoverEmail('');
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.gridBg} aria-hidden="true" />
        <div className={styles.brandContent}>
          <BuildingBlueprint width={220} height={270} />
          <h2>CRAD</h2>
          <p>Construcciones y Reparaciones</p>
        </div>
      </aside>

      <div className={styles.formPanel}>
        {mode === 'login' ? (
          <form className={styles.card} onSubmit={handleSubmit} noValidate>
            <h1 className={styles.title}>Panel de administración</h1>
            <p className={styles.subtitle}>Ingresá con tu cuenta de administrador</p>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-navy" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button type="button" className={styles.linkBtn} onClick={() => setMode('recover')}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form className={styles.card} onSubmit={handleRecoverSubmit} noValidate>
            <h1 className={styles.title}>Recuperar contraseña</h1>
            <p className={styles.subtitle}>
              Ingresá tu email y te enviamos un enlace para restablecerla.
            </p>

            {recoverSent ? (
              <p className={styles.success}>
                Si el email existe, vas a recibir un enlace para restablecer tu contraseña.
              </p>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="recoverEmail">Email</label>
                  <input
                    id="recoverEmail"
                    type="email"
                    autoComplete="username"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    required
                  />
                </div>

                {recoverError && <p className="error">{recoverError}</p>}

                <button type="submit" className="btn btn-navy" disabled={recoverLoading}>
                  {recoverLoading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </>
            )}

            <button type="button" className={styles.linkBtn} onClick={backToLogin}>
              Volver a ingresar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
