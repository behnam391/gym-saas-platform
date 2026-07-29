import { KavenegarApi } from 'kavenegar';
import * as nodemailer from 'nodemailer';
import { PlatformIntegrationConfigService } from '../integrations/platform-integration-config.service';
import { NotificationProviderService } from './notification-provider.service';

jest.mock('kavenegar', () => ({
  KavenegarApi: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('NotificationProviderService Kavenegar SDK', () => {
  const Send = jest.fn();
  const VerifyLookup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (KavenegarApi as jest.Mock).mockReturnValue({ Send, VerifyLookup });
    Send.mockImplementation((_input, callback) => callback({}, 200, 'ok'));
    VerifyLookup.mockImplementation((_input, callback) =>
      callback({}, 200, 'ok'),
    );
  });

  function service(config: Record<string, unknown>) {
    const integrationConfig = {
      getSmsGatewayConfig: jest.fn().mockResolvedValue(config),
      getEmailGatewayConfig: jest.fn().mockResolvedValue(null),
    } as unknown as PlatformIntegrationConfigService;
    return new NotificationProviderService(integrationConfig);
  }

  function emailService(config: Record<string, unknown> | null) {
    const integrationConfig = {
      getSmsGatewayConfig: jest.fn().mockResolvedValue(null),
      getEmailGatewayConfig: jest.fn().mockResolvedValue(config),
    } as unknown as PlatformIntegrationConfigService;
    return new NotificationProviderService(integrationConfig);
  }

  it('uses VerifyLookup and the approved template for OTP messages', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      otpTemplate: 'gordyarverify',
      allowedRecipients: ['09120000000'],
      dryRun: false,
    });

    await expect(
      provider.sendSms({
        to: '09120000000',
        text: 'fallback text',
        verification: { token: '123456' },
      }),
    ).resolves.toBe('SENT');

    expect(VerifyLookup).toHaveBeenCalledWith(
      {
        receptor: '09120000000',
        token: '123456',
        template: 'gordyarverify',
      },
      expect.any(Function),
    );
    expect(Send).not.toHaveBeenCalled();
  });

  it('falls back to the SDK Send method when no OTP template is configured', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      sender: '10004346',
      allowedRecipients: ['09120000000'],
      dryRun: false,
    });

    await provider.sendSms({
      to: '09120000000',
      text: 'پیام گُردیار',
      verification: { token: '123456' },
    });

    expect(Send).toHaveBeenCalledWith(
      {
        receptor: '09120000000',
        message: 'پیام گُردیار',
        sender: '10004346',
      },
      expect.any(Function),
    );
  });

  it('does not call Kavenegar while dry-run is enabled', async () => {
    const provider = service({
      apiKey: 'secret-api-key',
      allowedRecipients: ['09120000000'],
      dryRun: true,
    });

    await expect(
      provider.sendSms({ to: '09120000000', text: 'test' }),
    ).resolves.toBe('DRY_RUN');
    expect(KavenegarApi).not.toHaveBeenCalled();
  });

  it('sends OTP email with the encrypted SMTP configuration', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'mail-1' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const provider = emailService({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      username: 'mailer@example.com',
      password: 'app-password',
      fromAddress: 'no-reply@gordyar.ir',
      fromName: 'گُردیار',
      allowedRecipients: ['test@example.com'],
      dryRun: false,
    });

    await expect(
      provider.sendEmail({
        to: 'TEST@example.com',
        subject: 'کد تأیید',
        html: '<b>123456</b>',
      }),
    ).resolves.toBe('SENT');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'mailer@example.com',
        pass: 'app-password',
      },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: 'گُردیار', address: 'no-reply@gordyar.ir' },
      to: 'test@example.com',
      subject: 'کد تأیید',
      html: '<b>123456</b>',
    });
  });

  it('blocks email outside the temporary allow-list', async () => {
    const provider = emailService({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      fromAddress: 'no-reply@gordyar.ir',
      fromName: 'گُردیار',
      allowedRecipients: ['owner@example.com'],
      dryRun: false,
    });

    await expect(
      provider.sendEmail({
        to: 'other@example.com',
        subject: 'کد تأیید',
        html: '123456',
      }),
    ).resolves.toBe('BLOCKED');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
