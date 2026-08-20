/**
 * Tipos de dominio del negocio. Reflejan 1 a 1 las tablas de Supabase
 * (ver /supabase/schema.sql). Los componentes SOLO deben importar estos
 * tipos, nunca tipos "crudos" del cliente de Supabase.
 */

export type UserRole = 'admin' | 'superadmin';

export interface Profile {
  id: string;
  nombre: string;
  role: UserRole;
  createdAt: string;
}

export type TurnoEstado = 'pendiente' | 'confirmado' | 'rechazado' | 'completado';

export interface Turno {
  id: string;
  rubro: string;
  problema: string;
  direccion: string;
  contacto: string;
  fecha: string; // ISO date (YYYY-MM-DD)
  horario: string; // HH:mm
  urgente: boolean;
  estado: TurnoEstado;
  createdAt: string;
  updatedAt: string;
  confirmadoPor: string | null;
}

/** Datos que llegan del formulario público — sin id/estado/timestamps. */
export interface NuevoTurnoInput {
  rubro: string;
  problema: string;
  direccion: string;
  contacto: string;
  fecha: string;
  horario: string;
  urgente: boolean;
  /** Campo honeypot anti-bot. Debe llegar vacío. Nunca se persiste. */
  website?: string;
}

export interface Mensaje {
  id: string;
  nombre: string;
  contacto: string;
  mensaje: string;
  leido: boolean;
  createdAt: string;
}

export interface NuevoMensajeInput {
  nombre: string;
  contacto: string;
  mensaje: string;
  website?: string;
}

export type FacturaEstado = 'pendiente' | 'pagada';

export interface Factura {
  id: string;
  turnoId: string | null;
  clienteNombre: string;
  concepto: string;
  monto: number;
  estado: FacturaEstado;
  fechaEmision: string;
  fechaPago: string | null;
  createdBy: string;
  createdAt: string;
}

export interface NuevaFacturaInput {
  turnoId?: string | null;
  clienteNombre: string;
  concepto: string;
  monto: number;
  fechaEmision: string;
}

export interface Trabajo {
  id: string;
  titulo: string;
  ubicacion: string;
  descripcion: string;
  imagenUrl: string | null;
  orden: number;
  activo: boolean;
}

export interface Servicio {
  id: string;
  rubroKey: string;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

/** Resultado uniforme para toda operación de servicio. */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export interface ServiceError {
  /** Código estable para manejar el error en la UI (no es el mensaje de Postgres). */
  code:
    | 'VALIDATION_ERROR'
    | 'SLOT_TAKEN'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';
  message: string;
}
