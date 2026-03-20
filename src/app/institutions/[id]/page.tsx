import Link from "next/link";
import {
  BedDouble,
  Wifi,
  BookOpen,
  Utensils,
  Droplets,
  Shield,
  Heart,
  Car,
  Users2,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
} from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import PageHero from "@/components/public/PageHero";
import { getTranslations } from "next-intl/server";

const iconMap = {
  BedDouble: <BedDouble size={28} />,
  Wifi: <Wifi size={28} />,
  BookOpen: <BookOpen size={28} />,
  Utensils: <Utensils size={28} />,
  Droplets: <Droplets size={28} />,
  Shield: <Shield size={28} />,
  Heart: <Heart size={28} />,
  Car: <Car size={28} />,
  Users2: <Users2 size={28} />,
} as const;

type IconName = keyof typeof iconMap;

interface FacilityIcon {
  icon: IconName;
}

interface InstitutionConfig {
  key: "boysHostel" | "girlsHostel" | "dharamshala";
  color: string;
  colorLight: string;
  ctaLink: string;
  facilityIcons: FacilityIcon[];
  eligibilityCount: number;
}

const institutionsConfig: Record<string, InstitutionConfig> = {
  "boys-hostel": {
    key: "boysHostel",
    color: "var(--color-navy-600)",
    colorLight: "var(--color-navy-100)",
    ctaLink: "/apply/boys-hostel",
    facilityIcons: [
      { icon: "BedDouble" },
      { icon: "Wifi" },
      { icon: "BookOpen" },
      { icon: "Utensils" },
      { icon: "Droplets" },
      { icon: "Shield" },
    ],
    eligibilityCount: 5,
  },
  "girls-hostel": {
    key: "girlsHostel",
    color: "#be185d",
    colorLight: "#fce7f3",
    ctaLink: "/apply/girls-ashram",
    facilityIcons: [
      { icon: "BedDouble" },
      { icon: "Shield" },
      { icon: "BookOpen" },
      { icon: "Utensils" },
      { icon: "Heart" },
      { icon: "Users2" },
    ],
    eligibilityCount: 6,
  },
  dharamshala: {
    key: "dharamshala",
    color: "#b45309",
    colorLight: "#fef3c7",
    ctaLink: "/apply/dharamshala",
    facilityIcons: [
      { icon: "BedDouble" },
      { icon: "Car" },
      { icon: "Utensils" },
      { icon: "Wifi" },
      { icon: "Droplets" },
      { icon: "Shield" },
    ],
    eligibilityCount: 5,
  },
};

export function generateStaticParams() {
  return [
    { id: "boys-hostel" },
    { id: "girls-hostel" },
    { id: "dharamshala" },
  ];
}

export default async function InstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = institutionsConfig[id];
  const t = await getTranslations("Public.institutions");

  if (!config) {
    return (
      <PublicLayout>
        <div
          className="flex items-center justify-center py-32"
          style={{ background: "var(--bg-page)" }}
        >
          <div className="text-center">
            <h1
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {t("notFound")}
            </h1>
            <Link
              href="/"
              className="underline"
              style={{ color: "var(--color-navy-600)" }}
            >
              {t("returnHome")}
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const { key, color, colorLight, ctaLink, facilityIcons, eligibilityCount } =
    config;

  const facilities = facilityIcons.map((f, i) => ({
    icon: f.icon,
    name: t(`${key}.facility${i + 1}Name`),
    description: t(`${key}.facility${i + 1}Desc`),
  }));

  const eligibility = Array.from({ length: eligibilityCount }, (_, i) =>
    t(`${key}.eligibility${i + 1}`)
  );

  return (
    <PublicLayout>
      <PageHero title={t(`${key}.title`)} subtitle={t(`${key}.subtitle`)} />

      <section className="px-4 py-16" style={{ background: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          {/* Overview */}
          <div className="mb-16">
            <h2
              className="text-2xl font-bold mb-4"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {t("sectionOverview")}
            </h2>
            <p
              className="text-base leading-relaxed max-w-4xl"
              style={{ color: "var(--text-secondary)" }}
            >
              {t(`${key}.overview`)}
            </p>
          </div>

          {/* Facilities Grid */}
          <div className="mb-16">
            <h2
              className="text-2xl font-bold mb-8"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {t("sectionFacilities")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility, index) => (
                <div
                  key={index}
                  className="rounded-xl p-6 transition-shadow duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: "var(--surface-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: colorLight,
                      color: color,
                    }}
                  >
                    {iconMap[facility.icon]}
                  </div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {facility.name}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {facility.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility */}
          <div className="mb-16">
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {t("sectionEligibility")}
            </h2>
            <div
              className="rounded-xl p-6 md:p-8"
              style={{
                backgroundColor: "var(--surface-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <ul className="flex flex-col gap-3">
                {eligibility.map((criterion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Card */}
            <div
              className="rounded-xl p-6 md:p-8"
              style={{
                backgroundColor: "var(--surface-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <h3
                className="text-lg font-bold mb-6"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {t("sectionContact")}
              </h3>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <MapPin
                    size={20}
                    style={{ color: color, flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t(`${key}.location`)}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone
                    size={20}
                    style={{ color: color, flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t(`${key}.phone`)}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock
                    size={20}
                    style={{ color: color, flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t(`${key}.hours`)}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div
              className="rounded-xl p-6 md:p-8 flex flex-col justify-center items-center text-center"
              style={{
                backgroundColor: colorLight,
                border: `1px solid ${color}20`,
              }}
            >
              <h3
                className="text-lg font-bold mb-3"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {t("readyToJoin")}
              </h3>
              <p
                className="text-sm mb-6 max-w-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("readyToJoinDesc")}
              </p>
              <Link
                href={ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
                style={{
                  backgroundColor: color,
                  color: "#ffffff",
                }}
              >
                {t(`${key}.ctaLabel`)}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
