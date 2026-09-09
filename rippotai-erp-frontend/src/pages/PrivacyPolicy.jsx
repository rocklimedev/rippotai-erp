import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Database,
  CalendarDays,
  CheckCircle2,
  Mail,
} from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: (
      <>
        <p>
          This Privacy Policy explains how INOS ("INOS", "we", "us", or "our")
          collects, uses, stores, protects, and processes information when you
          use the INOS platform and its related services.
        </p>
        <p>
          INOS is an integrated business operations platform designed to help
          organizations manage projects, clients, procurement, documents, tasks,
          calendars, workflows, and other operational activities from a
          centralized workspace.
        </p>
        <p>
          By using INOS, you acknowledge that you have read and understood this
          Privacy Policy.
        </p>
      </>
    ),
  },

  {
    title: "2. Information We Collect",
    content: (
      <>
        <p>
          We collect information necessary to provide and improve the services
          offered through INOS.
        </p>

        <h3>Account Information</h3>
        <p>
          Depending on how you use INOS, this may include your name, email
          address, organization information, role, authentication information,
          and other information provided when creating or managing an account.
        </p>

        <h3>Business and Operational Information</h3>
        <p>
          Information entered into INOS may include project information,
          clients, vendors, procurement records, documents, tasks, notes,
          schedules, and other business information that you or your
          organization choose to store in the platform.
        </p>

        <h3>Technical Information</h3>
        <p>
          We may collect technical information such as browser type, device
          information, IP address, application activity, error logs, and
          information required to maintain the security and reliability of the
          platform.
        </p>
      </>
    ),
  },

  {
    title: "3. Google Services and OAuth Data",
    content: (
      <>
        <p>
          INOS allows users to optionally connect supported Google services,
          including Google Calendar and Google Tasks, through Google's OAuth
          authorization system.
        </p>

        <p>
          INOS only requests access to Google services after the user explicitly
          chooses to connect their Google account and grants the requested
          permissions.
        </p>

        <h3>Google Calendar</h3>
        <p>
          When authorized by the user, INOS may access calendar information
          necessary to display, create, update, or manage calendar events
          through the INOS platform.
        </p>

        <h3>Google Tasks</h3>
        <p>
          When authorized by the user, INOS may access task information
          necessary to display, create, update, or manage Google Tasks through
          the INOS platform.
        </p>

        <h3>OAuth Credentials</h3>
        <p>
          When a user connects a Google account, Google may provide INOS with
          OAuth credentials, including access and refresh tokens. These
          credentials are stored securely and are used only to maintain the
          authorized connection and perform actions permitted by the user.
        </p>

        <p>INOS does not request or store your Google password.</p>
      </>
    ),
  },

  {
    title: "4. How We Use Information",
    content: (
      <>
        <p>We may use collected information to:</p>

        <ul>
          <li>Provide and operate INOS services.</li>
          <li>Authenticate users and maintain account security.</li>
          <li>Provide project and business management functionality.</li>
          <li>Synchronize connected third-party services.</li>
          <li>Display calendar and task information requested by users.</li>
          <li>Improve application functionality and reliability.</li>
          <li>
            Detect and prevent security incidents and unauthorized access.
          </li>
          <li>Provide technical support.</li>
          <li>Communicate important service-related information.</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>

        <p>
          We do not use Google Calendar or Google Tasks data for advertising
          purposes.
        </p>
      </>
    ),
  },

  {
    title: "5. Google User Data",
    content: (
      <>
        <p>
          INOS's use of information received from Google APIs is limited to
          providing and improving features that are directly related to the
          functionality requested by the user.
        </p>

        <p>We do not sell Google user data to third parties.</p>

        <p>
          We do not use Google user data for advertising, behavioral profiling,
          or unrelated marketing purposes.
        </p>

        <p>
          Access to Google data is limited to the permissions granted by the
          user through Google's OAuth consent process.
        </p>
      </>
    ),
  },

  {
    title: "6. Data Sharing",
    content: (
      <>
        <p>We do not sell or rent personal information to third parties.</p>

        <p>
          Information may be shared with trusted service providers where
          necessary to operate INOS, such as infrastructure, hosting,
          authentication, security, database, monitoring, or communication
          providers.
        </p>

        <p>
          Service providers are expected to process information only for the
          purposes for which they are engaged and to maintain appropriate
          security controls.
        </p>

        <p>
          Information may also be disclosed where required by law, legal
          process, court order, or to protect the rights, safety, and security
          of INOS, our users, or others.
        </p>
      </>
    ),
  },

  {
    title: "7. Data Storage and Security",
    content: (
      <>
        <p>
          We use reasonable technical and organizational measures to protect
          information against unauthorized access, alteration, disclosure, or
          destruction.
        </p>

        <p>
          Security measures may include authentication controls, access
          controls, encrypted connections, secure token handling, database
          security, logging, and monitoring.
        </p>

        <p>
          No internet-based service can guarantee absolute security. Users
          should also take reasonable steps to protect their account credentials
          and devices.
        </p>
      </>
    ),
  },

  {
    title: "8. Data Retention",
    content: (
      <>
        <p>
          We retain information for as long as reasonably necessary to provide
          the services, maintain business records, comply with legal
          obligations, resolve disputes, and enforce agreements.
        </p>

        <p>
          When a user disconnects a third-party service, INOS will stop using
          the associated authorization credentials for that service, subject to
          any information that must be retained for legitimate operational or
          legal purposes.
        </p>
      </>
    ),
  },

  {
    title: "9. Disconnecting Google Services",
    content: (
      <>
        <p>
          Users can disconnect their Google account from INOS through the
          application's integration or connector settings where this
          functionality is available.
        </p>

        <p>
          Disconnecting Google prevents INOS from continuing to access Google
          services using the connection.
        </p>

        <p>
          Users may also revoke INOS's access from their Google Account's
          third-party application settings.
        </p>
      </>
    ),
  },

  {
    title: "10. Cookies and Similar Technologies",
    content: (
      <>
        <p>
          INOS may use cookies, local storage, session technologies, and similar
          mechanisms where necessary for authentication, security, preferences,
          application functionality, and performance.
        </p>

        <p>
          These technologies help us maintain authenticated sessions and provide
          a reliable user experience.
        </p>
      </>
    ),
  },

  {
    title: "11. Your Rights",
    content: (
      <>
        <p>
          Depending on applicable law, users may have rights relating to their
          personal information, including the right to request access,
          correction, deletion, or information about how their data is
          processed.
        </p>

        <p>
          Requests may be submitted using the contact information provided
          below.
        </p>
      </>
    ),
  },

  {
    title: "12. Children's Privacy",
    content: (
      <>
        <p>
          INOS is intended for business and organizational use and is not
          directed toward children.
        </p>

        <p>
          We do not knowingly collect personal information from children in
          violation of applicable law.
        </p>
      </>
    ),
  },

  {
    title: "13. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          to our services, technology, legal requirements, or business
          practices.
        </p>

        <p>
          When changes are made, the updated policy will be published on this
          page with an updated effective date.
        </p>
      </>
    ),
  },

  {
    title: "14. Contact Us",
    content: (
      <>
        <p>
          If you have questions about this Privacy Policy, data practices, or
          your information, please contact us.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Mail className="h-5 w-5 text-[#1F453B]" />
          <div>
            <p className="font-medium text-slate-900">Privacy enquiries</p>
            <a
              href="mailto:privacy@rippotaiarchitecture.com"
              className="text-sm text-[#1F453B] hover:underline"
            >
              privacy@rippotaiarchitecture.com
            </a>
          </div>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F7F9F8] text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B]">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight text-[#1F453B]">
                INOS
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Privacy & Security
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
              <Lock className="h-3.5 w-3.5" />
              Your privacy matters
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Privacy Policy
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              This policy explains how INOS handles information when you use our
              business operations platform and connect third-party services such
              as Google Calendar and Google Tasks.
            </p>

            <p className="mt-6 text-sm text-slate-500">
              Effective date: September 9, 2026
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ShieldCheck className="h-5 w-5 text-[#1F453B]" />
              <p className="mt-3 font-semibold text-slate-900">
                Secure by design
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                We use reasonable safeguards to protect application data.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Database className="h-5 w-5 text-[#1F453B]" />
              <p className="mt-3 font-semibold text-slate-900">
                Responsible data use
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Data is used to provide the functionality requested by users.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CalendarDays className="h-5 w-5 text-[#1F453B]" />
              <p className="mt-3 font-semibold text-slate-900">
                OAuth controlled
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Third-party access is granted by the user through OAuth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="mb-10 rounded-2xl border border-[#1F453B]/10 bg-[#1F453B]/5 p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1F453B]" />
              <p className="text-sm leading-6 text-slate-600">
                INOS only accesses connected third-party services after you
                explicitly authorize the connection. You can disconnect
                supported integrations from INOS at any time.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {section.title}
                </h2>

                <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc">
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
            <Link to="/privacy-policy" className="font-medium text-[#1F453B]">
              Privacy Policy
            </Link>

            <Link to="/terms-and-conditions" className="hover:text-[#1F453B]">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
