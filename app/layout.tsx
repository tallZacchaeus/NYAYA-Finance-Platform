import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'RCCG YAYA Finance Portal',
  description: 'Financial request management for RCCG YAYA Youth Affairs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="font-body bg-[#0A0616] text-[#F5E8D3]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13093B',
              color: '#F5E8D3',
              border: '1px solid #2D1A73',
              fontFamily: 'var(--font-body)',
            },
            success: {
              iconTheme: { primary: '#BB913B', secondary: '#13093B' },
            },
            error: {
              iconTheme: { primary: '#F87171', secondary: '#13093B' },
            },
          }}
        />
      </body>
    </html>
  );
}
