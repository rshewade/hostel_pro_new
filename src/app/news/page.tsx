import { Calendar } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import PageHero from "@/components/public/PageHero";
import { getTranslations } from "next-intl/server";

export default async function NewsPage() {
  const t = await getTranslations("Public.news");

  const newsItems = [
    {
      title: t("item1Title"),
      description: t("item1Desc"),
      date: t("item1Date"),
      category: t("item1Category"),
      badgeColor: "#2563eb",
      badgeBg: "#dbeafe",
    },
    {
      title: t("item2Title"),
      description: t("item2Desc"),
      date: t("item2Date"),
      category: t("item2Category"),
      badgeColor: "#d97706",
      badgeBg: "#fef3c7",
    },
    {
      title: t("item3Title"),
      description: t("item3Desc"),
      date: t("item3Date"),
      category: t("item3Category"),
      badgeColor: "#e11d48",
      badgeBg: "#ffe4e6",
    },
    {
      title: t("item4Title"),
      description: t("item4Desc"),
      date: t("item4Date"),
      category: t("item4Category"),
      badgeColor: "#16a34a",
      badgeBg: "#dcfce7",
    },
    {
      title: t("item5Title"),
      description: t("item5Desc"),
      date: t("item5Date"),
      category: t("item5Category"),
      badgeColor: "#9333ea",
      badgeBg: "#f3e8ff",
    },
  ];

  return (
    <PublicLayout>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <section
        className="px-4 py-16"
        style={{ background: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {newsItems.map((item) => (
            <article
              key={item.title}
              className="rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
              style={{
                backgroundColor: "var(--surface-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    color: item.badgeColor,
                    backgroundColor: item.badgeBg,
                  }}
                >
                  {item.category}
                </span>
                <span
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {item.date}
                </span>
              </div>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
