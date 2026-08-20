import { z } from 'zod';

/**
 * Validación de todo input que llega de un formulario público.
 *
 * Esto es DEFENSA EN PROFUNDIDAD (OWASP A04 / A03): la validación real
 * y no bypasseable vive en Postgres (constraints + RLS). Esta capa
 * evita mandar basura al servidor y da mensajes de error legibles,
 * pero nunca hay que confiar solo en ella.
 */

// Longitudes acotadas a propósito: previene payloads gigantes (DoS liviano)
// y mantiene los datos consistentes con las columnas de la base.
const contactoRegex = /^([+\d\s()-]{6,20}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export const nuevoTurnoSchema = z.object({
  rubro: z.string().trim().min(1, 'Elegí un rubro').max(60),
  problema: z
    .string()
    .trim()
    .min(10, 'Contanos un poco más (mínimo 10 caracteres)')
    .max(1000, 'Máximo 1000 caracteres'),
  direccion: z.string().trim().min(5, 'Ingresá la dirección completa').max(200),
  contacto: z
    .string()
    .trim()
    .min(6, 'Dejanos un teléfono o email')
    .max(120)
    .regex(contactoRegex, 'Ingresá un teléfono o email válido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'Horario inválido'),
  urgente: z.boolean(),
  // Honeypot: un bot que autocompleta todos los inputs va a llenar este
  // campo oculto. Un humano nunca lo ve ni lo llena.
  website: z.string().max(0, 'Bot detectado').optional().or(z.literal('')),
});

export type NuevoTurnoFormValues = z.infer<typeof nuevoTurnoSchema>;

export const nuevoMensajeSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre').max(100),
  contacto: z
    .string()
    .trim()
    .min(6, 'Dejanos un teléfono o email')
    .max(120)
    .regex(contactoRegex, 'Ingresá un teléfono o email válido'),
  mensaje: z.string().trim().min(5, 'Contanos tu consulta').max(1000),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type NuevoMensajeFormValues = z.infer<typeof nuevoMensajeSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(200),
  // No acotamos "reglas de complejidad" acá: eso es responsabilidad de
  // Supabase Auth al crear la cuenta. Acá solo evitamos strings vacíos/gigantes.
  password: z.string().min(8, 'Mínimo 8 caracteres').max(200),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const nuevaFacturaSchema = z.object({
  turnoId: z.string().uuid().optional().nullable(),
  clienteNombre: z.string().trim().min(2).max(150),
  concepto: z.string().trim().min(2).max(300),
  monto: z.number().positive('El monto debe ser mayor a 0').max(100_000_000),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
});

export type NuevaFacturaFormValues = z.infer<typeof nuevaFacturaSchema>;

/**
 * Helper genérico: corre un schema de Zod y devuelve un resultado
 * con el mismo shape que usan los servicios (ServiceResult), para no
 * tener que traducir errores de Zod en cada componente.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos';
}
