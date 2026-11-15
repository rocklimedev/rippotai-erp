// Client Consent Form — the user's CONSENT FORM TEMPLATE.docx on the Word family of the print kit:
// cube cover with RIPPŌTAI / tagline / gold rule / CLIENT CONSENT FORM, intro panel and the
// PROJECT & CLIENT DETAILS lines filled from the project; 01 and 02 consent clauses on one page;
// 03 Declaration & Sign-off. Fixed wording lives in consent-form-content.json.
import { forwardRef, useMemo } from "react";
import { PrintDocument, WFields, WSign } from "@/components/print-document";
import content from "./consent-form-content.json";
import { consentFormDate } from "./consent-form-data";
import "./consent-form-document.css";

const splitClause = (clause) => {
  const m = clause.match(/^(\d+\.\d+\.)\s+([\s\S]*)$/);
  return m ? [m[1], m[2]] : ["", clause];
};
const splitTitle = (title) => {
  const m = String(title || "").match(/^(\d+)\s+(.*)$/);
  return m ? [m[1], m[2]] : ["", title];
};

function Clause({ clause }) {
  const [no, text] = splitClause(clause);
  return (
    <p className="wd-cf-clause">
      <span>{no}</span>
      {text}
    </p>
  );
}

export default forwardRef(function ConsentFormDocument({ values }, ref) {
  const date = consentFormDate(values.date);
  const sections = useMemo(() => {
    const consent = content.sections.map((section, i) => {
      const [no, title] = splitTitle(section.title);
      return {
        no,
        title: title.toUpperCase(),
        newPage: i === 0,
        headClass: "wd-cf-head",
        blocks: [
          <p key="i" className="wd-cf-lead">
            {section.intro}
          </p>,
          ...section.clauses.map((clause) => <Clause key={clause} clause={clause} />),
        ],
      };
    });
    const [dno, dtitle] = splitTitle(content.declarationTitle);
    return [
      ...consent,
      {
        no: dno,
        title: dtitle.toUpperCase(),
        headClass: "wd-cf-head",
        blocks: [
          <div key="decl" className="wd-cf-decl">
            <div className="wd-cf-decl__k">DECLARATION</div>
            <p>{content.declaration}</p>
          </div>,
          <div key="end" className="wd-cf-end">
            <div className="wd-cf-sign">
              <WSign
                label="Client"
                lines={["Client Signature", { label: "Name -", value: "" }, { label: "Date -", value: "" }]}
              />
              <WSign
                label="For Rippotai"
                lines={["Authorised Signatory", { label: "Name -", value: "" }, { label: "Date -", value: "" }]}
              />
            </div>
            <p className="wd-cf-note">{content.recordNote}</p>
          </div>,
        ],
      },
    ];
  }, []);
  return (
    <PrintDocument
      ref={ref}
      variant="word"
      className="wd-cf"
      docType="Client Consent Form"
      footerLabel="CLIENT CONSENT FORM"
      bodyHeight={251}
      title={values.projectName}
      wordCover={{
        title: content.title,
        className: "wd-cf-cover",
        logo: "cube",
        logoWidth: 32.3,
        logoTop: 28,
        subtitle: content.subtitle,
        beforeTitle: (
          <div className="wd-cf-brand">
            <div className="wd-cf-brand__name">{content.brand}</div>
            <div className="wd-cf-brand__line">{content.brandLine}</div>
          </div>
        ),
        after: (
          <div className="wd-cf-cover__foot">
            <div className="wd-cf-intro">
              <b>{content.intro.split(". ")[0]}.</b> {content.intro.split(". ").slice(1).join(". ")}
            </div>
            <div className="wd-cf-details">PROJECT &amp; CLIENT DETAILS</div>
            <WFields
              items={[
                { label: "Project name", value: values.projectName },
                { label: "Date", value: date },
                { label: "Client name(s)", value: values.clientName },
                { label: "Site address", value: values.siteAddress },
              ]}
            />
          </div>
        ),
      }}
      sections={sections}
    />
  );
});
