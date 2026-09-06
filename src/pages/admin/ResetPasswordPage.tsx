import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { actualizarPassword } from '../../services/authService';
import { BuildingBlueprint } from '../../components/icons/BuildingBlueprint';
import styles from './LoginPage.module.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const result = await actualizarPassword(password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDone(true);
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
        {done ? (
          <div className={styles.card}>
            <h1 className={styles.title}>Contraseña actualizada</h1>
            <p className={styles.subtitle}>Ya podés ingresar con tu nueva contraseña.</p>
            <button
              type="button"
              className="btn btn-navy"
              onClick={() => navigate('/admin/login', { replace: true })}
            >
              Ir a ingresar
            </button>
          </div>
        ) : (
          <form className={styles.card} onSubmit={handleSubmit} noValidate>
            <h1 className={styles.title}>Elegí una nueva contraseña</h1>
            <p className={styles.subtitle}>
              Ingresá y confirmá tu nueva contraseña de administrador.
            </p>

            <div className="field">
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-navy" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
