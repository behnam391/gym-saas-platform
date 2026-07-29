declare module 'kavenegar' {
  interface KavenegarCallback {
    (response: unknown, status?: number, message?: string): void;
  }

  interface KavenegarClient {
    Send(
      input: { receptor: string; message: string; sender?: string },
      callback: KavenegarCallback,
    ): void;
    VerifyLookup(
      input: { receptor: string; token: string; template: string },
      callback: KavenegarCallback,
    ): void;
    AccountInfo(input: Record<string, never>, callback: KavenegarCallback): void;
  }

  export function KavenegarApi(options: { apikey: string }): KavenegarClient;
}
