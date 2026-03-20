'use client';

import { useTranslations } from 'next-intl';
import { Bell, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth/client';
import { LanguageToggle } from '@/components/language-toggle';
import type { Locale } from '@/i18n/config';

export function Header({
  userName,
  userRole,
  locale,
  unreadCount = 0,
}: {
  userName: string;
  userRole: string;
  locale: Locale;
  unreadCount?: number;
}) {
  const _t = useTranslations('Common');

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm text-gray-500">
        {userRole}
      </div>

      <div className="flex items-center gap-4">
        <LanguageToggle currentLocale={locale} />

        <button
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          data-testid="notifications-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          <button
            onClick={() => signOut()}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
