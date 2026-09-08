import { useEffect, useState } from 'react';
import {
  listarSolicitudesObra,
  marcarSolicitudObraLeida,
} from '../../services/solicitudesObraService';
import type { SolicitudObra } from '../../types/domain';
import styles from './SolicitudesObraPage.module.css';

export function SolicitudesObraPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarSolicitudesObra().then((r) => {
      if (r.ok) setSolicitudes(r.data);
      setLoading(false);
    });
  }, []);

  async function toggleLeido(s: SolicitudObra) {
    const result = await marcarSolicitudObraLeida(s.id, !s.leido);
    if (result.ok) {
      setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? result.data : x)));
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Solicitudes de obra</h1>
      {loading && <p>Cargando…</p>}
      {!loading && solicitudes.length === 0 && <p>No hay solicitudes todavía.</p>}
      <div className={styles.list}>
        {solicitudes.map((s) => (
          <article key={s.id} className={`${styles.card} ${s.leido ? styles.leido : ''}`}>
            <div className={styles.head}>
              <strong>{s.tipoProyecto}</strong>
              <span>{new Date(s.createdAt).toLocaleDateString('es-AR')}</span>
            </div>
            <div className={styles.meta}>
              {s.superficie != null && <span>{s.superficie} m²</span>}
              <span>{s.zona}</span>
            </div>
            <p>{s.descripcion}</p>
            {s.archivoUrl && (
              <a href={s.archivoUrl} target="_blank" rel="noopener noreferrer" className={styles.adjunto}>
                Ver archivo adjunto
              </a>
            )}
            <div className={styles.contacto}>
              <strong>{s.nombre}</strong> · {s.contacto}
            </div>
            <button className={styles.toggle} onClick={() => toggleLeido(s)}>
              {s.leido ? 'Marcar como no leído' : 'Marcar como leído'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
