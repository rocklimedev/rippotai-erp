import React from "react";
import { formatCurrency, formatDate } from "../../lib/helpers";
import logoUrl from "../../assets/rippotai_logo.png";

export default function PrintableEstimate({
  estimate,
  adminSignature,
  termsConditions,
  company,
}) {
  if (!estimate) return null;

  const e = estimate;
  const companyName = company?.name || "Rippotai";

  // Pad payment terms rows out to at least 4 for a consistent table height
  const paymentRows = [...(e.payment_terms || [])];
  while (paymentRows.length < 4) paymentRows.push({});

  const formatQty = (qty) =>
    qty === undefined || qty === null || qty === ""
      ? ""
      : Number(qty)
          .toFixed(3)
          .replace(/\.?0+$/, "");

  return (
    <div
      className="print-estimate-content bg-white mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm",
        color: "#111",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        lineHeight: 1.4,
      }}
    >
      {/* ===========================================================
          HEADER: logo (left) + Date box (right)
      =========================================================== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 10,
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px 14px",
                width: "70%",
                verticalAlign: "middle",
              }}
            >
              <img
                src={logoUrl}
                alt={companyName}
                style={{ height: 40, objectFit: "contain" }}
              />
            </td>

            <td
              style={{
                border: "1px solid #000",
                padding: 0,
                width: "30%",
                verticalAlign: "top",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderBottom: "1px solid #000",
                        padding: "6px 10px",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      Date
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "6px 10px",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {e.estimate_date ? formatDate(e.estimate_date) : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===========================================================
          TITLE
      =========================================================== */}
      <div
        style={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 10,
        }}
      >
        ESTIMATE
      </div>

      {/* ===========================================================
          VENDOR / PROJECT INFO
      =========================================================== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 14,
        }}
      >
        <tbody>
          <tr>
            <td style={cellLabel}>Vendor Type</td>
            <td style={cellValue}>{e.vendor_type || "-"}</td>
            <td style={{ ...cellLabel, width: "18%" }}>Project Name</td>
            <td style={{ ...cellValue, width: "27%" }} rowSpan={2}>
              {e.project_name || "-"}
            </td>
          </tr>
          <tr>
            <td style={cellLabel}>Vendor Name</td>
            <td style={cellValue}>{e.vendor_name || "-"}</td>
          </tr>
          <tr>
            <td style={cellLabel}>Phone Number</td>
            <td style={cellValue}>{e.phone_number || ""}</td>
            <td style={cellLabel}>Project Address</td>
            <td style={cellValue} rowSpan={2}>
              {e.project_address || "-"}
            </td>
          </tr>
          <tr>
            <td style={cellLabel}>Address</td>
            <td style={cellValue}>{e.address || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* ===========================================================
          ITEMS TABLE
      =========================================================== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 0,
        }}
      >
        <thead>
          <tr style={{ background: "#33473E", color: "#fff" }}>
            <th style={{ ...th, width: 45 }}>S.no</th>
            <th style={{ ...th, textAlign: "left" }}>Particular</th>
            <th style={{ ...th, width: 80 }}>Rate (₹)</th>
            <th style={{ ...th, width: 70 }}>Quantity</th>
            <th style={{ ...th, width: 100 }}>Amount (₹)</th>
            <th style={{ ...th, width: 130 }}>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {e.items?.map((item, index) => (
            <tr key={index}>
              <td style={{ ...td, textAlign: "center" }}>
                {item.sno || index + 1}
              </td>
              <td style={td}>{item.particular}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {item.rate ? formatCurrency(item.rate) : ""}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {formatQty(item.quantity)}
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                {item.amount ? formatCurrency(item.amount) : ""}
              </td>
              <td style={{ ...td, fontSize: 11 }}>{item.remarks || ""}</td>
            </tr>
          ))}

          <tr>
            <td style={td}></td>
            <td style={td}></td>
            <td style={{ ...td, fontWeight: 700 }} colSpan={2}>
              Subtotal
            </td>
            <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
              {formatCurrency(e.subtotal)}
            </td>
            <td style={td}></td>
          </tr>

          <tr style={{ background: "#f0f0f0" }}>
            <td style={td}></td>
            <td style={td}></td>
            <td style={{ ...td, fontWeight: 700 }} colSpan={2}>
              Grand Total
            </td>
            <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
              {formatCurrency(e.grand_total)}
            </td>
            <td style={td}></td>
          </tr>
        </tbody>
      </table>

      {/* ===========================================================
          PAYMENT TERMS
      =========================================================== */}
      <div style={{ marginTop: 14, marginBottom: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th colSpan={4} style={sectionHeader}>
                Payment Terms :
              </th>
            </tr>
            <tr>
              <th style={{ ...th, background: "#fff", color: "#000" }}>
                Stages
              </th>
              <th style={{ ...th, background: "#fff", color: "#000" }}>Date</th>
              <th style={{ ...th, background: "#fff", color: "#000" }}>
                Amount
              </th>
              <th style={{ ...th, background: "#fff", color: "#000" }}>
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentRows.map((row, i) => (
              <tr key={i}>
                <td style={{ ...td, height: 22 }}>{row.stage || ""}</td>
                <td style={td}>{row.date ? formatDate(row.date) : ""}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {row.amount ? formatCurrency(row.amount) : ""}
                </td>
                <td style={td}>{row.remarks || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===========================================================
          TERMS & CONDITIONS
      =========================================================== */}
      <div style={{ marginTop: 14, marginBottom: 40 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "6px 10px",
                  fontWeight: 700,
                }}
              >
                Terms &amp; Conditions:
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "6px 10px",
                  fontWeight: 600,
                }}
              >
                Final payment will be made after satisfactory completion of
                work.
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "10px",
                  minHeight: 80,
                  height: 80,
                  whiteSpace: "pre-wrap",
                  fontSize: 11,
                  verticalAlign: "top",
                }}
              >
                {termsConditions || e.terms_conditions || ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===========================================================
          SIGNATURES
      =========================================================== */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                borderBottom: "none",
                padding: 10,
                width: "50%",
                height: 60,
                textAlign: "center",
                verticalAlign: "bottom",
              }}
            >
              {adminSignature?.signature_url && (
                <img
                  src={adminSignature.signature_url}
                  alt="Approved By"
                  style={{ maxHeight: 50, objectFit: "contain" }}
                />
              )}
            </td>
            <td
              style={{
                border: "1px solid #000",
                borderBottom: "none",
                borderLeft: "none",
                padding: 10,
                width: "50%",
                height: 60,
              }}
            ></td>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                borderTop: "1px solid #000",
                padding: 8,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              APPROVED BY
            </td>
            <td
              style={{
                border: "1px solid #000",
                borderLeft: "none",
                padding: 8,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              CONTRACTOR'S SIGNATURE
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ===========================================================
   Shared cell styles
=========================================================== */
const cellLabel = {
  border: "1px solid #000",
  padding: "6px 10px",
  fontWeight: 600,
  width: "18%",
  background: "#fafafa",
};

const cellValue = {
  border: "1px solid #000",
  padding: "6px 10px",
  width: "37%",
};

const th = {
  border: "1px solid #000",
  padding: 8,
  fontSize: 12,
  textAlign: "center",
};

const td = {
  border: "1px solid #000",
  padding: 6,
  fontSize: 12,
};

const sectionHeader = {
  border: "1px solid #000",
  padding: 6,
  textAlign: "center",
  fontWeight: 700,
  background: "#fff",
  color: "#000",
};
