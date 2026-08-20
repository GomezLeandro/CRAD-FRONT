import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TurnosPage } from '../TurnosPage';

vi.mock('../../../services/turnosService', () => ({
  listarTurnos: vi.fn(),
  actualizarEstadoTurno: vi.fn(),
}));

import { listarTurnos, actualizarEstadoTurno } from '../../../services/turnosService';

const listarMock = vi.mocked(listarTurnos);
const actualizarMock = vi.mocked(actualizarEstadoTurno);

const turnoPendiente = {
  id: 't1',
  rubro: 'Plomería',
  problema: 'Se tapó la pileta de la cocina.',
  direccion: 'Av. San Martín 1234',
  contacto: '11-2237-0857',
  fecha: '2026-08-10',
  horario: '11:30',
  urgente: false,
  estado: 'pendiente' as const,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  confirmadoPor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  listarMock.mockResolvedValue({ ok: true, data: [turnoPendiente] });
});

describe('TurnosPage', () => {
  it('lista los turnos pendientes por defecto', async () => {
    render(<TurnosPage />);
    expect(await screen.findByText('Plomería')).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledWith('pendiente');
  });

  it('confirma un turno y recarga la lista', async () => {
    actualizarMock.mockResolvedValue({ ok: true, data: { ...turnoPendiente, estado: 'confirmado' } });
    const user = userEvent.setup();
    render(<TurnosPage />);

    await screen.findByText('Plomería');
    await user.click(screen.getByRole('button', { name: /^confirmar$/i }));

    await waitFor(() => expect(actualizarMock).toHaveBeenCalledWith('t1', 'confirmado'));
    // se vuelve a pedir la lista tras confirmar
    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  });

  it('muestra el error si la confirmación es rechazada por RLS', async () => {
    actualizarMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'No tenés permiso para hacer esto.' },
    });
    const user = userEvent.setup();
    render(<TurnosPage />);

    await screen.findByText('Plomería');
    await user.click(screen.getByRole('button', { name: /^confirmar$/i }));

    expect(await screen.findByText(/no tenés permiso/i)).toBeInTheDocument();
  });
});
