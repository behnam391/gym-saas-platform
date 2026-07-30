import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '@fontsource-variable/vazirmatn';
import '@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css';
import { BRAND } from '../lib/brand';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const metadataBase = new URL(
    host ? `${protocol}://${host}` : 'http://localhost:3001',
  );
  const imageUrl = new URL('/brand/gordyar-social.png', metadataBase).toString();

  return {
    metadataBase,
    applicationName: BRAND.name,
    title: {
      default: BRAND.title,
      template: `%s | ${BRAND.name}`,
    },
    description: BRAND.description,
    keywords: [
      BRAND.name,
      'مدیریت باشگاه',
      'باشگاه ورزشی',
      'مربی ورزشی',
      'عضویت باشگاه',
      'ورزش ایران',
    ],
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: BRAND.name,
      title: BRAND.title,
      description: BRAND.description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: BRAND.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: BRAND.title,
      description: BRAND.description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
