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

    const result = await crearServicio({
      nombre,
      rubroKey,
      descripcion,
      iconoUrl,
      orden: servicios.length,
      activo: true,
    });

    setGuardando(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setNombre('');
    setRubroKey('');
    setDescripcion('');
    setIconoFile(null);
    cargar();
  }

  async function guardarCampo(s: Servicio, campo: 'nombre' | 'rubroKey' | 'descripcion', valor: string) {
    if (valor === s[campo]) return;
    setError('');
    const result = await actualizarServicio(s.id, { [campo]: valor });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
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
    const result = await actualizarServicio(s.id, { iconoUrl: subida.data });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function toggleActivo(s: Servicio) {
    setError('');
    const result = await actualizarServicio(s.id, { activo: !s.activo });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function eliminar(id: string) {
    if (!window.confirm('¿Borrar este servicio? No se puede deshacer.')) return;
    setError('');
    const result = await eliminarServicio(id);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
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
          <div key={s.id} className={styles.itemCard}>
            <div className={styles.itemMain}>
              <div className={styles.itemMediaIcon}>
                {s.iconoUrl ? <img src={s.iconoUrl} alt="" /> : '—'}
              </div>
              <div className={styles.itemFields}>
                <div className="field">
                  <label>Nombre</label>
                  <input defaultValue={s.nombre} onBlur={(e) => guardarCampo(s, 'nombre', e.target.value)} />
                </div>
                <div className="field">
                  <label>Rubro (clave)</label>
                  <input
                    defaultValue={s.rubroKey}
                    onBlur={(e) => guardarCampo(s, 'rubroKey', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Descripción</label>
                  <textarea
                    defaultValue={s.descripcion}
                    rows={2}
                    onBlur={(e) => guardarCampo(s, 'descripcion', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className={styles.itemActions}>
              <label className={styles.linkBtn}>
                Cambiar ícono
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => cambiarIcono(s, e)}
                  style={{ display: 'none' }}
                />
              </label>
              <div className={styles.itemActionsRight}>
                <button className={styles.toggle} onClick={() => toggleActivo(s)}>
                  {s.activo ? 'Ocultar' : 'Publicar'}
                </button>
                <button className={styles.deleteBtn} onClick={() => eliminar(s.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
