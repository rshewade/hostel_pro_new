import Link from "next/link";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ApplyPage() {
  const t = await getTranslations("Public.apply");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Header */}
      <header
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="/logo.png"
                alt="Hirachand Gumanji Family Charitable Trust"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
              >
                Hirachand Gumanji Family
              </h1>
              <p className="text-caption">Charitable Trust</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/apply" className="nav-link text-primary">Apply Now</Link>
            <Link href="/track" className="nav-link">Check Status</Link>
            <Link href="/login" className="nav-link">Login</Link>
          </nav>
        </div>
      </header>

      {/* Progress Header */}
      <section className="px-6 py-4" style={{ backgroundColor: "var(--surface-secondary)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: "var(--bg-accent)" }}
                >
                  1
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {t("selectVertical")}
                </span>
              </div>
              <div className="h-px w-16" style={{ backgroundColor: "var(--border-primary)" }}></div>
              <div className="flex items-center gap-2 opacity-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: "var(--color-gray-400)" }}
                >
                  2
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("contactDetails")}
                </span>
              </div>
              <div className="h-px w-16" style={{ backgroundColor: "var(--border-primary)" }}></div>
              <div className="flex items-center gap-2 opacity-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: "var(--color-gray-400)" }}
                >
                  3
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("otpVerification")}
                </span>
              </div>
              <div className="h-px w-16" style={{ backgroundColor: "var(--border-primary)" }}></div>
              <div className="flex items-center gap-2 opacity-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: "var(--color-gray-400)" }}
                >
                  4
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("applicationForm")}
                </span>
              </div>
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span>{t("stepOf", { current: 1, total: 4 })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* DPDP Consent Banner */}
      <section className="px-6 py-6 bg-blue-50 border-b border-blue-200">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                {t("dataProtection")}
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                {t("dataProtectionDesc")}
              </p>
              <Link
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                {t("readPrivacyPolicy")} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {t("title")}
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
              {t("subtitle")}
            </p>
          </div>

          {/* Vertical Selection Cards */}
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {/* Boys Hostel Card */}
            <Link href="/apply/boys-hostel/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-500 h-full flex flex-col">
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-blue-100)" }}
                  >
                    <Users className="w-10 h-10" style={{ color: "var(--color-blue-600)" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    {t("boysHostel")}
                  </h3>
                  <p className="mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {t("boysHostelDesc")}
                  </p>
                  <ul className="space-y-3 text-left mb-6">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>2-3 person sharing rooms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Study hall & library access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Sports & recreation facilities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>24/7 security and warden supervision</span>
                    </li>
                  </ul>
                  <button className="btn-primary w-full mt-auto">
                    {t("applyBoysHostel")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </Link>

            {/* Girls Ashram Card */}
            <Link href="/apply/girls-ashram/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-500 h-full flex flex-col">
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-purple-100)" }}
                  >
                    <Users className="w-10 h-10" style={{ color: "var(--color-purple-600)" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    {t("girlsAshram")}
                  </h3>
                  <p className="mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {t("girlsAshramDesc")}
                  </p>
                  <ul className="space-y-3 text-left mb-6">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Enhanced security measures</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Women's study &amp; prayer areas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Cultural &amp; spiritual activities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Matron &amp; warden care</span>
                    </li>
                  </ul>
                  <button className="btn-primary w-full mt-auto">
                    {t("applyGirlsAshram")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </Link>

            {/* Dharamshala Card */}
            <Link href="/apply/dharamshala/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-amber-500 h-full flex flex-col">
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-amber-100)" }}
                  >
                    <Shield className="w-10 h-10" style={{ color: "var(--color-amber-600)" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    {t("dharamshala")}
                  </h3>
                  <p className="mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {t("dharamshalaDesc")}
                  </p>
                  <ul className="space-y-3 text-left mb-6">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Prayer &amp; meditation halls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Simple, clean accommodation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Community kitchen facilities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500" />
                      <span style={{ color: "var(--text-secondary)" }}>Affordable short-term stay</span>
                    </li>
                  </ul>
                  <button className="btn-primary w-full mt-auto">
                    {t("bookDharamshala")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </Link>
          </div>

          {/* Important Information */}
          <div className="card p-8 bg-blue-50 border border-blue-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Clock className="w-5 h-5 text-blue-600" />
              {t("importantInfo")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-semibold">•</span>
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {t("noAccountRequired")}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t("noAccountRequiredDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-semibold">•</span>
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {t("trackApplication")}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t("trackApplicationDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-semibold">•</span>
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {t("documentPreparation")}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t("documentPreparationDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
