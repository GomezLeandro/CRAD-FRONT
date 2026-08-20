import { useEffect, useState } from 'react';
import { listarMensajes, marcarMensajeLeido } from '../../services/mensajesService';
import type { Mensaje } from '../../types/domain';
import styles from './MensajesPage.module.css';

export function MensajesPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarMensajes().then((r) => {
      if (r.ok) setMensajes(r.data);
      setLoading(false);
    });
  }, []);

  async function toggleLeido(m: Mensaje) {
    const result = await marcarMensajeLeido(m.id, !m.leido);
    if (result.ok) {
      setMensajes((prev) => prev.map((x) => (x.id === m.id ? result.data : x)));
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Mensajes</h1>
      {loading && <p>Cargando…</p>}
      {!loading && mensajes.length === 0 && <p>No hay mensajes todavía.</p>}
      <div className={styles.list}>
        {mensajes.map((m) => (
          <article key={m.id} className={`${styles.card} ${m.leido ? styles.leido : ''}`}>
            <div className={styles.head}>
              <strong>{m.nombre}</strong>
              <span>{m.contacto}</span>
            </div>
            <p>{m.mensaje}</p>
            <button className={styles.toggle} onClick={() => toggleLeido(m)}>
              {m.leido ? 'Marcar como no leído' : 'Marcar como leído'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
