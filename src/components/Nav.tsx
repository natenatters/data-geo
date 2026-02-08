'use client';

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

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <Link href="/" className="font-bold text-lg tracking-tight">
            data-geo
          </Link>
          <div className="flex gap-1">
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
        </div>
      </div>
    </nav>
  );
}
