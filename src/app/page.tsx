import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";

export default function Home() {
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
            Welcome to Jain Hostel Management
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
            style={{ color: "var(--color-navy-200)" }}
          >
            Providing quality accommodation and education support for the Jain community since 1940
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
              Apply Now
            </Link>
            <Link href="/track" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
              Check Status
            </Link>
            <Link href="/login" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center" style={{ backgroundColor: "var(--color-gold-100)", color: "var(--color-gold-800)", borderColor: "transparent" }}>
              Login
            </Link>
            <Link href="/login/parent" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center" style={{ backgroundColor: "#2563eb", borderColor: "transparent" }}>
              Parent
            </Link>
          </div>
        </div>
      </section>

      {/* Hostel Overview & Values */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Our Values &amp; Mission
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Committed to providing safe, comfortable, and spiritually enriching accommodation
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
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Community First</h3>
              <p style={{ color: "var(--text-secondary)" }}>Building a supportive Jain community through shared values and mutual respect</p>
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
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Educational Support</h3>
              <p style={{ color: "var(--text-secondary)" }}>Fostering academic excellence with study facilities and mentorship programs</p>
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
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Cultural Values</h3>
              <p style={{ color: "var(--text-secondary)" }}>Upholding Jain principles and traditions through daily practices and spiritual activities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discipline & Safety Highlights */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--surface-secondary)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Discipline &amp; Safety
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Maintaining high standards of conduct and safety for all residents
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F550;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Timely Schedule</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Fixed timings for meals, studies, and lights out</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F46E;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>24/7 Security</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Professional security staff and CCTV monitoring</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F4CB;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Code of Conduct</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Strict adherence to hostel rules and regulations</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">&#x1F3E5;</div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Medical Care</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>First-aid facilities and tie-ups with nearby hospitals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Showcase */}
      <section className="px-6 py-16" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Modern Amenities
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Well-equipped facilities for comfortable living and holistic development
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
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Spacious Rooms</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Well-ventilated rooms with modern furniture</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Library &amp; Study Hall</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Quiet study spaces with extensive book collection</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Recreation Room</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Indoor games and entertainment facilities</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Mess &amp; Dining</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nutritious vegetarian meals with Jain dietary compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Laundry Service</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Regular laundry and ironing services</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--bg-accent)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-on-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Wi-Fi Internet</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>High-speed internet connectivity throughout the premises</p>
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
              Choose Your Path
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Select the accommodation type that best suits your needs
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
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Boys Hostel</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    Modern accommodation for male students with focus on academic excellence and character building
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> 2-3 person sharing rooms
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Study hall and library
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Sports and recreation
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">Apply to Boys Hostel</span>
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
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Girls Ashram</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    Safe and nurturing environment for female students with emphasis on holistic development
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Enhanced security measures
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Women&apos;s study areas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Cultural and spiritual activities
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">Apply to Girls Ashram</span>
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
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Dharamshala</h3>
                  <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                    Spiritual retreat and temporary accommodation for pilgrims and visitors seeking peaceful stay
                  </p>
                  <ul className="text-left mb-6 space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Prayer and meditation halls
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Simple, clean accommodation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">&#x2713;</span> Community kitchen facilities
                    </li>
                  </ul>
                  <span className="btn-primary w-full inline-flex items-center justify-center mt-auto">Book Dharamshala</span>
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
              Admission Process
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Simple and transparent admission journey from application to check-in
            </p>
          </div>

          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute top-8 left-0 right-0 h-1" style={{ backgroundColor: "var(--border-primary)" }}></div>
              <div className="grid grid-cols-7 gap-4 relative">
                {[
                  { step: 1, title: "Apply", desc: "Submit online application" },
                  { step: 2, title: "Verify", desc: "OTP verification" },
                  { step: 3, title: "Interview", desc: "Personal interview" },
                  { step: 4, title: "Approve", desc: "Final approval" },
                  { step: 5, title: "Payment", desc: "Fee payment" },
                  { step: 6, title: "Allocate", desc: "Room assignment" },
                  { step: 7, title: "Check-in", desc: "Move in" }
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: "var(--bg-accent)" }}
                    >
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Vertical Timeline */}
          <div className="lg:hidden">
            <div className="space-y-6">
              {[
                { step: 1, title: "Apply", desc: "Submit online application with required documents" },
                { step: 2, title: "Verify", desc: "OTP verification for mobile/email authentication" },
                { step: 3, title: "Interview", desc: "Personal interview with superintendent/trustee" },
                { step: 4, title: "Approve", desc: "Final approval by trustee committee" },
                { step: 5, title: "Payment", desc: "Payment of fees and security deposit" },
                { step: 6, title: "Allocate", desc: "Room allocation based on availability" },
                { step: 7, title: "Check-in", desc: "Formal check-in and orientation" }
              ].map((item) => (
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
                    <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                    <p style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
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
                <h3 className="text-heading-4">Application Process</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Check eligibility criteria",
                  "Create account / Login",
                  "Fill online application form",
                  "Upload required documents",
                  "Submit and track application",
                ].map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="number-badge">{index + 1}</span>
                    <span className="text-body">{step}</span>
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
                <h3 className="text-heading-4">Required Documents</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Birth Certificate",
                  "Caste Certificate (Jain Community)",
                  "College Admission Letter",
                  "Previous Academic Records",
                  "Passport Size Photographs",
                  "Recommendation Letter from Jain Sangh",
                ].map((doc) => (
                  <li key={doc} className="flex items-center gap-3">
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
                    <span className="text-body">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Announcements & Notices */}
          <section className="mt-12">
            <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Announcements &amp; Notices
            </h3>
            <div className="space-y-4">
              <div className="card p-6 border-l-4" style={{ borderLeftColor: "var(--color-red-500)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2" style={{ backgroundColor: "var(--color-red-100)", color: "var(--color-red-700)" }}>
                      URGENT
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      Last Date for Boys Hostel Applications Extended
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      Application deadline for Boys Hostel admissions extended to December 31, 2025. Apply now to secure your spot.
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
                      ADMISSION
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      Girls Ashram Interview Schedule
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      Shortlisted candidates for Girls Ashram will be interviewed from January 5-7, 2025. Check your application status for details.
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
                      FACILITY
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      New Library Opening Soon
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      Our expanded library facility with 24/7 study access will open from January 15, 2025 for all residents.
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
                      HOLIDAY
                    </span>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      Winter Vacation Schedule
                    </h4>
                    <p style={{ color: "var(--text-secondary)" }}>
                      Hostel will remain closed from December 25 to January 2, 2026. All residents must vacate by December 24.
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
              Begin Your Journey With Us
            </h3>
            <p
              className="text-lg mb-8"
              style={{ color: "var(--color-navy-200)" }}
            >
              Join our community of learners and experience quality accommodation with spiritual growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="btn-primary text-lg px-8 py-4">Apply Now</Link>
              <Link href="/track" className="btn-primary text-lg px-8 py-4" style={{ backgroundColor: "var(--color-navy-100)", color: "var(--color-navy-800)", border: "none" }}>Check Application Status</Link>
              <Link href="/login" className="btn-primary text-lg px-8 py-4" style={{ backgroundColor: "var(--text-inverse)", color: "var(--color-navy-800)", border: "none" }}>Login</Link>
            </div>
            <p
              className="mt-6 text-sm"
              style={{ color: "var(--color-navy-300)" }}
            >
              Need help? Contact our admissions team at +91 22 2414 1234
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
