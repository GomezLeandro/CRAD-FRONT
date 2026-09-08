import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { crearTurno, listarHorariosOcupados } from '../../services/turnosService';
import { nuevoTurnoSchema } from '../../lib/validation';
import styles from './BookingModal.module.css';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  rubro: string;
}

const HORARIOS = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`);

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function BookingModal({ open, onClose, rubro }: BookingModalProps) {
  const [problema, setProblema] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [fecha, setFecha] = useState('');
  const [horario, setHorario] = useState(HORARIOS[0]);
  const [ocupados, setOcupados] = useState<string[]>([]);
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
    setOcupados([]);
    setWebsite('');
    setStatus('idle');
    setErrorMsg('');
    setFieldErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  useEffect(() => {
    if (!fecha) {
      setOcupados([]);
      return;
    }
    let cancelado = false;
    listarHorariosOcupados(fecha).then((result) => {
      if (cancelado) return;
      if (result.ok) setOcupados(result.data);
    });
    return () => {
      cancelado = true;
    };
  }, [fecha]);

  useEffect(() => {
    if (ocupados.includes(horario)) {
      const libre = HORARIOS.find((h) => !ocupados.includes(h));
      if (libre) setHorario(libre);
    }
  }, [ocupados, horario]);

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
              <label htmlFor="booking-contacto">Teléfono o email</label>
              <input
                id="booking-contacto"
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Tu teléfono o email"
              />
              {fieldErrors.contacto && <p className="error">{fieldErrors.contacto}</p>}
            </div>

            <div className="field">
              <label htmlFor="fecha">Fecha</label>
              <input
                id="fecha"
                type="date"
                lang="es-AR"
                value={fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFecha(e.target.value)}
              />
              {fieldErrors.fecha && <p className="error">{fieldErrors.fecha}</p>}
            </div>

            <div className="field">
              <label id="horario-label">Horario</label>
              <div className={styles.horarios} role="group" aria-labelledby="horario-label">
                {HORARIOS.map((h) => {
                  const tomado = ocupados.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      className={styles.slot}
                      data-tomado={tomado}
                      aria-pressed={horario === h}
                      aria-label={tomado ? `${h} hs, ocupado` : `${h} hs`}
                      disabled={tomado}
                      onClick={() => setHorario(h)}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              {fecha && (
                <p className={styles.horariosHint}>
                  <span className={styles.legendDot} /> Ocupado
                </p>
              )}
            </div>

            <div className={styles.urgencyNote}>
              <span>¿Es urgente?</span> No pidas turno — llamanos directo al{' '}
              <a href="tel:+5491172869207">+54 9 11 7286-9207</a>
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
