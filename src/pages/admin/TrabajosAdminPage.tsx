import { useEffect, useState, type FormEvent } from 'react';
import {
  listarTrabajosAdmin,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
} from '../../services/trabajosService';
import type { Trabajo } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function TrabajosAdminPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [titulo, setTitulo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  async function cargar() {
    const r = await listarTrabajosAdmin();
    if (r.ok) setTrabajos(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await crearTrabajo({
      titulo,
      ubicacion,
      descripcion,
      imagenUrl: null,
      orden: trabajos.length,
      activo: true,
    });
    setTitulo('');
    setUbicacion('');
    setDescripcion('');
    cargar();
  }

  async function toggleActivo(t: Trabajo) {
    await actualizarTrabajo(t.id, { activo: !t.activo });
    cargar();
  }

  async function eliminar(id: string) {
    await eliminarTrabajo(id);
    cargar();
  }

  return (
    <div>
      <h1 className={styles.title}>Trabajos (portfolio)</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label htmlFor="titulo">Título</label>
          <input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="ubicacion">Ubicación</label>
          <input id="ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-navy">
          Agregar trabajo
        </button>
      </form>

      <div className={styles.list}>
        {trabajos.map((t) => (
          <div key={t.id} className={styles.row}>
            <div>
              <strong>{t.titulo}</strong>
              <p className={styles.sub}>{t.ubicacion}</p>
            </div>
            <button className={styles.toggle} onClick={() => toggleActivo(t)}>
              {t.activo ? 'Ocultar' : 'Publicar'}
            </button>
            <button className={styles.deleteBtn} onClick={() => eliminar(t.id)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
