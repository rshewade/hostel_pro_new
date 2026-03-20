import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const hero = await getTranslations("Public.hero");
  const values = await getTranslations("Public.values");
  const discipline = await getTranslations("Public.discipline");
  const amenities = await getTranslations("Public.amenities");
  const choose = await getTranslations("Public.choosePath");
  const admission = await getTranslations("Public.admissionProcess");
  const appProcess = await getTranslations("Public.applicationProcess");
  const docs = await getTranslations("Public.requiredDocuments");
  const announce = await getTranslations("Public.announcements");
  const cta = await getTranslations("Public.cta");

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section
        className="relative py-20 px-6"
        style={{
          backgroundColor: "var(--bg-brand)",
          backgroundImage: "linear-gradient(rgba(26, 54, 93, 0.9), rgba(26, 54, 93, 0.95))",
        }}
      >
        <div className="mx-auto max-w-6xl text-center">
          <div
            className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-accent)" }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--text-on-accent)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{
              color: "var(--text-inverse)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {hero("title")}
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
            style={{ color: "var(--color-navy-200)" }}
          >
            {hero("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
              {hero("applyNow")}
            </Link>
            <Link href="/track" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
              {hero("checkStatus")}
            </Link>
            <Link href="/login" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center" style={{ backgroundColor: "var(--color-gold-100)", color: "var(--color-gold-800)", borderColor: "transparent" }}>
              {hero("login")}
            </Link>
            <Link href="/login/parent" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center" style={{ backgroundColor: "#2563eb", borderColor: "transparent" }}>
              {hero("parent")}
            </Link>
          </div>
        </div>
      </section>

      {/* Hostel Overview & Values */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {values("title")}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {values("subtitle")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{values("communityFirst")}</h3>
              <p style={{ color: "var(--text-secondary)" }}>{values("communityFirstDesc")}</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{values("educationalSupport")}</h3>
              <p style={{ color: "var(--text-secondary)" }}>{values("educationalSupportDesc")}</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{values("culturalValues")}</h3>
              <p style={{ color: "var(--text-secondary)" }}>{values("culturalValuesDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discipline & Safety Highlights */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--surface-secondary)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {discipline("title")}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {discipline("subtitle")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F550;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{discipline("timelySchedule")}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{discipline("timelyScheduleDesc")}</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F46E;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{discipline("security")}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{discipline("securityDesc")}</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F4CB;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{discipline("codeOfConduct")}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{discipline("codeOfConductDesc")}</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F3E5;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{discipline("medicalCare")}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{discipline("medicalCareDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Showcase */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {amenities("title")}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {amenities("subtitle")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("spaciousRooms")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("spaciousRoomsDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("library")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("libraryDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("recreation")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("recreationDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("messDining")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("messDiningDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("laundry")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("laundryDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{amenities("wifi")}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{amenities("wifiDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Selection Cards */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--surface-secondary)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {choose("title")}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {choose("subtitle")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Boys Hostel Card */}
            <Link href="/apply/boys-hostel/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" style={{ border: "2px solid var(--border-primary)" }}>
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-blue-100)" }}
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-blue-600)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{choose("boysHostel")}</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    {choose("boysHostelDesc")}
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("boysHostelFeature1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("boysHostelFeature2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("boysHostelFeature3")}
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">{choose("applyBoysHostel")}</span>
                </div>
              </div>
            </Link>

            {/* Girls Ashram Card */}
            <Link href="/apply/girls-ashram/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" style={{ border: "2px solid var(--border-primary)" }}>
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-purple-100)" }}
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-purple-600)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{choose("girlsAshram")}</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    {choose("girlsAshramDesc")}
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("girlsAshramFeature1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("girlsAshramFeature2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("girlsAshramFeature3")}
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">{choose("applyGirlsAshram")}</span>
                </div>
              </div>
            </Link>

            {/* Dharamshala Card */}
            <Link href="/apply/dharamshala/contact" className="block h-full">
              <div className="card p-8 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" style={{ border: "2px solid var(--border-primary)" }}>
                <div className="text-center flex flex-col flex-1">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-amber-100)" }}
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-amber-600)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{choose("dharamshala")}</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    {choose("dharamshalaDesc")}
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("dharamshalaFeature1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("dharamshalaFeature2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> {choose("dharamshalaFeature3")}
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">{choose("bookDharamshala")}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Admission Process Timeline */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {admission("title")}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {admission("subtitle")}
            </p>
          </div>

          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute top-8 left-0 right-0 h-1" style={{ backgroundColor: "var(--border-primary)" }}></div>
              <div className="grid grid-cols-7 gap-4 relative">
                {([
                  { step: 1, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
                  { step: 2, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
                  { step: 3, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
                  { step: 4, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
                  { step: 5, titleKey: "step5Title" as const, descKey: "step5Desc" as const },
                  { step: 6, titleKey: "step6Title" as const, descKey: "step6Desc" as const },
                  { step: 7, titleKey: "step7Title" as const, descKey: "step7Desc" as const },
                ]).map((item) => (
                  <div key={item.step} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: "var(--bg-accent)" }}
                    >
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{admission(item.titleKey)}</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{admission(item.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Vertical Timeline */}
          <div className="lg:hidden">
            <div className="space-y-6">
              {([
                { step: 1, titleKey: "step1Title" as const, descKey: "step1DescLong" as const },
                { step: 2, titleKey: "step2Title" as const, descKey: "step2DescLong" as const },
                { step: 3, titleKey: "step3Title" as const, descKey: "step3DescLong" as const },
                { step: 4, titleKey: "step4Title" as const, descKey: "step4DescLong" as const },
                { step: 5, titleKey: "step5Title" as const, descKey: "step5DescLong" as const },
                { step: 6, titleKey: "step6Title" as const, descKey: "step6DescLong" as const },
                { step: 7, titleKey: "step7Title" as const, descKey: "step7DescLong" as const },
              ]).map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: "var(--bg-accent)" }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{admission(item.titleKey)}</h3>
                    <p style={{ color: "var(--text-secondary)" }}>{admission(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Two Column Cards */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Application Process Card */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--color-gold-600)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-heading-4">{appProcess("title")}</h3>
              </div>
              <ul className="space-y-4">
                {(["step1", "step2", "step3", "step4", "step5"] as const).map((key, index) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className="number-badge">{index + 1}</span>
                    <span className="text-body">{appProcess(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Documents Card */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--color-gold-600)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-heading-4">{docs("title")}</h3>
              </div>
              <ul className="space-y-4">
                {(["doc1", "doc2", "doc3", "doc4", "doc5", "doc6"] as const).map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 flex-shrink-0 check-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-body">{docs(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Announcements & Notices */}
          <section className="mt-12">
            <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              {announce("title")}
            </h3>
            <div className="space-y-4">
              <div className="card p-6 border-l-4" style={{ borderLeftColor: "var(--color-red-500)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2" style={{ backgroundColor: "var(--color-red-100)", color: "var(--color-red-700)" }}>
                      {announce("urgent")}
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      {announce("notice1Title")}
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {announce("notice1Desc")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Dec 21, 2025</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4" style={{ borderLeftColor: "var(--color-blue-500)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2" style={{ backgroundColor: "var(--color-blue-100)", color: "var(--color-blue-700)" }}>
                      {announce("admission")}
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      {announce("notice2Title")}
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {announce("notice2Desc")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Dec 20, 2025</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4" style={{ borderLeftColor: "var(--color-green-500)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2" style={{ backgroundColor: "var(--color-green-100)", color: "var(--color-green-700)" }}>
                      {announce("facility")}
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      {announce("notice3Title")}
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {announce("notice3Desc")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Dec 19, 2025</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4" style={{ borderLeftColor: "var(--color-amber-500)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2" style={{ backgroundColor: "var(--color-amber-100)", color: "var(--color-amber-700)" }}>
                      {announce("holiday")}
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      {announce("notice4Title")}
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {announce("notice4Desc")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Dec 18, 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Enhanced CTA Section */}
          <section
            className="mt-12 rounded-2xl py-12 px-8 text-center"
            style={{ backgroundColor: "var(--bg-brand)" }}
          >
            <h3
              className="text-3xl font-bold mb-4"
              style={{
                color: "var(--text-inverse)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {cta("title")}
            </h3>
            <p
              className="text-lg mb-8"
              style={{ color: "var(--color-navy-200)" }}
            >
              {cta("subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="btn-primary text-lg px-8 py-4">{cta("applyNow")}</Link>
              <Link href="/track" className="btn-primary text-lg px-8 py-4" style={{ backgroundColor: "var(--color-navy-100)", color: "var(--color-navy-800)", border: "none" }}>{cta("checkApplicationStatus")}</Link>
              <Link href="/login" className="btn-primary text-lg px-8 py-4" style={{ backgroundColor: "var(--text-inverse)", color: "var(--color-navy-800)", border: "none" }}>{cta("login")}</Link>
            </div>
            <p
              className="mt-6 text-sm"
              style={{ color: "var(--color-navy-300)" }}
            >
              {cta("needHelp")}
            </p>
          </section>
        </div>
      </div>

      {/* Design System Link - Dev Only */}
      <Link
        href="/design-system"
        className="fixed bottom-4 right-4 px-4 py-2 rounded-md text-sm font-medium shadow-lg"
        style={{
          backgroundColor: 'var(--surface-primary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        Design System &rarr;
      </Link>

      {/* Working Application Demo - Dev Only */}
      <Link
        href="/demo"
        className="fixed bottom-4 left-4 px-4 py-2 rounded-md text-sm font-medium shadow-lg"
        style={{
          backgroundColor: 'var(--bg-brand)',
          color: 'var(--text-inverse)',
          border: '1px solid var(--border-primary)',
        }}
      >
        Working App Demo
      </Link>
    </PublicLayout>
  );
}
