import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Servicios } from '../Servicios';

vi.mock('../../../services/serviciosService', () => ({
  listarServiciosPublicos: vi.fn(),
}));

import { listarServiciosPublicos } from '../../../services/serviciosService';

const listarMock = vi.mocked(listarServiciosPublicos);

beforeEach(() => vi.clearAllMocks());

describe('Servicios', () => {
  it('muestra los servicios devueltos por el service', async () => {
    listarMock.mockResolvedValue({
      ok: true,
      data: [
        { id: '1', rubroKey: 'plomeria', nombre: 'Plomería', descripcion: 'Fugas y reparaciones', orden: 0, activo: true },
      ],
    });

    render(<Servicios />);

    expect(await screen.findByText('Plomería')).toBeInTheDocument();
    expect(screen.getByText('Fugas y reparaciones')).toBeInTheDocument();
  });

  it('muestra un mensaje de error si falla la carga, sin romper la página', async () => {
    listarMock.mockResolvedValue({
      ok: false,
      error: { code: 'UNKNOWN', message: 'fail' },
    });

    render(<Servicios />);

    expect(await screen.findByText(/no pudimos cargar los servicios/i)).toBeInTheDocument();
  });
});
