'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiHome, FiFileText, FiImage, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const links = [
    { href: '/', icon: FiHome, label: 'Dashboard' },
    { href: '/blogs/new', icon: FiFileText, label: 'New Blog' },
    { href: '/images', icon: FiImage, label: 'Images' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-gradient-to-b from-indigo-600 to-purple-700 
          text-white flex flex-col z-40 transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold">TexArea</h1>
          <p className="text-sm text-white/80 mt-1">Blog Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive(link.href)
                      ? 'bg-white text-indigo-600 font-semibold'
                      : 'hover:bg-white/10'
                  }
                `}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="mb-4 px-4 py-2 bg-white/10 rounded-lg">
            <p className="text-sm text-white/80">Logged in as</p>
            <p className="font-semibold">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
