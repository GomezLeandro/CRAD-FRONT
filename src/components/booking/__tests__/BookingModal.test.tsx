import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../BookingModal';

// El componente NUNCA debe importar supabase ni el módulo lib/supabaseClient.
// Mockeamos directamente el service, que es el único contrato permitido.
vi.mock('../../../services/turnosService', () => ({
  crearTurno: vi.fn(),
}));

import { crearTurno } from '../../../services/turnosService';

const crearTurnoMock = vi.mocked(crearTurno);

function renderModal(onClose = vi.fn()) {
  return render(<BookingModal open onClose={onClose} rubro="Plomería" />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BookingModal', () => {
  it('muestra errores de validación si se envía vacío, sin llamar al service', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /confirmar turno/i }));

    expect(await screen.findByText(/contanos un poco más/i)).toBeInTheDocument();
    expect(crearTurnoMock).not.toHaveBeenCalled();
  });

  it('envía el turno con los datos correctos y muestra confirmación', async () => {
    crearTurnoMock.mockResolvedValue({
      ok: true,
      data: {
        id: 't1',
        rubro: 'Plomería',
        problema: 'Se tapó la pileta y pierde agua por abajo.',
        direccion: 'Av. San Martín 1234',
        contacto: '11-2237-0857',
        fecha: '2026-08-10',
        horario: '11:30',
        urgente: false,
        estado: 'pendiente',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        confirmadoPor: null,
      },
    });

    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText(/describí el problema/i),
      'Se tapó la pileta y pierde agua por abajo.'
    );
    await user.type(screen.getByLabelText(/dirección del trabajo/i), 'Av. San Martín 1234');
    await user.type(screen.getByLabelText(/teléfono o email/i), '11-2237-0857');
    await user.type(screen.getByLabelText(/^fecha$/i), '2026-08-10');

    await user.click(screen.getByRole('button', { name: /confirmar turno/i }));

    await waitFor(() => expect(crearTurnoMock).toHaveBeenCalledTimes(1));
    expect(crearTurnoMock).toHaveBeenCalledWith(
      expect.objectContaining({ rubro: 'Plomería', direccion: 'Av. San Martín 1234' })
    );
    expect(await screen.findByText(/recibimos tu solicitud/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de horario ocupado (SLOT_TAKEN) sin romper el form', async () => {
    crearTurnoMock.mockResolvedValue({
      ok: false,
      error: { code: 'SLOT_TAKEN', message: 'Ese horario ya fue reservado. Elegí otro turno disponible.' },
    });

    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByLabelText(/describí el problema/i),
      'Se tapó la pileta y pierde agua por abajo.'
    );
    await user.type(screen.getByLabelText(/dirección del trabajo/i), 'Av. San Martín 1234');
    await user.type(screen.getByLabelText(/teléfono o email/i), '11-2237-0857');
    await user.type(screen.getByLabelText(/^fecha$/i), '2026-08-10');
    await user.click(screen.getByRole('button', { name: /confirmar turno/i }));

    expect(await screen.findByText(/ese horario ya fue reservado/i)).toBeInTheDocument();
  });

  it('el campo honeypot está presente pero oculto y no interactuable por teclado', () => {
    renderModal();
    const honeypot = screen.getByLabelText(/no completar este campo/i);
    expect(honeypot).toHaveAttribute('tabIndex', '-1');
    expect(honeypot).toHaveAttribute('autoComplete', 'off');
  });
});
