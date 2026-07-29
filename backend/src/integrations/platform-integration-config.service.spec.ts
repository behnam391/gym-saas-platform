import { PlatformIntegrationConfigService } from './platform-integration-config.service';

describe('PlatformIntegrationConfigService', () => {
  const originalKey = process.env.PLATFORM_SECRETS_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.PLATFORM_SECRETS_KEY;
    else process.env.PLATFORM_SECRETS_KEY = originalKey;
  });

  it('encrypts credentials at rest and can decrypt them again', async () => {
    process.env.PLATFORM_SECRETS_KEY = Buffer.alloc(32, 7).toString('base64');
    let encryptedConfig: string | null = null;
    const platform = {
      platformIntegration: {
        findUnique: jest.fn(async () => ({ encryptedConfig })),
        update: jest.fn(async ({ data }) => {
          encryptedConfig = data.encryptedConfig;
          return { id: 'integration-1' };
        }),
      },
    };
    const service = new PlatformIntegrationConfigService({
      forPlatform: () => platform,
    } as never);
    const config = {
      apiKey: 'kavenegar-secret-value',
      allowedRecipients: ['09120000000'],
      dryRun: false,
    };

    await service.save('SMS', config, ['apiKey', 'allowedRecipients', 'dryRun']);

    expect(encryptedConfig).toMatch(/^v1\./);
    expect(encryptedConfig).not.toContain(config.apiKey);
    await expect(service.read('SMS')).resolves.toEqual(config);
  });
});
