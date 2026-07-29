import { Suspense } from 'react';
import { PasswordRecoveryForm } from '../../../components/ui/password-recovery-form';

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center text-muted">
          در حال آماده‌سازی بازیابی رمز…
        </main>
      }
    >
      <PasswordRecoveryForm />
    </Suspense>
  );
}
