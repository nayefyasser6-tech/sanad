import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // التأكد الصارم من أن اللغة هي نص (string) ولا يمكن أن تكون undefined
  const currentLocale = typeof locale === 'string' && ['ar', 'en'].includes(locale) ? locale : 'ar';

  return {
    locale: currentLocale,
    // تأكد من أن مسار مجلد messages صحيح لديك (سواء كان ./messages أو ../messages)
    messages: (await import(`./messages/${currentLocale}.json`)).default
  };
});