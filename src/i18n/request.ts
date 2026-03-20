import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: {
      Common: (await import(`../../messages/${locale}/common.json`)).default,
      Dashboard: (await import(`../../messages/${locale}/dashboard.json`)).default,
      Auth: (await import(`../../messages/${locale}/auth.json`)).default,
      Applications: (await import(`../../messages/${locale}/applications.json`)).default,
      Rooms: (await import(`../../messages/${locale}/rooms.json`)).default,
      Fees: (await import(`../../messages/${locale}/fees.json`)).default,
      Leaves: (await import(`../../messages/${locale}/leaves.json`)).default,
      Documents: (await import(`../../messages/${locale}/documents.json`)).default,
      Settings: (await import(`../../messages/${locale}/settings.json`)).default,
      Public: (await import(`../../messages/${locale}/public.json`)).default,
    },
  };
});
