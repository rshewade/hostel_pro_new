"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import PageHero from "@/components/public/PageHero";
import { useTranslations } from "next-intl";

const faqKeys = ["1", "2", "3", "4", "5", "6", "7"] as const;

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations("Public.faqPage");

  const faqs = faqKeys.map((key) => ({
    question: t(`q${key}`),
    answer: t(`a${key}`),
  }));

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <section className="px-4 py-16" style={{ background: "var(--bg-page)" }}>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden transition-shadow duration-200"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                  boxShadow:
                    openIndex === index
                      ? "0 4px 12px rgba(0,0,0,0.08)"
                      : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150"
                  style={{
                    backgroundColor:
                      openIndex === index
                        ? "var(--surface-secondary)"
                        : "transparent",
                  }}
                >
                  <HelpCircle
                    size={20}
                    style={{ color: "var(--color-gold-500)", flexShrink: 0 }}
                  />
                  <span
                    className="flex-1 font-semibold text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    style={{
                      color: "var(--text-secondary)",
                      flexShrink: 0,
                      transform:
                        openIndex === index ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                {openIndex === index && (
                  <div
                    className="px-5 pb-5 pt-2"
                    style={{ paddingLeft: "3.25rem" }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
