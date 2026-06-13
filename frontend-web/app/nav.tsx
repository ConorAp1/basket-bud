'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home', icon: '🧺' },
  { href: '/scan', label: 'Scan', icon: '📷' },
  { href: '/compare', label: 'Compare', icon: '🏷️' },
  { href: '/dashboard', label: 'Dashboard', icon: '📈' },
] as const;

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="hidden sm:flex items-center gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(pathname, link.href)
              ? 'text-green-700 bg-green-50'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive(pathname, link.href) ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            <span className="text-xl leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
