import Image from "next/image";
import { BookOpen, Shield, Heart } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import PublicLayout from "@/components/public/PublicLayout";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("Public.about");

  const objectives = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t("empowerment"),
      description: t("empowermentDesc"),
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t("spiritualIntegrity"),
      description: t("spiritualIntegrityDesc"),
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: t("service"),
      description: t("serviceDesc"),
    },
  ];

  const timelineEvents = [
    {
      year: "1852",
      title: t("timeline1852Title"),
      description: t("timeline1852Desc"),
    },
    {
      year: "1900",
      title: t("timeline1900Title"),
      description: t("timeline1900Desc"),
    },
    {
      year: "1914",
      title: t("timeline1914Title"),
      description: t("timeline1914Desc"),
    },
    {
      year: "1940",
      title: t("timeline1940Title"),
      description: t("timeline1940Desc"),
    },
    {
      year: "1972",
      title: t("timeline1972Title"),
      description: t("timeline1972Desc"),
    },
    {
      year: "Present",
      title: t("timelinePresentTitle"),
      description: t("timelinePresentDesc"),
    },
  ];

  const facilities = [
    {
      title: t("boysHostel"),
      description: t("boysHostelDesc"),
      image: "/hostel-building.png",
    },
    {
      title: t("girlsAshram"),
      description: t("girlsAshramDesc"),
      image: "/hostel-room.png",
    },
    {
      title: t("dharamshala"),
      description: t("dharamshalaDesc"),
      image: "/hostel-temple.png",
    },
  ];

  return (
    <PublicLayout>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Mission Statement */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2
            className="text-3xl font-bold mb-8"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("mission")}
          </h2>
          <blockquote
            className="text-lg italic leading-relaxed"
            style={{
              color: "var(--text-secondary)",
              borderLeft: "4px solid var(--bg-accent)",
              paddingLeft: "1.5rem",
              textAlign: "left",
            }}
          >
            &ldquo;{t("missionText")}&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Core Objectives */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--surface-secondary)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            className="text-3xl font-bold mb-12 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("coreObjectives")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {objectives.map((obj) => (
              <div
                key={obj.title}
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                  style={{
                    backgroundColor: "var(--color-navy-50)",
                    color: "var(--color-navy-700)",
                  }}
                >
                  {obj.icon}
                </div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {obj.title}
                </h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  {obj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <h2
            className="text-3xl font-bold mb-8 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("aboutUs")}
          </h2>
          <div
            className="space-y-6 text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>{t("aboutPara1")}</p>
            <p>{t("aboutPara2")}</p>
            <p>{t("aboutPara3")}</p>
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--surface-secondary)" }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <h2
            className="text-3xl font-bold mb-12 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("history")}
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: "var(--bg-accent)" }}
            />

            <div className="space-y-12">
              {timelineEvents.map((event, index) => (
                <div
                  key={event.year}
                  className={`relative flex flex-col md:flex-row items-start ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div
                    className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full -translate-x-1/2 z-10"
                    style={{
                      backgroundColor: "var(--bg-accent)",
                      border: "3px solid var(--surface-primary)",
                    }}
                  />

                  {/* Content */}
                  <div
                    className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                      index % 2 === 0
                        ? "md:pr-8 md:text-right"
                        : "md:pl-8 md:text-left"
                    }`}
                  >
                    <span
                      className="inline-block text-sm font-bold px-3 py-1 rounded-full mb-2"
                      style={{
                        backgroundColor: "var(--color-gold-100)",
                        color: "var(--color-gold-800)",
                      }}
                    >
                      {event.year}
                    </span>
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {event.title}
                    </h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Institutions & Facilities */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            className="text-3xl font-bold mb-12 text-center"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("institutionsFacilities")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {facilities.map((facility) => (
              <div
                key={facility.title}
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div className="relative h-48">
                  <Image
                    src={facility.image}
                    alt={facility.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    {facility.title}
                  </h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {facility.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
