import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { crearTurno } from '../../services/turnosService';
import { nuevoTurnoSchema } from '../../lib/validation';
import styles from './BookingModal.module.css';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  rubro: string;
}

const HORARIOS = ['09:00', '11:30', '15:00', '17:30'];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function BookingModal({ open, onClose, rubro }: BookingModalProps) {
  const [problema, setProblema] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [fecha, setFecha] = useState('');
  const [horario, setHorario] = useState(HORARIOS[0]);
  // Honeypot: un input real en el DOM, invisible para una persona,
  // que los bots de autocompletado sí suelen rellenar.
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setProblema('');
    setDireccion('');
    setContacto('');
    setFecha('');
    setHorario(HORARIOS[0]);
    setWebsite('');
    setStatus('idle');
    setErrorMsg('');
    setFieldErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const input = { rubro, problema, direccion, contacto, fecha, horario, urgente: false, website };
    const parsed = nuevoTurnoSchema.safeParse(input);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setStatus('submitting');
    const result = await crearTurno(input);

    if (!result.ok) {
      setStatus('error');
      setErrorMsg(result.error.message);
      return;
    }

    setStatus('success');
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth={520} labelledBy="booking-title">
      <div className={styles.wrap}>
        <div className="eyebrow">
          <span className="rule" />
          <span>{rubro.toUpperCase()}</span>
        </div>
        <h2 id="booking-title" className={styles.title}>
          Contanos qué necesitás
        </h2>

        {status === 'success' ? (
          <div className={styles.success}>
            <p>
              <strong>¡Listo!</strong> Recibimos tu solicitud. Te vamos a contactar para
              confirmar el turno.
            </p>
            <button className="btn btn-navy" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Honeypot anti-bot: oculto visualmente, tabIndex -1, autoComplete off */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="website">No completar este campo</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="problema">Describí el problema</label>
              <textarea
                id="problema"
                rows={5}
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                placeholder="Describí el problema (ej: se tapó la pileta de la cocina y pierde agua por abajo)"
              />
              {fieldErrors.problema && <p className="error">{fieldErrors.problema}</p>}
            </div>

            <div className="field">
              <label htmlFor="direccion">Dirección del trabajo</label>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle y número, San Martín"
              />
              {fieldErrors.direccion && <p className="error">{fieldErrors.direccion}</p>}
            </div>

            <div className="field">
              <label htmlFor="contacto">Teléfono o email</label>
              <input
                id="contacto"
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Tu teléfono o email"
              />
              {fieldErrors.contacto && <p className="error">{fieldErrors.contacto}</p>}
            </div>

            <div className={styles.row}>
              <div className="field">
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFecha(e.target.value)}
                />
                {fieldErrors.fecha && <p className="error">{fieldErrors.fecha}</p>}
              </div>
              <div className="field">
                <label htmlFor="horario">Horario</label>
                <select id="horario" value={horario} onChange={(e) => setHorario(e.target.value)}>
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>
                      {h} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.urgencyNote}>
              <span>¿Es urgente?</span> No pidas turno — llamanos directo al{' '}
              <a href="tel:+5491122370857">+54 9 11 2237-0857</a>
            </div>

            {status === 'error' && <p className="error">{errorMsg}</p>}

            <button type="submit" className="btn btn-navy" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Enviando...' : 'Confirmar turno'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
