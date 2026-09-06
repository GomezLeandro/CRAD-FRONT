import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  listarServiciosAdmin,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  subirIconoServicio,
} from '../../services/serviciosService';
import type { Servicio } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function ServiciosAdminPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [nombre, setNombre] = useState('');
  const [rubroKey, setRubroKey] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [iconoFile, setIconoFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    const r = await listarServiciosAdmin();
    if (r.ok) setServicios(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);

    let iconoUrl: string | null = null;
    if (iconoFile) {
      const subida = await subirIconoServicio(iconoFile);
      if (!subida.ok) {
        setGuardando(false);
        setError(subida.error.message);
        return;
      }
      iconoUrl = subida.data;
    }

    await crearServicio({
      nombre,
      rubroKey,
      descripcion,
      iconoUrl,
      orden: servicios.length,
      activo: true,
    });

    setGuardando(false);
    setNombre('');
    setRubroKey('');
    setDescripcion('');
    setIconoFile(null);
    cargar();
  }

  async function guardar(s: Servicio, descripcion: string) {
    await actualizarServicio(s.id, { descripcion });
    cargar();
  }

  async function cambiarIcono(s: Servicio, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    const subida = await subirIconoServicio(file);
    if (!subida.ok) {
      setError(subida.error.message);
      return;
    }
    await actualizarServicio(s.id, { iconoUrl: subida.data });
    cargar();
  }

  async function toggleActivo(s: Servicio) {
    await actualizarServicio(s.id, { activo: !s.activo });
    cargar();
  }

  async function eliminar(id: string) {
    await eliminarServicio(id);
    cargar();
  }

  return (
    <div>
      <h1 className={styles.title}>Servicios</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="rubroKey">Rubro (clave)</label>
          <input
            id="rubroKey"
            value={rubroKey}
            onChange={(e) => setRubroKey(e.target.value)}
            placeholder="ej: plomeria"
            required
          />
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
        <div className="field">
          <label htmlFor="icono">Ícono (imagen)</label>
          <input
            id="icono"
            type="file"
            accept="image/*"
            onChange={(e) => setIconoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-navy" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar servicio'}
        </button>
      </form>

      <div className={styles.list}>
        {servicios.map((s) => (
          <div key={s.id} className={styles.row}>
            {s.iconoUrl && (
              <img src={s.iconoUrl} alt="" width={34} height={34} style={{ objectFit: 'contain' }} />
            )}
            <div>
              <strong>{s.nombre}</strong>
              <textarea
                defaultValue={s.descripcion}
                rows={2}
                onBlur={(e) => {
                  if (e.target.value !== s.descripcion) guardar(s, e.target.value);
                }}
              />
              <label className={styles.sub} style={{ cursor: 'pointer', display: 'inline-block' }}>
                Cambiar ícono
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => cambiarIcono(s, e)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <button className={styles.toggle} onClick={() => toggleActivo(s)}>
              {s.activo ? 'Ocultar' : 'Publicar'}
            </button>
            <button className={styles.deleteBtn} onClick={() => eliminar(s.id)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
