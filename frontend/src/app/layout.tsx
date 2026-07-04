import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '../components/shared/client-providers';

export const metadata: Metadata = {
  title: 'TraceLink | Digital Asset Intelligence Platform',
  description:
    'Track, analyze, and score engagement for your shared links, resumes, client proposals, pitch decks, and files. TraceLink gives you deep post-share analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
