import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  listarTrabajosAdmin,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
  subirFotoTrabajo,
} from '../../services/trabajosService';
import type { Trabajo } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function TrabajosAdminPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [titulo, setTitulo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    const r = await listarTrabajosAdmin();
    if (r.ok) setTrabajos(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);

    let imagenUrl: string | null = null;
    if (fotoFile) {
      const subida = await subirFotoTrabajo(fotoFile);
      if (!subida.ok) {
        setGuardando(false);
        setError(subida.error.message);
        return;
      }
      imagenUrl = subida.data;
    }

    const result = await crearTrabajo({
      titulo,
      ubicacion,
      descripcion,
      imagenUrl,
      orden: trabajos.length,
      activo: true,
    });

    setGuardando(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setTitulo('');
    setUbicacion('');
    setDescripcion('');
    setFotoFile(null);
    cargar();
  }

  async function guardarCampo(t: Trabajo, campo: 'titulo' | 'ubicacion' | 'descripcion', valor: string) {
    if (valor === t[campo]) return;
    setError('');
    const result = await actualizarTrabajo(t.id, { [campo]: valor });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function cambiarFoto(t: Trabajo, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    const subida = await subirFotoTrabajo(file);
    if (!subida.ok) {
      setError(subida.error.message);
      return;
    }
    const result = await actualizarTrabajo(t.id, { imagenUrl: subida.data });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function toggleActivo(t: Trabajo) {
    setError('');
    const result = await actualizarTrabajo(t.id, { activo: !t.activo });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    cargar();
  }

  async function eliminar(id: string) {
    if (!window.confirm('¿Borrar este trabajo del portfolio? No se puede deshacer.')) return;
    setError('');
    const result = await eliminarTrabajo(id);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
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
        <div className="field">
          <label htmlFor="foto">Foto</label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-navy" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar trabajo'}
        </button>
      </form>

      <div className={styles.list}>
        {trabajos.map((t) => (
          <div key={t.id} className={styles.itemCard}>
            <div className={styles.itemMain}>
              <div className={styles.itemMediaPhoto}>
                {t.imagenUrl ? <img src={t.imagenUrl} alt="" /> : '—'}
              </div>
              <div className={styles.itemFields}>
                <div className="field">
                  <label>Título</label>
                  <input defaultValue={t.titulo} onBlur={(e) => guardarCampo(t, 'titulo', e.target.value)} />
                </div>
                <div className="field">
                  <label>Ubicación</label>
                  <input
                    defaultValue={t.ubicacion}
                    onBlur={(e) => guardarCampo(t, 'ubicacion', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Descripción</label>
                  <textarea
                    defaultValue={t.descripcion}
                    rows={2}
                    onBlur={(e) => guardarCampo(t, 'descripcion', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className={styles.itemActions}>
              <label className={styles.linkBtn}>
                Cambiar foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => cambiarFoto(t, e)}
                  style={{ display: 'none' }}
                />
              </label>
              <div className={styles.itemActionsRight}>
                <button className={styles.toggle} onClick={() => toggleActivo(t)}>
                  {t.activo ? 'Ocultar' : 'Publicar'}
                </button>
                <button className={styles.deleteBtn} onClick={() => eliminar(t.id)}>
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
