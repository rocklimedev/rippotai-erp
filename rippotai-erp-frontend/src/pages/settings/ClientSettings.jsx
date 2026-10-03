import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, SearchX, UserPlus } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Segmented,
  Pill,
  Avatar,
} from "@/components/inos";

import {
  useGetClientsQuery,
  useDeleteClientMutation,
  useRestoreClientMutation,
} from "../../api/projects/client.api";

import ClientModal from "../../components/clients/ClientModal";
import ClientActionsMenu from "../../components/clients/ClientActionsMenu";
import { AdminAccessDenied, SkeletonRows, TableEmpty, adminCrumbs, plural } from "./_admin-ui";

export default function ClientSettings() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  // null = closed
  // "new" = create flow
  // client object = edit flow
  const [modalClient, setModalClient] = useState(null);

  const {
    data: clients = [],
    isFetching: loadingClients,
    error: clientsError,
  } = useGetClientsQuery(
    {
      includeDeleted: showDeleted,
    },
    {
      skip: !isAdmin,
    },
  );

  const [deleteClientMutation] = useDeleteClientMutation();
  const [restoreClientMutation] = useRestoreClientMutation();

  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (clientsError) {
      toast.error("Failed to load clients");
    }
  }, [clientsError]);

  /**
   * Filter clients by:
   * - Name
   * - Email
   * - Phone
   * - Company
   */
  const filteredClients = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const query = search.trim().toLowerCase();

    if (!query) return list;

    return list.filter((client) => {
      return [
        client.name,
        client.email,
        client.phone,
        client.mobile,
        client.company_name,
        client.company,
        client.contact_person,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [clients, search]);

  /**
   * Soft delete client
   */
  const deleteClient = async (client) => {
    if (
      !window.confirm(
        `Delete ${client.name}? This client will be moved to deleted clients.`,
      )
    ) {
      return;
    }

    setSavingId(client.id);

    try {
      await deleteClientMutation(client.id).unwrap();

      toast.success(`${client.name} deleted`);
    } catch (e) {
      toast.error(
        e?.data?.detail || e?.data?.message || "Failed to delete client",
      );
    } finally {
      setSavingId(null);
    }
  };

  /**
   * Restore soft-deleted client
   */
  const restoreClient = async (client) => {
    setSavingId(client.id);

    try {
      await restoreClientMutation(client.id).unwrap();

      toast.success(`${client.name} restored`);
    } catch (e) {
      toast.error(
        e?.data?.detail || e?.data?.message || "Failed to restore client",
      );
    } finally {
      setSavingId(null);
    }
  };

  /**
   * Access control
   */
  if (!isAdmin) {
    return <AdminAccessDenied crumb="Clients" />;
  }

  const total = Array.isArray(clients) ? clients.length : 0;

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Clients")}
        title="Clients"
        subtitle="The people and companies you build for — used on projects, estimates and invoices."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setModalClient("new")} data-testid="add-client-btn">
            Add client
          </Button>
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone or company" />
        <Segmented
          value={showDeleted ? "all" : "current"}
          onChange={(v) => setShowDeleted(v === "all")}
          options={[
            { value: "current", label: "Current" },
            { value: "all", label: "Include deleted" },
          ]}
        />
        <ToolbarSpacer />
      </Toolbar>

      <Card flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="adm-hide-sm">Email</th>
                <th>Phone</th>
                <th className="adm-hide-sm">Company</th>
                <th>Status</th>
                <th className="actions" aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {loadingClients && total === 0 ? (
                <SkeletonRows cols={6} />
              ) : total === 0 ? (
                <TableEmpty
                  cols={6}
                  icon={Building2}
                  title={clientsError ? "Couldn't load clients" : "No clients yet"}
                  text={
                    clientsError
                      ? "The clients service didn't respond. Try again in a moment."
                      : "Add a client once and pick them on every project, estimate and invoice."
                  }
                  action={
                    !clientsError && (
                      <Button variant="soft" icon={UserPlus} onClick={() => setModalClient("new")}>
                        Add client
                      </Button>
                    )
                  }
                />
              ) : filteredClients.length === 0 ? (
                <TableEmpty cols={6} icon={SearchX} title="No matching clients" text="Try a different name, phone or company." />
              ) : (
                filteredClients.map((client) => {
                  const active =
                    client.is_active !== false && client.deleted_at == null;

                  const deleted =
                    client.deleted_at != null || client.is_deleted === true;

                  const company = client.company_name || client.company;
                  const sub = client.client_code || (client.contact_person && client.contact_person !== client.name ? client.contact_person : null) || client.address;

                  return (
                    <tr key={client.id} style={deleted ? { opacity: 0.7 } : undefined}>
                      <td>
                        <div className="adm-cell-main">
                          <Avatar name={client.name} size={36} />
                          <div style={{ minWidth: 0 }}>
                            <div className="adm-cell-title">{client.name || "Unnamed client"}</div>
                            {sub && <div className="adm-cell-sub">{sub}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="adm-cell-2 adm-hide-sm">{client.email || <span className="muted">—</span>}</td>

                      <td className="adm-cell-2 tabular" style={{ whiteSpace: "nowrap" }}>
                        {client.phone || client.mobile || <span className="muted">—</span>}
                      </td>

                      <td className="adm-cell-2 adm-hide-sm">{company || <span className="muted">—</span>}</td>

                      <td>
                        <Pill tone={deleted ? "bad" : active ? "ok" : "mute"}>
                          {deleted ? "Deleted" : active ? "Active" : "Inactive"}
                        </Pill>
                      </td>

                      <td className="actions">
                        <ClientActionsMenu
                          client={client}
                          isDeleted={deleted}
                          saving={savingId === client.id}
                          onEdit={() => setModalClient(client)}
                          onDelete={() => deleteClient(client)}
                          onRestore={() => restoreClient(client)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && <div className="adm-table-foot">{plural(filteredClients.length, "client")} shown</div>}
      </Card>

      {/* Create / Edit Modal */}
      {modalClient && (
        <ClientModal
          client={modalClient === "new" ? undefined : modalClient}
          onClose={() => setModalClient(null)}
        />
      )}
    </Page>
  );
}
