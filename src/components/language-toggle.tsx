'use client';

import { useRouter } from 'next/navigation';
import { localeNames, type Locale } from '@/i18n/config';

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();

  function switchLocale(locale: Locale) {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  const nextLocale: Locale = currentLocale === 'en' ? 'hi' : 'en';

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
      data-testid="language-toggle"
    >
      {localeNames[nextLocale]}
    </button>
  );
}
