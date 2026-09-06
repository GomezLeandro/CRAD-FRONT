import { useEffect, useState, type FormEvent } from 'react';
import { crearGasto, listarGastos, eliminarGasto } from '../../services/gastosService';
import { useAuth } from '../../hooks/useAuth';
import type { Gasto } from '../../types/domain';
import styles from './ContentAdminPage.module.css';

export function GastosAdminPage() {
  const { profile } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  async function cargar() {
    const r = await listarGastos();
    if (r.ok) setGastos(r.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const result = await crearGasto({
      concepto,
      categoria,
      monto: Number(monto),
      fecha,
    });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setConcepto('');
    setCategoria('');
    setMonto('');
    cargar();
  }

  async function eliminar(id: string) {
    await eliminarGasto(id);
    cargar();
  }

  return (
    <div>
      <h1 className={styles.title}>Gastos</h1>
      {profile?.role !== 'superadmin' && (
        <p style={{ fontSize: 13, color: 'var(--steel)', marginBottom: 20, maxWidth: 560 }}>
          Solo ves y cargás gastos del mes en curso.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label htmlFor="concepto">Concepto</label>
          <input id="concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="categoria">Categoría</label>
          <input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Materiales, Personal, Combustible..."
            required
          />
        </div>
        <div className="field">
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-navy">
          Agregar gasto
        </button>
      </form>

      <div className={styles.list}>
        {gastos.map((g) => (
          <div key={g.id} className={styles.row}>
            <div>
              <strong>{g.concepto}</strong>
              <p className={styles.sub}>
                {g.categoria} · {g.fecha}
                {g.facturaId && ' · vinculado a una factura'}
              </p>
            </div>
            <span>${g.monto.toLocaleString('es-AR')}</span>
            {profile?.role === 'superadmin' && (
              <button className={styles.deleteBtn} onClick={() => eliminar(g.id)}>
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
