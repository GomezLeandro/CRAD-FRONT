import { useEffect, useState } from 'react';
import { listarServiciosAdmin, actualizarServicio } from '../../services/serviciosService';
import type { Servicio } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function ServiciosAdminPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);

  async function cargar() {
    const r = await listarServiciosAdmin();
    if (r.ok) setServicios(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar(s: Servicio, descripcion: string) {
    await actualizarServicio(s.id, { descripcion });
    cargar();
  }

  async function toggleActivo(s: Servicio) {
    await actualizarServicio(s.id, { activo: !s.activo });
    cargar();
  }

  return (
    <div>
      <h1 className={styles.title}>Servicios</h1>
      <div className={styles.list}>
        {servicios.map((s) => (
          <div key={s.id} className={styles.row}>
            <div>
              <strong>{s.nombre}</strong>
              <textarea
                defaultValue={s.descripcion}
                rows={2}
                onBlur={(e) => {
                  if (e.target.value !== s.descripcion) guardar(s, e.target.value);
                }}
              />
            </div>
            <button className={styles.toggle} onClick={() => toggleActivo(s)}>
              {s.activo ? 'Ocultar' : 'Publicar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
