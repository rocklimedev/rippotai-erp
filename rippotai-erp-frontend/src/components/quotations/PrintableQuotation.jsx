import React from "react";
import { formatCurrency, formatDate } from "../../lib/helpers";
import logoUrl from "../../assets/rippotai_logo.png";

export default function PrintableQuotation({
  quotation,
  adminSignature,
  termsConditions,
  company,
}) {
  if (!quotation) return null;

  const q = quotation;
  const isApproved = q.status === "approved";

  const companyName = company?.name || "Your Company";

  const discountIsPercentage = q.global_discount_type === "percentage";

  return (
    <div
      className="print-quotation-content bg-white mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "18mm",
        color: "#222",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        lineHeight: 1.5,
      }}
    >
      {/* ===========================================================
          COMPANY HEADER
      =========================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "3px solid #000",
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <img
            src={logoUrl}
            alt={companyName}
            style={{
              width: 90,
              height: 90,
              objectFit: "contain",
            }}
          />

          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {companyName}
            </div>

            {company?.tagline && (
              <div
                style={{
                  color: "#666",
                  marginBottom: 8,
                }}
              >
                {company.tagline}
              </div>
            )}

            {company?.address && <div>{company.address}</div>}

            <div>
              {company?.phone && <span>Phone: {company.phone}</span>}

              {company?.phone && company?.email && <span> | </span>}

              {company?.email && <span>{company.email}</span>}
            </div>

            {company?.gst_number && <div>GSTIN : {company.gst_number}</div>}
          </div>
        </div>

        {/* Quotation Details */}

        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 270,
            fontSize: 13,
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  fontWeight: 600,
                  width: 110,
                }}
              >
                Quotation No
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                }}
              >
                {q.quotation_number}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  fontWeight: 600,
                }}
              >
                Date
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                }}
              >
                {formatDate(q.quotation_date)}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  fontWeight: 600,
                }}
              >
                Valid Till
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                }}
              >
                {q.expiryDate ? formatDate(q.expiryDate) : "-"}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  fontWeight: 600,
                }}
              >
                Status
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textTransform: "capitalize",
                }}
              >
                {q.status}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===========================================================
            TITLE
      =========================================================== */}

      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          QUOTATION
        </div>

        <div
          style={{
            width: 120,
            height: 3,
            background: "#000",
            margin: "10px auto 0",
          }}
        />
      </div>

      {/* ===========================================================
            VENDOR & PROJECT
      =========================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Vendor */}

        <div
          style={{
            border: "2px solid #000",
            padding: 16,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 12,
              borderBottom: "1px solid #000",
              paddingBottom: 6,
            }}
          >
            TO
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {q.vendor_snapshot?.name}
          </div>

          {q.vendor_snapshot?.company_name && (
            <div
              style={{
                marginTop: 3,
              }}
            >
              {q.vendor_snapshot.company_name}
            </div>
          )}

          {q.vendor_snapshot?.contact_number && (
            <div
              style={{
                marginTop: 3,
              }}
            >
              Contact : {q.vendor_snapshot.contact_number}
            </div>
          )}

          {q.vendor_snapshot?.email && (
            <div
              style={{
                marginTop: 3,
              }}
            >
              Email : {q.vendor_snapshot.email}
            </div>
          )}

          {q.vendor_snapshot?.address && (
            <div
              style={{
                marginTop: 8,
                whiteSpace: "pre-line",
              }}
            >
              {q.vendor_snapshot.address}
            </div>
          )}
        </div>

        {/* Project */}

        <div
          style={{
            border: "2px solid #000",
            padding: 16,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 12,
              borderBottom: "1px solid #000",
              paddingBottom: 6,
            }}
          >
            PROJECT DETAILS
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: 110,
                    fontWeight: 600,
                    paddingBottom: 8,
                  }}
                >
                  Project
                </td>

                <td>{q.project_snapshot?.name || "-"}</td>
              </tr>

              <tr>
                <td
                  style={{
                    fontWeight: 600,
                    paddingBottom: 8,
                  }}
                >
                  Site
                </td>

                <td>{q.project_snapshot?.site_location || "-"}</td>
              </tr>

              <tr>
                <td
                  style={{
                    fontWeight: 600,
                    paddingBottom: 8,
                  }}
                >
                  Reference
                </td>

                <td>{q.reference_number || "-"}</td>
              </tr>

              <tr>
                <td
                  style={{
                    fontWeight: 600,
                  }}
                >
                  Prepared By
                </td>

                <td>{q.createdBy?.name || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===========================================================
            ITEMS TABLE
            (Continue in Part 2)
      =========================================================== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 30,
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              background: "#1A1A1A",
              color: "#fff",
            }}
          >
            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 50,
              }}
            >
              S.No
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                textAlign: "left",
              }}
            >
              Description
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 80,
              }}
            >
              Unit
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 70,
              }}
            >
              Qty
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 110,
              }}
            >
              Rate
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 120,
              }}
            >
              Amount
            </th>

            <th
              style={{
                border: "1px solid #000",
                padding: 10,
                width: 170,
              }}
            >
              Remarks
            </th>
          </tr>
        </thead>

        <tbody>
          {q.items?.map((item, index) => (
            <tr key={index}>
              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textAlign: "center",
                }}
              >
                {item.sno || index + 1}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                }}
              >
                {item.particular}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textAlign: "center",
                }}
              >
                {item.unit || "-"}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textAlign: "right",
                }}
              >
                {Number(item.quantity)
                  .toFixed(3)
                  .replace(/\.?0+$/, "")}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textAlign: "right",
                }}
              >
                {formatCurrency(item.rate)}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(item.amount)}
              </td>

              <td
                style={{
                  border: "1px solid #000",
                  padding: 8,
                  fontSize: 12,
                }}
              >
                {item.remarks || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ========================================= */}
      {/* TOTAL SUMMARY */}
      {/* ========================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 25,
        }}
      >
        <div
          style={{
            width: 360,
            border: "2px solid #000",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Sub Total
                </td>

                <td
                  style={{
                    padding: 10,
                    textAlign: "right",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {formatCurrency(q.subtotal)}
                </td>
              </tr>

              {Number(q.additional_charges) > 0 && (
                <tr>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Additional Charges
                  </td>

                  <td
                    style={{
                      padding: 10,
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {formatCurrency(q.additional_charges)}
                  </td>
                </tr>
              )}

              {Number(q.discount) > 0 && (
                <tr>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Discount
                    {discountIsPercentage &&
                      q.global_discount_value > 0 &&
                      ` (${q.global_discount_value}%)`}
                  </td>

                  <td
                    style={{
                      padding: 10,
                      textAlign: "right",
                      color: "#cc0000",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    - {formatCurrency(q.discount)}
                  </td>
                </tr>
              )}

              {Number(q.tax_percent) > 0 && (
                <tr>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Tax ({q.tax_percent}%)
                  </td>

                  <td
                    style={{
                      padding: 10,
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {formatCurrency(q.tax_amount)}
                  </td>
                </tr>
              )}

              <tr
                style={{
                  background: "#f4f4f4",
                }}
              >
                <td
                  style={{
                    padding: 12,
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  GRAND TOTAL
                </td>

                <td
                  style={{
                    padding: 12,
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {formatCurrency(q.total_amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* AMOUNT IN WORDS */}
      {/* ========================================= */}

      <div
        style={{
          border: "2px solid #000",
          padding: 14,
          marginBottom: 25,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Amount in Words
        </div>

        <div>
          {q.amount_in_words || "______________________________________"}
        </div>
      </div>

      {/* ========================================= */}
      {/* TERMS */}
      {/* ========================================= */}

      <div
        style={{
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 8,
            fontSize: 15,
          }}
        >
          Terms & Conditions
        </div>

        <div
          style={{
            border: "2px solid #000",
            padding: 15,
            minHeight: 120,
            whiteSpace: "pre-wrap",
            fontSize: 12,
          }}
        >
          {termsConditions || q.terms_conditions || "No Terms & Conditions"}
        </div>
      </div>

      {/* ========================================= */}
      {/* SIGNATURES */}
      {/* ========================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 70,
        }}
      >
        <div
          style={{
            width: "42%",
            textAlign: "center",
          }}
        >
          {isApproved && adminSignature?.signature_url && (
            <img
              src={adminSignature.signature_url}
              alt="Authorized Signature"
              style={{
                maxHeight: 70,
                marginBottom: 10,
                objectFit: "contain",
              }}
            />
          )}

          <div
            style={{
              borderTop: "2px solid #000",
              paddingTop: 8,
              fontWeight: 600,
            }}
          >
            For {companyName}
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 12,
            }}
          >
            Authorized Signatory
          </div>
        </div>

        <div
          style={{
            width: "42%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              height: 70,
            }}
          />

          <div
            style={{
              borderTop: "2px solid #000",
              paddingTop: 8,
              fontWeight: 600,
            }}
          >
            Contractor Signature
          </div>
        </div>
      </div>
    </div>
  );
}
