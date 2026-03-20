import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

// Cache loaded messages to avoid re-reading files on every request
const messageCache = new Map<string, Record<string, unknown>>();

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const cacheKey = locale;
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey)!;
  }

  // Load all message files in parallel
  const [Common, Dashboard, Auth, Applications, Rooms, Fees, Leaves, Documents, Settings, Public] =
    await Promise.all([
      import(`../../messages/${locale}/common.json`).then(m => m.default),
      import(`../../messages/${locale}/dashboard.json`).then(m => m.default),
      import(`../../messages/${locale}/auth.json`).then(m => m.default),
      import(`../../messages/${locale}/applications.json`).then(m => m.default),
      import(`../../messages/${locale}/rooms.json`).then(m => m.default),
      import(`../../messages/${locale}/fees.json`).then(m => m.default),
      import(`../../messages/${locale}/leaves.json`).then(m => m.default),
      import(`../../messages/${locale}/documents.json`).then(m => m.default),
      import(`../../messages/${locale}/settings.json`).then(m => m.default),
      import(`../../messages/${locale}/public.json`).then(m => m.default),
    ]);

  const messages = { Common, Dashboard, Auth, Applications, Rooms, Fees, Leaves, Documents, Settings, Public };
  messageCache.set(cacheKey, messages);
  return messages;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  const messages = await loadMessages(locale);

  return { locale, messages };
});
