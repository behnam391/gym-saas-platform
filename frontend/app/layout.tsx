import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '@fontsource-variable/vazirmatn';
import './globals.css';

const title = 'سامانه هوشمند مدیریت باشگاه‌های ورزشی';
const description = 'مارکت‌پلیس و سامانه مدیریت یکپارچه باشگاه‌های ورزشی';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const metadataBase = new URL(
    host ? `${protocol}://${host}` : 'http://localhost:3001',
  );
  const imageUrl = new URL('/og.png', metadataBase).toString();

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      title,
      description,
      images: [{ url: imageUrl, width: 1734, height: 907, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
