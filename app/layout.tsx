import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DirtyMoCap',
  description: 'Robust Motion Capture from Unconstrained Markers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
