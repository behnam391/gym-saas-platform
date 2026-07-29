import { cookies } from 'next/headers';
import { api } from '../../lib/api';
import { BasicProfile, ProfileManager } from './profile-manager';
import { FinancialAccountsPanel } from './financial-accounts-panel';
import { AccountSecurityPanel } from './account-security-panel';

async function loadProfile() {
  const token = (await cookies()).get('accessToken')?.value;
  return api.get<BasicProfile>('/profiles/me', { accessToken: token });
}

async function loadAccounts() {
  const token = (await cookies()).get('accessToken')?.value;
  try { return await api.get<any[]>('/financial-accounts/mine', { accessToken: token }); } catch { return []; }
}

export async function AccountProfilePage({ title = 'پروفایل من' }: { title?: string }) {
  const profile = await loadProfile();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">{title}</h1><p className="text-muted">اطلاعات هویتی، تصویر نمایشی و امنیت حساب شما</p></header><ProfileManager initial={profile} /><AccountSecurityPanel role={profile.role} /></div>;
}

export async function BankingPage({ scopes }: { scopes: string[] }) {
  const accounts = await loadAccounts();
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">حساب‌های مالی و تسویه</h1><p className="text-muted">شماره شبا، حساب و کارت‌های مورد استفاده برای تسویه‌ها</p></header><FinancialAccountsPanel initial={accounts} scopes={scopes} /></div>;
}
