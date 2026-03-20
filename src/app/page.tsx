import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('Common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">{t('appName')}</h1>
      <p className="mt-4 text-lg text-gray-600">{t('tagline')}</p>
    </main>
  );
}
