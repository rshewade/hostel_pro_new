"use client";

import { useState, FormEvent } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import PublicLayout from "@/components/public/PublicLayout";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("Public.contact");

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: t("address"),
      lines: [
        t("addressLine1"),
        t("addressLine2"),
        t("addressLine3"),
        t("addressLine4"),
      ],
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: t("phone"),
      lines: ["+91 22 2414 1234", "+91 22 2414 5678"],
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: t("email"),
      lines: ["info@shgjaintrust.org", "admissions@shgjaintrust.org"],
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: t("officeHours"),
      lines: [t("mondayToSaturday"), t("timings"), t("sundayClosed")],
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    alert(t("thankYou"));
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-primary)",
    backgroundColor: "var(--surface-primary)",
    color: "var(--text-primary)",
    fontSize: "1rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "var(--text-primary)",
  };

  return (
    <PublicLayout>
      <PageHero title={t("title")} />

      {/* Contact Info Grid */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                  style={{
                    backgroundColor: "var(--color-navy-50)",
                    color: "var(--color-navy-700)",
                  }}
                >
                  {info.icon}
                </div>
                <h3
                  className="text-lg font-bold mb-3"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {info.title}
                </h3>
                <div style={{ color: "var(--text-secondary)" }}>
                  {info.lines.map((line, i) => (
                    <p key={i} className="text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Maps & Contact Form */}
      <section
        className="py-16"
        style={{ backgroundColor: "var(--surface-secondary)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid var(--border-primary)",
                minHeight: "400px",
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.0!2d72.8231!3d18.9647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDU3JzUyLjkiTiA3MsKwNDknMjMuMiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Seth Hirachand Gumanji Jain Trust Location"
              />
            </div>

            {/* Contact Form */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: "var(--surface-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {t("sendMessage")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" style={labelStyle}>
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("fullNamePlaceholder")}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    {t("emailAddress")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="phone" style={labelStyle}>
                    {t("phoneNumber")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phonePlaceholder")}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="message" style={labelStyle}>
                    {t("message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t("messagePlaceholder")}
                    rows={5}
                    required
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-lg font-semibold text-base transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "var(--bg-brand)",
                    color: "var(--text-inverse)",
                  }}
                >
                  {t("sendButton")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
