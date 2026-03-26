import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Whoreagon Trail',
  description: 'Independence, Missouri. 1848.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
