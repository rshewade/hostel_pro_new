"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { LanguageToggle } from "@/components/language-toggle";
import type { Locale } from "@/i18n/config";

interface NavItem {
  path?: string;
  labelKey: string;
  children?: { path: string; labelKey: string }[];
}

const navItems: NavItem[] = [
  { path: "/", labelKey: "home" },
  { path: "/about", labelKey: "about" },
  {
    labelKey: "institutions",
    children: [
      { path: "/institutions/boys-hostel", labelKey: "boysHostel" },
      { path: "/institutions/girls-hostel", labelKey: "girlsHostel" },
      { path: "/institutions/dharamshala", labelKey: "dharamshala" },
    ],
  },
  {
    labelKey: "admissions",
    children: [
      { path: "/admissions/boys-hostel", labelKey: "boysHostel" },
      { path: "/admissions/girls-hostel", labelKey: "girlsHostel" },
      { path: "/admissions/dharamshala", labelKey: "dharamshalaBooking" },
    ],
  },
  { path: "/trustees", labelKey: "trustees" },
  { path: "/gallery", labelKey: "gallery" },
  { path: "/news", labelKey: "news" },
  { path: "/donations", labelKey: "donate" },
  { path: "/contact", labelKey: "contact" },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const t = useTranslations("Public.nav");
  const th = useTranslations("Public.header");
  const locale = useLocale() as Locale;

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt={th("logoAlt")}
              width={48}
              height={48}
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <h1
                className="text-sm md:text-base font-bold leading-tight"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {th("trustName")}
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {th("trustSubtitle")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) =>
              item.children ? (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.labelKey)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className="px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t(item.labelKey)}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openDropdown === item.labelKey && (
                    <div
                      className="absolute top-full left-0 mt-0 w-48 rounded-md shadow-lg py-1 z-50"
                      style={{
                        backgroundColor: "var(--surface-primary)",
                        border: "1px solid var(--border-primary)",
                      }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className="block px-4 py-2 text-sm transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--color-navy-50)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          {t(child.labelKey)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.path}
                  href={item.path!}
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t(item.labelKey)}
                </Link>
              )
            )}
            <LanguageToggle currentLocale={locale} />
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageToggle currentLocale={locale} />
            <button
              className="p-2 rounded-md"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: "var(--text-primary)" }}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav
            className="lg:hidden py-4 border-t"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) =>
                item.children ? (
                  <div key={index} className="space-y-1">
                    <p
                      className="px-3 py-2 text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t(item.labelKey)}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        onClick={() => setMobileOpen(false)}
                        className="block px-6 py-2 text-sm rounded-md"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {t(child.labelKey)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    href={item.path!}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm rounded-md"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t(item.labelKey)}
                  </Link>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
