import LanguageToggle from "@/components/LanguageToggle";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <div className="absolute top-6 right-6 left-auto rtl:right-auto rtl:left-6 z-50">
        <LanguageToggle lng={locale} />
      </div>
      {children}
    </div>
  );
}
