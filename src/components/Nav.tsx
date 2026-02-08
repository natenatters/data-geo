'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/sources', label: 'Sources' },
  { href: '/stories', label: 'Stories' },
  { href: '/sources/new', label: 'Add Source' },
  { href: '/preview', label: 'Preview' },
  { href: '/export', label: 'Export' },
];

export default function Nav() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    const html = document.documentElement;
    html.classList.add('transitioning');
    if (next) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setTimeout(() => html.classList.remove('transitioning'), 150);
  }

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <Link href="/" className="font-bold text-lg tracking-tight">
            data-geo
          </Link>
          <div className="flex gap-1 flex-1">
            {links.map(link => {
              const active = link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    active
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
