import { getRequestConfig } from "next-intl/server";

export const locales = ["uk", "en"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolved = (locales as readonly string[]).includes(locale ?? "")
    ? (locale as Locale)
    : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  };
});
