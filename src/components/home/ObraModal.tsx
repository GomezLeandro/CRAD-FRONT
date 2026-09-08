import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { crearSolicitudObra, subirAdjuntoObra } from '../../services/solicitudesObraService';
import { nuevaSolicitudObraSchema, TIPOS_PROYECTO } from '../../lib/validation';
import styles from './ObraModal.module.css';

interface ObraModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_ADJUNTO_BYTES = 8 * 1024 * 1024;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ObraModal({ open, onClose }: ObraModalProps) {
  const [tipoProyecto, setTipoProyecto] = useState<string>(TIPOS_PROYECTO[0]);
  const [superficie, setSuperficie] = useState('');
  const [zona, setZona] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  // Honeypot: un input real en el DOM, invisible para una persona,
  // que los bots de autocompletado sí suelen rellenar.
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setTipoProyecto(TIPOS_PROYECTO[0]);
    setSuperficie('');
    setZona('');
    setDescripcion('');
    setArchivo(null);
    setNombre('');
    setContacto('');
    setWebsite('');
    setStatus('idle');
    setErrorMsg('');
    setFieldErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleFile(f: File | null) {
    if (f && f.size > MAX_ADJUNTO_BYTES) {
      setErrorMsg('El archivo no puede pesar más de 8 MB.');
      return;
    }
    setErrorMsg('');
    setArchivo(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const input = {
      tipoProyecto,
      superficie: superficie.trim() ? Number(superficie) : null,
      zona,
      descripcion,
      nombre,
      contacto,
      website,
    };
    const parsed = nuevaSolicitudObraSchema.safeParse(input);
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

    let archivoUrl: string | null = null;
    if (archivo) {
      const uploaded = await subirAdjuntoObra(archivo);
      if (!uploaded.ok) {
        setStatus('error');
        setErrorMsg('No pudimos subir el archivo adjunto. Probá de nuevo o enviá sin adjunto.');
        return;
      }
      archivoUrl = uploaded.data;
    }

    const result = await crearSolicitudObra({ ...parsed.data, archivoUrl });

    if (!result.ok) {
      setStatus('error');
      setErrorMsg(result.error.message);
      return;
    }

    setStatus('success');
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth={560} labelledBy="obra-title">
      <div className={styles.wrap}>
        <div className="eyebrow">
          <span className="rule" />
          <span>OBRA</span>
        </div>
        <h2 id="obra-title" className={styles.title}>
          Contanos tu proyecto
        </h2>

        {status === 'success' ? (
          <div className={styles.success}>
            <p>
              <strong>¡Listo!</strong> Recibimos tu solicitud. Te vamos a contactar para
              coordinar la visita de relevamiento.
            </p>
            <button className="btn btn-navy" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p className={styles.subtitle}>
              Dejanos el detalle y coordinamos una visita de relevamiento sin cargo.
            </p>

            {/* Honeypot anti-bot: oculto visualmente, tabIndex -1, autoComplete off */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="obra-website">No completar este campo</label>
              <input
                id="obra-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="tipoProyecto">Tipo de proyecto</label>
              <select
                id="tipoProyecto"
                value={tipoProyecto}
                onChange={(e) => setTipoProyecto(e.target.value)}
              >
                {TIPOS_PROYECTO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.row}>
              <div className="field">
                <label htmlFor="superficie">Superficie aproximada (m²)</label>
                <input
                  id="superficie"
                  type="number"
                  min="1"
                  value={superficie}
                  onChange={(e) => setSuperficie(e.target.value)}
                  placeholder="Ej: 120"
                />
                {fieldErrors.superficie && <p className="error">{fieldErrors.superficie}</p>}
              </div>
              <div className="field">
                <label htmlFor="zona">Zona del terreno</label>
                <input
                  id="zona"
                  type="text"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  placeholder="San Martín y alrededores"
                />
                {fieldErrors.zona && <p className="error">{fieldErrors.zona}</p>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="descripcion">Contanos brevemente el proyecto</label>
              <textarea
                id="descripcion"
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: casa de dos plantas sobre lote de 10x30, planta baja libre…"
              />
              {fieldErrors.descripcion && <p className="error">{fieldErrors.descripcion}</p>}
            </div>

            <div className="field">
              <label htmlFor="archivo">Planos o referencias (opcional)</label>
              <div
                className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0] ?? null);
                }}
              >
                <input
                  id="archivo"
                  type="file"
                  className={styles.dropzoneInput}
                  accept="image/*,.pdf"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <span>
                  {archivo ? archivo.name : 'Arrastrá archivos o hacé click para adjuntar'}
                </span>
              </div>
            </div>

            <div className={styles.row}>
              <div className="field">
                <label htmlFor="obra-nombre">Nombre y apellido</label>
                <input
                  id="obra-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
                {fieldErrors.nombre && <p className="error">{fieldErrors.nombre}</p>}
              </div>
              <div className="field">
                <label htmlFor="obra-contacto">WhatsApp o email</label>
                <input
                  id="obra-contacto"
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Cómo te contactamos"
                />
                {fieldErrors.contacto && <p className="error">{fieldErrors.contacto}</p>}
              </div>
            </div>

            {errorMsg && <p className="error">{errorMsg}</p>}

            <button type="submit" className="btn btn-navy" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
