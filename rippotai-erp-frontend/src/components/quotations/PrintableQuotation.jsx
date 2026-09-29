import React from "react";

import { formatCurrency, formatDate } from "../../lib/helpers";

import logoUrl from "../../assets/rippotai_logo.png";

/* ============================================================
   HELPERS
============================================================ */

function formatQty(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(3).replace(/\.?0+$/, "");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function displayText(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

/* ============================================================
   STYLES
============================================================ */

const cellLabel = {
  border: "1px solid #000",
  padding: "6px 10px",
  fontWeight: 600,
  width: "18%",
  background: "#fafafa",
  verticalAlign: "top",
};

const cellValue = {
  border: "1px solid #000",
  padding: "6px 10px",
  width: "37%",
  verticalAlign: "top",
};

const th = {
  border: "1px solid #000",
  padding: 8,
  fontSize: 12,
  textAlign: "center",
  fontWeight: 700,
};

const td = {
  border: "1px solid #000",
  padding: 6,
  fontSize: 12,
  verticalAlign: "top",
};

/* ============================================================
   COMPONENT
============================================================ */

export default function PrintableQuotation({
  quotation,
  adminSignature,
  termsConditions,
  company,
}) {
  if (!quotation) {
    return null;
  }

  const items = safeArray(quotation.items);

  const paymentTerms = safeArray(quotation.payment_terms);

  const subtotal = safeNumber(quotation.subtotal);

  const taxPercent = safeNumber(quotation.tax_percent);

  const taxAmount = safeNumber(quotation.tax_amount);

  const additionalCharges = safeNumber(quotation.additional_charges);

  const discount = safeNumber(quotation.discount);

  const grandTotal = safeNumber(quotation.grand_total);

  const finalTerms = termsConditions || quotation.terms_conditions || "";

  const discountType = quotation.discount_type || "fixed";

  return (
    <div
      className="print-quotation-content bg-white mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm",
        boxSizing: "border-box",
        color: "#111",
        background: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        lineHeight: 1.4,
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8mm",
        }}
      >
        <div>
          <img
            src={logoUrl}
            alt="Rippotai"
            style={{
              width: "42mm",
              maxHeight: "20mm",
              objectFit: "contain",
              objectPosition: "left center",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>Date:</strong>{" "}
            {displayText(
              quotation.quotation_date
                ? formatDate(quotation.quotation_date)
                : "",
            )}
          </div>

          {company?.name && (
            <div>
              <strong>{company.name}</strong>
            </div>
          )}

          {company?.address && <div>{company.address}</div>}

          {company?.phone && <div>{company.phone}</div>}

          {company?.email && <div>{company.email}</div>}
        </div>
      </div>

      {/* ======================================================
          TITLE
      ====================================================== */}

      <div
        style={{
          textAlign: "center",
          marginBottom: "6mm",
        }}
      >
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          QUOTATION
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 11,
            color: "#555",
          }}
        >
          {displayText(quotation.quotation_number)}
        </div>
      </div>

      {/* ======================================================
          QUOTATION STATUS
      ====================================================== */}

      {quotation.status && (
        <div
          style={{
            textAlign: "right",
            marginBottom: "4mm",
          }}
        >
          <span
            style={{
              display: "inline-block",
              border: "1px solid #999",
              padding: "3px 9px",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {quotation.status}
          </span>
        </div>
      )}

      {/* ======================================================
          VENDOR / PROJECT DETAILS
      ====================================================== */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "7mm",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          <tr>
            <td style={cellLabel}>Vendor</td>

            <td style={cellValue}>{displayText(quotation.vendor_name)}</td>

            <td style={cellLabel}>Vendor Type</td>

            <td style={cellValue}>{displayText(quotation.vendor_type)}</td>
          </tr>

          <tr>
            <td style={cellLabel}>Phone</td>

            <td style={cellValue}>{displayText(quotation.phone_number)}</td>

            <td style={cellLabel}>Project</td>

            <td style={cellValue}>{displayText(quotation.project_name)}</td>
          </tr>

          <tr>
            <td style={cellLabel}>Vendor Address</td>

            <td style={cellValue}>{displayText(quotation.address)}</td>

            <td style={cellLabel}>Project Address</td>

            <td style={cellValue}>{displayText(quotation.project_address)}</td>
          </tr>

          {(quotation.client_name ||
            quotation.client_phone ||
            quotation.client_address) && (
            <tr>
              <td style={cellLabel}>Client</td>

              <td style={cellValue}>{displayText(quotation.client_name)}</td>

              <td style={cellLabel}>Client Phone</td>

              <td style={cellValue}>{displayText(quotation.client_phone)}</td>
            </tr>
          )}

          {quotation.client_address && (
            <tr>
              <td style={cellLabel}>Client Address</td>

              <td
                colSpan={3}
                style={{
                  ...cellValue,
                  width: "82%",
                }}
              >
                {displayText(quotation.client_address)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ======================================================
          ITEMS
      ====================================================== */}

      <div
        className="quotation-items"
        style={{
          marginBottom: "6mm",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#33473E",
                color: "#fff",
              }}
            >
              <th
                style={{
                  ...th,
                  width: "8%",
                  color: "#fff",
                }}
              >
                S.No.
              </th>

              <th
                style={{
                  ...th,
                  width: "43%",
                  color: "#fff",
                }}
              >
                Particular
              </th>

              <th
                style={{
                  ...th,
                  width: "12%",
                  color: "#fff",
                }}
              >
                Qty
              </th>

              <th
                style={{
                  ...th,
                  width: "17%",
                  color: "#fff",
                }}
              >
                Rate
              </th>

              <th
                style={{
                  ...th,
                  width: "20%",
                  color: "#fff",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item.id || `${index}-${item.particular}`}>
                  <td
                    style={{
                      ...td,
                      textAlign: "center",
                    }}
                  >
                    {item.sno || index + 1}
                  </td>

                  <td style={td}>
                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {displayText(
                        item.particular || item.description || item.name,
                      )}
                    </div>

                    {item.remarks && (
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 10,
                          color: "#555",
                        }}
                      >
                        {item.remarks}
                      </div>
                    )}
                  </td>

                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                    }}
                  >
                    {formatQty(item.quantity)}
                  </td>

                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(safeNumber(item.rate))}
                  </td>

                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(safeNumber(item.amount))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    ...td,
                    textAlign: "center",
                    padding: "12px",
                    color: "#666",
                  }}
                >
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================
          TOTALS
      ====================================================== */}

      <div
        className="quotation-totals"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "7mm",
        }}
      >
        <table
          style={{
            width: "78mm",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  fontWeight: 600,
                }}
              >
                Subtotal
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  textAlign: "right",
                }}
              >
                {formatCurrency(subtotal)}
              </td>
            </tr>

            {taxPercent > 0 && (
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                  }}
                >
                  Tax ({taxPercent}%)
                </td>

                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(taxAmount)}
                </td>
              </tr>
            )}

            {additionalCharges !== 0 && (
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                  }}
                >
                  Additional Charges
                </td>

                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(additionalCharges)}
                </td>
              </tr>
            )}

            {discount !== 0 && (
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                  }}
                >
                  Discount
                  {discountType === "percent" && ` (${discount}%)`}
                </td>

                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "right",
                  }}
                >
                  - {formatCurrency(discount)}
                </td>
              </tr>
            )}

            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "8px",
                  fontWeight: 700,
                  fontSize: 13,
                  background: "#33473E",
                  color: "#fff",
                }}
              >
                Grand Total
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: 13,
                  background: "#33473E",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ======================================================
          PAYMENT TERMS
      ====================================================== */}

      {paymentTerms.length > 0 && (
        <div
          className="no-break"
          style={{
            marginBottom: "7mm",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 5,
            }}
          >
            Payment Terms
          </div>

          <div
            style={{
              border: "1px solid #000",
              padding: "8px 10px",
            }}
          >
            {paymentTerms.map((term, index) => {
              const text =
                typeof term === "string"
                  ? term
                  : term?.label || term?.name || term?.description || "";

              if (!text) {
                return null;
              }

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: index === paymentTerms.length - 1 ? 0 : 4,
                  }}
                >
                  <span>{index + 1}.</span>

                  <span>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================
          TERMS & CONDITIONS
      ====================================================== */}

      {finalTerms && (
        <div
          className="terms-box no-break"
          style={{
            marginBottom: "8mm",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 5,
            }}
          >
            Terms & Conditions
          </div>

          <div
            style={{
              border: "1px solid #000",
              padding: "8px 10px",
              whiteSpace: "pre-wrap",
              fontSize: 10.5,
              lineHeight: 1.55,
            }}
          >
            {finalTerms}
          </div>
        </div>
      )}

      {/* ======================================================
          SIGNATURE
      ====================================================== */}

      <div
        className="signature-row no-break"
        style={{
          marginTop: "10mm",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            width: "58mm",
            textAlign: "center",
          }}
        >
          {adminSignature && (
            <img
              src={adminSignature}
              alt="Authorized Signature"
              crossOrigin="anonymous"
              style={{
                display: "block",
                width: "48mm",
                height: "20mm",
                objectFit: "contain",
                margin: "0 auto 3mm",
              }}
            />
          )}

          {!adminSignature && (
            <div
              style={{
                height: "20mm",
              }}
            />
          )}

          <div
            style={{
              borderTop: "1px solid #000",
              paddingTop: 5,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}
