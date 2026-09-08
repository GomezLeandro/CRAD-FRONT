import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../BookingModal';

// El componente NUNCA debe importar supabase ni el módulo lib/supabaseClient.
// Mockeamos directamente el service, que es el único contrato permitido.
vi.mock('../../../services/turnosService', () => ({
  crearTurno: vi.fn(),
  listarHorariosOcupados: vi.fn(),
}));

import { crearTurno, listarHorariosOcupados } from '../../../services/turnosService';

const crearTurnoMock = vi.mocked(crearTurno);
const listarHorariosOcupadosMock = vi.mocked(listarHorariosOcupados);

function renderModal(onClose = vi.fn()) {
  return render(<BookingModal open onClose={onClose} rubro="Plomería" />);
}

beforeEach(() => {
  vi.clearAllMocks();
  listarHorariosOcupadosMock.mockResolvedValue({ ok: true, data: [] });
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
    crearTurnoMock.mockResolvedValue({ ok: true, data: null });

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

  it('deshabilita y marca como ocupados los horarios ya tomados para la fecha elegida', async () => {
    listarHorariosOcupadosMock.mockResolvedValue({ ok: true, data: ['09:00'] });

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^fecha$/i), '2026-08-10');

    await waitFor(() => expect(listarHorariosOcupadosMock).toHaveBeenCalledWith('2026-08-10'));

    const ocupado = await screen.findByRole('button', { name: '09:00 hs, ocupado' });
    expect(ocupado).toBeDisabled();

    const libre = screen.getByRole('button', { name: '10:00 hs' });
    expect(libre).toBeEnabled();
  });

  it('el campo honeypot está presente pero oculto y no interactuable por teclado', () => {
    renderModal();
    const honeypot = screen.getByLabelText(/no completar este campo/i);
    expect(honeypot).toHaveAttribute('tabIndex', '-1');
    expect(honeypot).toHaveAttribute('autoComplete', 'off');
  });
});
