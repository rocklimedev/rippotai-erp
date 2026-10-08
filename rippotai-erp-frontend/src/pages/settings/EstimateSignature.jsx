import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ImageUp, PenLine, RefreshCw, X } from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  EmptyState,
  Field,
  TextInput,
  Pill,
} from "@/components/inos";
import { useLazyMeQuery } from "../../api/auth/auth.api";
import { useUploadSignatureMutation } from "../../api/users/user-signatures.api";
import { AdminAccessDenied, adminCrumbs } from "./_admin-ui";

export default function EstimateSignature() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [fetchMe] = useLazyMeQuery();

  const [uploadSignature] = useUploadSignatureMutation();
  const [me, setMe] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [sigName, setSigName] = useState("");
  const [currentSig, setCurrentSig] = useState({
    url: "",
    name: "",
  });

  const [sigPreview, setSigPreview] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [sigSaving, setSigSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchMe()
      .unwrap()
      .then((res) => {
        // Supports both { user: {...} } and {...}
        const currentUser = res?.user || res;

        setMe(currentUser);

        setSigName(
          currentUser?.estimate_signature_name || currentUser?.name || "",
        );

        setCurrentSig({
          url: currentUser?.estimate_signature_url || "",
          name: currentUser?.estimate_signature_name || "",
        });
      })
      .catch(() => {
        setLoadFailed(true);
        toast.error("Failed to load user information.");
      });
  }, [user, fetchMe]);

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve({
          mime: file.type,
          b64: String(reader.result).split(",")[1] || "",
        });

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSigPick = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum file size is 2 MB.");
      return;
    }

    setSigFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setSigPreview(String(reader.result));
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearPick = () => {
    setSigFile(null);
    setSigPreview(null);
  };

  const saveSignature = async () => {
    if (!sigFile) {
      toast.error("Please choose a signature image.");
      return;
    }

    setSigSaving(true);

    try {
      // POST /api/v1/user-signatures (multipart) — the old /users/me/signature route doesn't exist.
      const data = await uploadSignature({
        userId: me?.id,
        file: sigFile,
      }).unwrap();

      toast.success("Signature saved successfully.");

      setCurrentSig({
        url: data?.signature_url || data?.signatureUrl || data?.url,
        name: sigName.trim() || me?.name,
      });

      setSigPreview(null);
      setSigFile(null);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.response?.data?.detail ||
          "Unable to save signature.",
      );
    } finally {
      setSigSaving(false);
    }
  };

  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(user?.role);
  const header = (
    <PageHeader
      crumbs={adminCrumbs("Estimate signature")}
      title="Estimate signature"
      subtitle="The signature and name printed on every estimate you approve."
    />
  );

  // Wait until user details are loaded
  if (!me) {
    return (
      <Page width="narrow">
        {header}
        <Card>
          {loadFailed ? (
            <EmptyState
              icon={PenLine}
              title="Couldn't load your account"
              text="We need your profile to show the current signature. Refresh to try again."
              action={
                <Button
                  variant="soft"
                  icon={RefreshCw}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              }
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="adm-skel" style={{ width: "40%" }} />
              <div
                className="adm-skel"
                style={{ height: 120, borderRadius: 12 }}
              />
            </div>
          )}
        </Card>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessDenied
        crumb="Estimate signature"
        title="Admins only"
        text="The estimate approval signature can only be managed by administrators."
        action={
          <Button variant="soft" onClick={() => nav("/dashboard")}>
            Back to dashboard
          </Button>
        }
      />
    );
  }

  return (
    <Page width="narrow">
      {header}

      <Card
        title="Current signature"
        subtitle={currentSig.url ? "Shown on approved estimates." : undefined}
        actions={
          currentSig.url ? (
            <Pill tone="ok">In use</Pill>
          ) : (
            <Pill tone="warn">Not set</Pill>
          )
        }
      >
        {currentSig.url ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="adm-sig">
              <img src={currentSig.url} alt="Current signature" />
            </div>
            <div className="adm-cell-title">
              {currentSig.name || me?.name || "—"}
            </div>
          </div>
        ) : (
          <div
            className="adm-sig"
            style={{
              borderStyle: "dashed",
              minHeight: 96,
              gap: 6,
              textAlign: "center",
            }}
          >
            <PenLine size={20} style={{ color: "var(--text-3)" }} aria-hidden />
            <span className="adm-cell-sub" style={{ marginTop: 0 }}>
              No signature yet — upload one below and approved estimates will
              carry it.
            </span>
          </div>
        )}
      </Card>

      <Card
        title={currentSig.url ? "Replace signature" : "Upload signature"}
        subtitle="PNG or JPG, up to 2 MB. A transparent PNG looks best."
      >
        <div style={{ display: "grid", gap: 18 }}>
          <Field
            label="Name under the signature"
            htmlFor="sig-name"
            hint="Printed below the signature, e.g. your full name and title."
          >
            <TextInput
              id="sig-name"
              value={sigName}
              onChange={(e) => setSigName(e.target.value)}
              placeholder="e.g. Dhruv Verma, Principal Architect"
            />
          </Field>

          <Field label="Signature image" required>
            {sigPreview ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div className="adm-sig">
                  <img src={sigPreview} alt="New signature preview" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span className="adm-cell-sub" style={{ marginTop: 0 }}>
                    {sigFile?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    onClick={clearPick}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="adm-drop">
                <span className="inos-icon-tile">
                  <ImageUp aria-hidden />
                </span>
                <span className="adm-drop__title">Choose an image</span>
                <span className="adm-drop__hint">PNG or JPG · max 2 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    opacity: 0,
                  }}
                  onChange={onSigPick}
                />
              </label>
            )}
          </Field>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              borderTop: "1px solid var(--line)",
              paddingTop: 16,
            }}
          >
            {sigFile && (
              <Button variant="ghost" onClick={clearPick} disabled={sigSaving}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={saveSignature}
              disabled={!sigFile || sigSaving}
            >
              {sigSaving ? "Saving…" : "Save signature"}
            </Button>
          </div>
        </div>
      </Card>
    </Page>
  );
}
