import { describe, it, expect } from 'vitest';
import { nuevoTurnoSchema, nuevoMensajeSchema, loginSchema } from '../validation';

const turnoBase = {
  rubro: 'Plomería',
  problema: 'Se tapó la pileta y pierde agua por abajo del mueble.',
  direccion: 'Av. San Martín 1234',
  contacto: '+54 9 11 2237-0857',
  fecha: '2026-08-10',
  horario: '11:30',
  urgente: false,
};

describe('nuevoTurnoSchema', () => {
  it('acepta un turno válido', () => {
    expect(nuevoTurnoSchema.safeParse(turnoBase).success).toBe(true);
  });

  it('rechaza problema demasiado corto (posible spam de 1 palabra)', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, problema: 'hola' });
    expect(result.success).toBe(false);
  });

  it('rechaza un contacto que no es teléfono ni email', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, contacto: 'no-es-nada' });
    expect(result.success).toBe(false);
  });

  it('acepta contacto como email', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, contacto: 'a@b.com' });
    expect(result.success).toBe(true);
  });

  it('rechaza fecha con formato inválido', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, fecha: '10/08/2026' });
    expect(result.success).toBe(false);
  });

  it('rechaza si el honeypot "website" viene con contenido', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, website: 'http://bot.com' });
    expect(result.success).toBe(false);
  });

  it('acepta si el honeypot viene vacío', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, website: '' });
    expect(result.success).toBe(true);
  });

  it('rechaza un problema de más de 1000 caracteres (anti payload gigante)', () => {
    const result = nuevoTurnoSchema.safeParse({ ...turnoBase, problema: 'x'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('nuevoMensajeSchema', () => {
  it('acepta un mensaje válido', () => {
    const result = nuevoMensajeSchema.safeParse({
      nombre: 'Juan',
      contacto: '11-2237-0857',
      mensaje: 'Quería consultar por un presupuesto.',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = nuevoMensajeSchema.safeParse({
      nombre: '',
      contacto: '11-2237-0857',
      mensaje: 'Quería consultar por un presupuesto.',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-un-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rechaza password corto', () => {
    const result = loginSchema.safeParse({ email: 'admin@crad.com.ar', password: '123' });
    expect(result.success).toBe(false);
  });

  it('acepta credenciales válidas', () => {
    const result = loginSchema.safeParse({ email: 'admin@crad.com.ar', password: 'password123' });
    expect(result.success).toBe(true);
  });
});
