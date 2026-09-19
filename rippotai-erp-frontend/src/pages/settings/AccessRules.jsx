import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";

export default function AccessRules({ roles, superadmin }) {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    subject_type: "ROLE",
    subject_id: "",
    resource: "route:/",
    action: "view",
    effect: "DENY",
  });
  async function request(path = "", method = "GET", body) {
    const response = await fetch(`${API_URL}/access/rules${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("bc_token")}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Could not update access",
      );
    return data;
  }
  useEffect(() => {
    request()
      .then(setRules)
      .catch((error) => setError(error.message));
  }, []);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("", "POST", draft);
      setRules(await request());
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    setBusy(true);
    setError("");
    try {
      await request(`/${id}`, "DELETE");
      setRules(await request());
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (name) => ({
    value: draft[name],
    onChange: (event) => setDraft({ ...draft, [name]: event.target.value }),
  });
  return (
    <section className="mt-8 rounded-xl border p-5 space-y-4">
      <h2 className="text-xl font-semibold">User and role access rules</h2>
      <p>
        Blocks override grants, including Admin access. Use a page pattern such
        as route:/projects/:id/handover or route:/console/*. API resources use
        names such as projects.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <label>
          Subject
          <select
            className="block border rounded p-2"
            {...field("subject_type")}
          >
            <option>ROLE</option>
            <option>USER</option>
          </select>
        </label>
        <label>
          {draft.subject_type === "ROLE" ? "Role" : "User ID"}
          {draft.subject_type === "ROLE" ? (
            <select
              required
              className="block border rounded p-2"
              {...field("subject_id")}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.scope ?? "INTERNAL"})
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              className="block border rounded p-2"
              {...field("subject_id")}
              placeholder="User UUID"
            />
          )}
        </label>
        <label>
          Page pattern or API resource
          <input
            required
            className="block border rounded p-2"
            {...field("resource")}
          />
        </label>
        <label>
          Action
          <select className="block border rounded p-2" {...field("action")}>
            {["view", "create", "edit", "delete", "approve", "manage", "*"].map(
              (action) => (
                <option key={action}>{action}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Effect
          <select className="block border rounded p-2" {...field("effect")}>
            <option value="DENY">Block</option>
            {superadmin && <option value="ALLOW">Allow</option>}
          </select>
        </label>
        <button
          disabled={busy}
          className="rounded bg-emerald-900 text-white px-4 py-2"
        >
          Save rule
        </button>
      </form>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Resource</th>
            <th>Action</th>
            <th>Effect</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className="border-t">
              <td className="py-2">
                {roles.find((role) => role.id === rule.subject_id)?.name ??
                  rule.subject_id}
              </td>
              <td>{rule.resource}</td>
              <td>{rule.action}</td>
              <td>{rule.effect}</td>
              <td>
                {superadmin && (
                  <button disabled={busy} onClick={() => remove(rule.id)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
