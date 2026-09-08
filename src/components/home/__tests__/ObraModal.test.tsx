import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObraModal } from '../ObraModal';

// El componente NUNCA debe importar supabase ni el módulo lib/supabaseClient.
// Mockeamos directamente el service, que es el único contrato permitido.
vi.mock('../../../services/solicitudesObraService', () => ({
  crearSolicitudObra: vi.fn(),
  subirAdjuntoObra: vi.fn(),
}));

import {
  crearSolicitudObra,
  subirAdjuntoObra,
} from '../../../services/solicitudesObraService';

const crearSolicitudObraMock = vi.mocked(crearSolicitudObra);
const subirAdjuntoObraMock = vi.mocked(subirAdjuntoObra);

function renderModal(onClose = vi.fn()) {
  return render(<ObraModal open onClose={onClose} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ObraModal', () => {
  it('muestra errores de validación si se envía vacío, sin llamar al service', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(await screen.findByText(/ingresá la zona del terreno/i)).toBeInTheDocument();
    expect(crearSolicitudObraMock).not.toHaveBeenCalled();
    expect(subirAdjuntoObraMock).not.toHaveBeenCalled();
  });

  it('envía la solicitud sin adjunto y muestra confirmación', async () => {
    crearSolicitudObraMock.mockResolvedValue({ ok: true, data: null });

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/zona del terreno/i), 'San Martín centro');
    await user.type(
      screen.getByLabelText(/contanos brevemente el proyecto/i),
      'Casa de dos plantas sobre lote de 10x30.'
    );
    await user.type(screen.getByLabelText(/nombre y apellido/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/whatsapp o email/i), '11-5555-1234');

    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudObraMock).toHaveBeenCalledTimes(1));
    expect(subirAdjuntoObraMock).not.toHaveBeenCalled();
    expect(crearSolicitudObraMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoProyecto: 'Construcción nueva',
        zona: 'San Martín centro',
        archivoUrl: null,
      })
    );
    expect(await screen.findByText(/recibimos tu solicitud/i)).toBeInTheDocument();
  });

  it('sube el adjunto antes de crear la solicitud cuando se elige un archivo', async () => {
    subirAdjuntoObraMock.mockResolvedValue({
      ok: true,
      data: 'https://example.com/obra-adjuntos/plano.pdf',
    });
    crearSolicitudObraMock.mockResolvedValue({ ok: true, data: null });

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/zona del terreno/i), 'San Martín centro');
    await user.type(
      screen.getByLabelText(/contanos brevemente el proyecto/i),
      'Casa de dos plantas sobre lote de 10x30.'
    );
    await user.type(screen.getByLabelText(/nombre y apellido/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/whatsapp o email/i), '11-5555-1234');

    const file = new File(['contenido'], 'plano.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/planos o referencias/i), file);

    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudObraMock).toHaveBeenCalledTimes(1));
    expect(subirAdjuntoObraMock).toHaveBeenCalledWith(file);
    expect(crearSolicitudObraMock).toHaveBeenCalledWith(
      expect.objectContaining({ archivoUrl: 'https://example.com/obra-adjuntos/plano.pdf' })
    );
  });

  it('el campo honeypot está presente pero oculto y no interactuable por teclado', () => {
    renderModal();
    const honeypot = screen.getByLabelText(/no completar este campo/i);
    expect(honeypot).toHaveAttribute('tabIndex', '-1');
    expect(honeypot).toHaveAttribute('autoComplete', 'off');
  });
});
