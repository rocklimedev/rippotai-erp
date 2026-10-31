import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Page, Card, Button, EmptyState } from "@/components/inos";
import { ACCESS_LEVELS } from "@/lib/permissions";

const LEVEL_LABEL = Object.fromEntries(ACCESS_LEVELS.map((l) => [l.key, l.label]));
const VERB = { read: "open", update: "edit", create: "create", delete: "remove" };

/** Polite page shown when the role does not include the needed access. */
export default function NoAccess({ what = "this page", action = "read", need }) {
  const navigate = useNavigate();
  const verb = VERB[action] || "open";
  return (
    <Page width={640}>
      <Card>
        <EmptyState
          icon={Lock}
          title="You don't have access to this"
          text={`Your role doesn't allow you to ${verb} ${what}${need ? ` (needs “${LEVEL_LABEL[need] || need}”)` : ""}. If you need it, ask an administrator to update your role in Roles & permissions.`}
          action={
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Button onClick={() => navigate(-1)}>Go back</Button>
              <Button variant="primary" onClick={() => navigate("/dashboard")}>Home</Button>
            </div>
          }
        />
      </Card>
    </Page>
  );
}
