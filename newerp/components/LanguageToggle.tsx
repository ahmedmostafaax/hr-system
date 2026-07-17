'use client';

import { useTranslation } from '@/app/i18n/client';
import { cookieName } from '@/app/i18n/settings';
import { Languages } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageToggle({ lng }: { lng: string }) {
  const { i18n } = useTranslation(lng, 'common');
  const router = useRouter();
  const pathname = usePathname();
  const targetLng = lng === 'en' ? 'ar' : 'en';

  const toggleLanguage = () => {
    document.cookie = `${cookieName}=${targetLng}; path=/; max-age=31536000`;
    i18n.changeLanguage(targetLng);

    const newPath = pathname.replace(/^\/(en|ar)/, `/${targetLng}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="group relative flex items-center justify-center gap-2 w-full h-full bg-transparent hover:bg-slate-200/50 transition-colors"
      aria-label="Toggle Language"
    >
      <Languages className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
      <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase">
        {lng === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
