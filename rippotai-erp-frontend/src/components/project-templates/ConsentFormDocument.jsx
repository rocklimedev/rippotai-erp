import { forwardRef } from "react";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import content from "./consent-form-content.json";
import { consentFormDate } from "./consent-form-data";
import logo from "../../assets/rippotai_logo.png";
import "./consent-form.css";

const splitClause = (clause) => {
  const m = clause.match(/^(\d+\.\d+\.)\s+([\s\S]*)$/);
  return m ? [m[1], m[2]] : ["", clause];
};
const splitTitle = (title) => {
  const m = title.match(/^(\d+)\s+([\s\S]*)$/);
  return m ? [m[1], m[2]] : ["", title];
};

function Footer() {
  return (
    <footer className="consent-footer">
      <span>{content.title}</span>
      <span>{content.subtitle}</span>
    </footer>
  );
}

function SectionHeading({ title }) {
  const [num, name] = splitTitle(title);
  return (
    <h2>
      <span>{num}</span>
      {name}
    </h2>
  );
}

export default forwardRef(function ConsentFormDocument({ values }, ref) {
  return (
    <div ref={ref} className="consent-document">
      {/* Page 1 — cover */}
      <section className="pd-page consent-page">
        <header className="consent-brand">
          <img src={logo} alt="Rippōtai" crossOrigin="anonymous" />
          <div className="consent-brand__name">{content.brand}</div>
          <small className="consent-brand__line">{content.brandLine}</small>
        </header>
        <div className="consent-cover-title">
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
        <div className="consent-callout">{content.intro}</div>
        <div className="consent-details">
          <h2>PROJECT &amp; CLIENT DETAILS</h2>
          <div className="consent-detail-row">
            <div>
              <label>PROJECT NAME</label>
              <p>{values.projectName}</p>
            </div>
            <div>
              <label>DATE</label>
              <p>{consentFormDate(values.date)}</p>
            </div>
          </div>
          <div className="consent-detail-row">
            <div>
              <label>CLIENT NAME(S)</label>
              <p>{values.clientName}</p>
            </div>
            <div>
              <label>SITE ADDRESS</label>
              <p>{values.siteAddress}</p>
            </div>
          </div>
        </div>
        <Footer />
      </section>

      {/* Page 2 — consent clauses */}
      <section className="pd-page consent-page">
        {content.sections.map((section) => (
          <div className="consent-section" key={section.title}>
            <SectionHeading title={section.title} />
            <p className="consent-intro">{section.intro}</p>
            {section.clauses.map((clause) => {
              const [no, text] = splitClause(clause);
              return (
                <p className="consent-clause" key={no || clause}>
                  <span>{no}</span>
                  <span>{text}</span>
                </p>
              );
            })}
          </div>
        ))}
        <Footer />
      </section>

      {/* Page 3 — declaration & sign-off */}
      <section className="pd-page consent-page">
        <div className="consent-section">
          <SectionHeading title={content.declarationTitle} />
        </div>
        <div className="consent-declaration">
          <label>DECLARATION</label>
          <p>{content.declaration}</p>
        </div>
        <div className="consent-signatures">
          <div>
            <label>CLIENT</label>
            <div className="consent-sign-line" />
            <p>Client Signature</p>
            <p>Name · ____________________</p>
            <p>Date · ____________________</p>
          </div>
          <div>
            <label>FOR RIPPŌTAI</label>
            <div className="consent-sign-line" />
            <p>Authorised Signatory</p>
            <p>Name · ____________________</p>
            <p>Date · ____________________</p>
          </div>
        </div>
        <p className="consent-record-note">{content.recordNote}</p>
        <Footer />
      </section>
    </div>
  );
});
