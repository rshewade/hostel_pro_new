import { Building, Users, Heart, GraduationCap } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import PublicLayout from "@/components/public/PublicLayout";
import { getTranslations } from "next-intl/server";

export default async function TrusteesPage() {
  const t = await getTranslations("Public.trustees");

  const heritageCards = [
    {
      icon: <Building className="w-8 h-8" />,
      title: t("heritage1Title"),
      description: t("heritage1Desc"),
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t("heritage2Title"),
      description: t("heritage2Desc"),
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: t("heritage3Title"),
      description: t("heritage3Desc"),
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: t("heritage4Title"),
      description: t("heritage4Desc"),
    },
  ];

  const managementMembers = [
    {
      name: t("member1Name"),
      role: t("member1Role"),
      initials: t("member1Initials"),
      description: t("member1Desc"),
    },
    {
      name: t("member2Name"),
      role: t("member2Role"),
      initials: t("member2Initials"),
      description: t("member2Desc"),
    },
  ];

  return (
    <PublicLayout>
      <PageHero title={t("title")} />

      {/* Jhaveri Family Heritage */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            className="text-3xl font-bold mb-4 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("heritageTitle")}
          </h2>
          <p
            className="text-center mb-12 max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("heritageSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {heritageCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-8"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                  style={{
                    backgroundColor: "var(--color-navy-50)",
                    color: "var(--color-navy-700)",
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Management */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--surface-secondary)" }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <h2
            className="text-3xl font-bold mb-4 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("keyManagement")}
          </h2>
          <p
            className="text-center mb-12 max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("keyManagementSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {managementMembers.map((member) => (
              <div
                key={member.name}
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 text-2xl font-bold"
                  style={{
                    backgroundColor: "var(--color-navy-100)",
                    color: "var(--color-navy-700)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {member.initials}
                </div>
                <h3
                  className="text-xl font-bold mb-1"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-sm font-medium mb-4"
                  style={{ color: "var(--bg-accent)" }}
                >
                  {member.role}
                </p>
                <p
                  className="leading-relaxed text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy Section */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2
            className="text-3xl font-bold mb-8"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("livingLegacy")}
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("livingLegacyText")}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
