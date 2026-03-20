import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";
import PageHero from "@/components/public/PageHero";
import { Building2, Users, Home, CheckCircle, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

type AdmissionId = "boys-hostel" | "girls-hostel" | "dharamshala";

interface AdmissionConfig {
  key: "boysHostel" | "girlsHostel" | "dharamshala";
  icon: typeof Building2;
  themeColor: string;
  themeBg: string;
  themeBorder: string;
  applyLink: string;
  stepCount: number;
  docCount: number;
}

const admissionsConfig: Record<AdmissionId, AdmissionConfig> = {
  "boys-hostel": {
    key: "boysHostel",
    icon: Building2,
    themeColor: "var(--color-navy-700)",
    themeBg: "var(--color-navy-50, #eff3f8)",
    themeBorder: "var(--color-navy-200, #b0c4de)",
    applyLink: "/apply/boys-hostel/contact",
    stepCount: 5,
    docCount: 6,
  },
  "girls-hostel": {
    key: "girlsHostel",
    icon: Users,
    themeColor: "#9f1239",
    themeBg: "#fff1f2",
    themeBorder: "#fecdd3",
    applyLink: "/apply/girls-ashram/contact",
    stepCount: 5,
    docCount: 6,
  },
  dharamshala: {
    key: "dharamshala",
    icon: Home,
    themeColor: "#92400e",
    themeBg: "#fffbeb",
    themeBorder: "#fde68a",
    applyLink: "/apply/dharamshala/contact",
    stepCount: 4,
    docCount: 2,
  },
};

const validIds: AdmissionId[] = ["boys-hostel", "girls-hostel", "dharamshala"];

export function generateStaticParams() {
  return validIds.map((id) => ({ id }));
}

export default async function AdmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = admissionsConfig[id as AdmissionId];
  const t = await getTranslations("Public.admissions");

  if (!config) {
    return (
      <PublicLayout>
        <div
          style={{
            textAlign: "center",
            padding: "5rem 1rem",
            color: "var(--text-secondary)",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "var(--text-primary)",
            }}
          >
            {t("notFound")}
          </h1>
          <p>{t("notFoundDesc")}</p>
        </div>
      </PublicLayout>
    );
  }

  const { key, themeColor, themeBg, themeBorder, applyLink, stepCount, docCount } = config;
  const IconComponent = config.icon;
  const isDharamshala = id === "dharamshala";

  const steps = Array.from({ length: stepCount }, (_, i) =>
    t(`${key}.step${i + 1}`)
  );

  const documents = Array.from({ length: docCount }, (_, i) =>
    t(`${key}.doc${i + 1}`)
  );

  return (
    <PublicLayout>
      <PageHero title={t(`${key}.title`)} subtitle={t(`${key}.subtitle`)}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "1rem",
            backgroundColor: "rgba(255,255,255,0.15)",
            marginBottom: "1.25rem",
          }}
        >
          <IconComponent size={28} color="var(--text-inverse)" />
        </div>
      </PageHero>

      {/* Two-column grid */}
      <section
        style={{
          backgroundColor: "var(--bg-page)",
          padding: "3rem 1rem",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          style={{
            maxWidth: "72rem",
            marginInline: "auto",
          }}
        >
          {/* Left: Process Steps */}
          <div
            style={{
              backgroundColor: "var(--surface-primary)",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-primary)",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.25rem",
                fontFamily: "var(--font-serif)",
              }}
            >
              {isDharamshala
                ? t("bookingProcess")
                : t("applicationProcess")}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              {isDharamshala
                ? t("bookingProcessDesc")
                : t("applicationProcessDesc")}
            </p>

            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {steps.map((step, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      backgroundColor: themeBg,
                      color: themeColor,
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${themeBorder}`,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      paddingTop: "0.25rem",
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: Required Documents */}
          <div
            style={{
              backgroundColor: "var(--surface-primary)",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-primary)",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.25rem",
                fontFamily: "var(--font-serif)",
              }}
            >
              {t("requiredDocuments")}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              {t("requiredDocumentsDesc")}
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {documents.map((doc, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <CheckCircle
                    size={20}
                    color={themeColor}
                    style={{ flexShrink: 0, marginTop: "0.125rem" }}
                  />
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {doc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Full-width CTA Card */}
      <section
        style={{
          backgroundColor: "var(--bg-page)",
          padding: "0 1rem 3rem",
        }}
      >
        <div
          style={{
            maxWidth: "72rem",
            marginInline: "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-inverse, #1a365d)",
              borderRadius: "0.75rem",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "1rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-inverse)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {isDharamshala ? t("readyToBook") : t("readyToBegin")}
            </h2>
            <p
              style={{
                color: "var(--color-navy-200, #b0c4de)",
                fontSize: "0.95rem",
                maxWidth: "32rem",
              }}
            >
              {isDharamshala
                ? t("readyToBookDesc")
                : t("readyToBeginDesc")}
            </p>
            <Link
              href={applyLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                padding: "0.75rem 2rem",
                backgroundColor: "var(--bg-accent)",
                color: "var(--text-inverse)",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
            >
              {t(`${key}.ctaLabel`)}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
