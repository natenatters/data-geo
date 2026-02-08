import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'data-geo — Manchester Historical Data Pipeline',
  description: 'CMS for managing historical geographic data about Manchester, UK',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 dark:text-gray-100 min-h-screen">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))d.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <Nav />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
