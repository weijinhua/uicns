import { getTranslations } from "next-intl/server";
import { HomeShell } from "@/components/HomeShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: t("title"),
    description: t("tagline"),
  };
}

export default function HomePage() {
  return <HomeShell />;
}
