"use client";

import { useState } from "react";
import { Building2, Home, Users } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import PageHero from "@/components/public/PageHero";
import { useTranslations } from "next-intl";

type TabKey = "boys" | "girls" | "dharamshala";

export default function FacilitiesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("boys");
  const t = useTranslations("Public.facilities");

  const rules: Record<TabKey, string[]> = {
    boys: [
      t("boysRule1"),
      t("boysRule2"),
      t("boysRule3"),
      t("boysRule4"),
      t("boysRule5"),
      t("boysRule6"),
      t("boysRule7"),
      t("boysRule8"),
    ],
    girls: [
      t("girlsRule1"),
      t("girlsRule2"),
      t("girlsRule3"),
      t("girlsRule4"),
      t("girlsRule5"),
      t("girlsRule6"),
      t("girlsRule7"),
    ],
    dharamshala: [
      t("dharamshalaRule1"),
      t("dharamshalaRule2"),
      t("dharamshalaRule3"),
      t("dharamshalaRule4"),
      t("dharamshalaRule5"),
      t("dharamshalaRule6"),
      t("dharamshalaRule7"),
    ],
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "boys", label: t("boysHostel"), icon: <Building2 size={18} /> },
    { key: "girls", label: t("girlsHostel"), icon: <Home size={18} /> },
    { key: "dharamshala", label: t("dharamshala"), icon: <Users size={18} /> },
  ];

  return (
    <PublicLayout>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <section className="px-4 py-16" style={{ background: "var(--bg-page)" }}>
        <div className="mx-auto max-w-4xl">
          {/* Tab buttons */}
          <div
            className="flex flex-wrap gap-2 mb-8 p-1.5 rounded-xl"
            style={{ backgroundColor: "var(--surface-secondary)" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor:
                    activeTab === tab.key
                      ? "var(--surface-primary)"
                      : "transparent",
                  color:
                    activeTab === tab.key
                      ? "var(--color-navy-700)"
                      : "var(--text-secondary)",
                  boxShadow:
                    activeTab === tab.key
                      ? "0 2px 8px rgba(0,0,0,0.08)"
                      : "none",
                  minWidth: "140px",
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Rules list */}
          <div
            className="rounded-xl p-6 md:p-8"
            style={{
              backgroundColor: "var(--surface-primary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {tabs.find((tab) => tab.key === activeTab)?.label}{" "}
              {t("rulesAndRegulations")}
            </h2>

            <ol className="flex flex-col gap-4">
              {rules[activeTab].map((rule, index) => (
                <li key={index} className="flex gap-4">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: "var(--bg-accent)",
                      color: "var(--color-navy-800)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <p
                    className="text-sm leading-relaxed pt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rule}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
