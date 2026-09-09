import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Mail,
} from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          These Terms and Conditions ("Terms") govern your access to and use of
          INOS and related services operated by Rippotai Architecture ("INOS",
          "we", "us", or "our").
        </p>

        <p>
          By accessing or using INOS, you agree to be bound by these Terms. If
          you do not agree with these Terms, you should not use the service.
        </p>
      </>
    ),
  },

  {
    title: "2. About INOS",
    content: (
      <>
        <p>
          INOS is an integrated business operations platform designed to help
          organizations manage business and operational workflows from a
          centralized application.
        </p>

        <p>
          Depending on your organization's configuration, INOS may provide
          functionality for projects, clients, vendors, procurement, documents,
          tasks, calendars, reporting, workflows, and integrations with
          third-party services.
        </p>
      </>
    ),
  },

  {
    title: "3. User Accounts",
    content: (
      <>
        <p>
          Certain INOS features require an account. You are responsible for
          providing accurate information and maintaining the confidentiality of
          your account credentials.
        </p>

        <p>
          You are responsible for activity performed through your account unless
          such activity resulted from unauthorized access that was not
          reasonably within your control.
        </p>

        <p>
          You must notify the appropriate INOS administrator if you believe your
          account has been compromised.
        </p>
      </>
    ),
  },

  {
    title: "4. Organization Accounts and Access",
    content: (
      <>
        <p>
          INOS may be provided to users through an organization, company, or
          other business entity.
        </p>

        <p>
          Organization administrators may manage user accounts, permissions,
          roles, access to projects, documents, integrations, and other
          organization-level functionality.
        </p>

        <p>
          Your access to organization data may therefore be controlled by the
          organization that provides your INOS account.
        </p>
      </>
    ),
  },

  {
    title: "5. Acceptable Use",
    content: (
      <>
        <p>You agree not to:</p>

        <ul>
          <li>
            Use INOS for unlawful, fraudulent, malicious, or unauthorized
            purposes.
          </li>
          <li>
            Attempt to gain unauthorized access to another user's account,
            organization, system, or data.
          </li>
          <li>
            Interfere with the security, availability, or operation of INOS.
          </li>
          <li>
            Upload malicious software, code, or content intended to compromise
            systems.
          </li>
          <li>
            Circumvent authentication, authorization, usage restrictions, or
            other security controls.
          </li>
          <li>Use INOS to violate applicable laws or third-party rights.</li>
        </ul>
      </>
    ),
  },

  {
    title: "6. User Content and Business Data",
    content: (
      <>
        <p>
          You or your organization retain ownership of business information,
          documents, records, and other content submitted to INOS, subject to
          the rights necessary for us to operate the service.
        </p>

        <p>
          You are responsible for ensuring that you have the necessary rights
          and permissions to upload, store, process, or share content through
          INOS.
        </p>

        <p>
          We may process submitted content only as reasonably necessary to
          provide, secure, maintain, and improve the service and as otherwise
          described in our Privacy Policy.
        </p>
      </>
    ),
  },

  {
    title: "7. Third-Party Integrations",
    content: (
      <>
        <p>
          INOS may allow users to connect third-party services such as Google,
          Microsoft, Zoho, or other supported platforms.
        </p>

        <p>
          When you connect a third-party service, you authorize INOS to
          communicate with that service according to the permissions you grant
          and the applicable third party's terms and policies.
        </p>

        <p>
          Third-party services are operated independently from INOS. We are not
          responsible for changes, outages, policies, functionality, or security
          practices of third-party services.
        </p>
      </>
    ),
  },

  {
    title: "8. Google Services",
    content: (
      <>
        <p>
          Where Google integrations are available, INOS may provide features
          that interact with Google Calendar and Google Tasks after you grant
          the appropriate OAuth permissions.
        </p>

        <p>
          You may revoke Google access through your Google Account settings or
          disconnect the integration through INOS where supported.
        </p>

        <p>
          Use of Google services is also subject to Google's applicable terms,
          policies, and privacy practices.
        </p>
      </>
    ),
  },

  {
    title: "9. Intellectual Property",
    content: (
      <>
        <p>
          INOS's software, interface, branding, visual design, logos,
          documentation, and underlying technology are owned by or licensed to
          Rippotai Architecture and are protected by applicable intellectual
          property laws.
        </p>

        <p>
          These Terms do not transfer ownership of INOS intellectual property to
          you.
        </p>
      </>
    ),
  },

  {
    title: "10. Availability and Service Changes",
    content: (
      <>
        <p>
          We aim to maintain reliable availability of INOS but do not guarantee
          that the service will always be uninterrupted, error-free, or
          available at all times.
        </p>

        <p>
          We may modify, improve, suspend, or discontinue features of INOS where
          reasonably necessary for maintenance, security, business requirements,
          or technical reasons.
        </p>
      </>
    ),
  },

  {
    title: "11. Security",
    content: (
      <>
        <p>
          We use reasonable technical and organizational safeguards to protect
          the INOS platform and information processed through it.
        </p>

        <p>
          However, no online system can guarantee complete security. Users
          should maintain appropriate security practices, including protecting
          credentials and using trusted devices and networks.
        </p>
      </>
    ),
  },

  {
    title: "12. Disclaimer",
    content: (
      <>
        <p>
          INOS is provided on an "as available" basis. To the extent permitted
          by applicable law, we disclaim warranties that the service will always
          be uninterrupted, completely secure, or free of errors.
        </p>

        <p>
          INOS is a software platform and does not replace professional,
          financial, legal, accounting, engineering, construction, or other
          specialized advice where such advice is required.
        </p>
      </>
    ),
  },

  {
    title: "13. Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by applicable law, Rippotai
          Architecture will not be liable for indirect, incidental, special,
          consequential, or punitive damages arising from the use of or
          inability to use INOS.
        </p>

        <p>
          Nothing in these Terms excludes or limits liability that cannot
          legally be excluded or limited under applicable law.
        </p>
      </>
    ),
  },

  {
    title: "14. Suspension or Termination",
    content: (
      <>
        <p>
          Access to INOS may be suspended or terminated if an account violates
          these Terms, creates a security risk, is used unlawfully, or where
          termination is otherwise reasonably necessary.
        </p>

        <p>
          Organizations may also manage or terminate access for users under
          their organizational accounts.
        </p>
      </>
    ),
  },

  {
    title: "15. Privacy",
    content: (
      <>
        <p>
          Your use of INOS is also governed by our Privacy Policy, which
          explains how information is collected, used, stored, and protected.
        </p>

        <p>
          Please review the{" "}
          <Link
            to="/privacy-policy"
            className="font-medium text-[#1F453B] hover:underline"
          >
            INOS Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },

  {
    title: "16. Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms from time to time to reflect changes to
          INOS, legal requirements, or our business practices.
        </p>

        <p>
          Updated Terms will be published on this page. Your continued use of
          INOS after an update becomes effective constitutes acceptance of the
          revised Terms to the extent permitted by applicable law.
        </p>
      </>
    ),
  },

  {
    title: "17. Governing Law",
    content: (
      <>
        <p>
          These Terms shall be interpreted and governed according to the
          applicable laws governing the relationship between you and Rippotai
          Architecture, without prejudice to any mandatory rights or protections
          available under applicable law.
        </p>
      </>
    ),
  },

  {
    title: "18. Contact",
    content: (
      <>
        <p>
          If you have questions about these Terms or the INOS platform, please
          contact us.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Mail className="h-5 w-5 text-[#1F453B]" />

          <div>
            <p className="font-medium text-slate-900">INOS Support</p>

            <a
              href="mailto:support@rippotaiarchitecture.com"
              className="text-sm text-[#1F453B] hover:underline"
            >
              support@rippotaiarchitecture.com
            </a>
          </div>
        </div>
      </>
    ),
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F7F9F8] text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B]">
              <FileText className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight text-[#1F453B]">
                INOS
              </div>

              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Terms & Conditions
              </div>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#1F453B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to INOS
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1F453B]/10 bg-[#1F453B]/5 px-3 py-1.5 text-xs font-medium text-[#1F453B]">
              <UserCheck className="h-3.5 w-3.5" />
              Service terms
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Terms & Conditions
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              These terms govern your use of INOS and establish the rules and
              responsibilities applicable to users of the platform.
            </p>

            <p className="mt-6 text-sm text-slate-500">
              Effective date: September 9, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ShieldCheck className="h-5 w-5 text-[#1F453B]" />

              <p className="mt-3 font-semibold text-slate-900">Secure usage</p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use INOS responsibly and protect your account.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <UserCheck className="h-5 w-5 text-[#1F453B]" />

              <p className="mt-3 font-semibold text-slate-900">
                User responsibility
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Keep your account and submitted information secure.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <AlertTriangle className="h-5 w-5 text-[#1F453B]" />

              <p className="mt-3 font-semibold text-slate-900">
                Third-party services
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Connected services remain subject to their own terms.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {section.title}
                </h2>

                <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600 [&_li]:ml-5 [&_li]:list-disc">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Rippotai Architecture. All rights
            reserved.
          </p>

          <div className="flex gap-5">
            <Link to="/privacy-policy" className="hover:text-[#1F453B]">
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="font-medium text-[#1F453B]"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
