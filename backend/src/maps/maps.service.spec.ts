import { ServiceUnavailableException } from '@nestjs/common';
import { MapsService } from './maps.service';

describe('MapsService', () => {
  const config = {
    getMapsGatewayConfig: jest.fn(),
  };
  const service = new MapsService(config as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the Neshan browser key without exposing the service key', async () => {
    config.getMapsGatewayConfig.mockResolvedValue({
      serverApiKey: 'service-secret',
      browserApiKey: 'web.public-key',
    });

    await expect(service.browserConfig()).resolves.toEqual({
      provider: 'NESHAN',
      browserApiKey: 'web.public-key',
      configured: true,
    });
  });

  it('accepts a legacy web key stored in the server field', async () => {
    config.getMapsGatewayConfig.mockResolvedValue({
      serverApiKey: 'web.legacy-key',
    });

    await expect(service.browserConfig()).resolves.toEqual({
      provider: 'NESHAN',
      browserApiKey: 'web.legacy-key',
      configured: true,
    });
  });

  it('requires a service key for reverse geocoding', async () => {
    config.getMapsGatewayConfig.mockResolvedValue({
      browserApiKey: 'web.public-key',
    });

    await expect(
      service.reverseGeocode({ latitude: 35.6892, longitude: 51.389 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('normalizes a successful Neshan reverse-geocoding response', async () => {
    config.getMapsGatewayConfig.mockResolvedValue({
      serverApiKey: 'service-secret',
    });
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        formatted_address: 'تهران، میدان آزادی',
        city: 'تهران',
        state: 'استان تهران',
        county: 'شهرستان تهران',
      }),
    } as Response);

    await expect(
      service.reverseGeocode({ latitude: 35.6892, longitude: 51.389 }),
    ).resolves.toEqual({
      formattedAddress: 'تهران، میدان آزادی',
      neighbourhood: null,
      city: 'تهران',
      province: 'تهران',
      county: 'تهران',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://api.neshan.org/v5/reverse?'),
      expect.objectContaining({
        headers: { 'Api-Key': 'service-secret' },
      }),
    );
    fetchMock.mockRestore();
  });
});
