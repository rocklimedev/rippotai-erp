import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, UserPlus, Search } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  useGetClientsQuery,
  useDeleteClientMutation,
  useRestoreClientMutation,
} from "../../api/client.api";

import ClientModal from "../../components/clients/ClientModal";
import ClientActionsMenu from "../../components/clients/ClientActionsMenu";

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
    const query = search.trim().toLowerCase();

    if (!query) return clients;

    return clients.filter((client) => {
      return [
        client.name,
        client.email,
        client.phone,
        client.mobile,
        client.company_name,
        client.company,
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
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} className="text-[#7A2E1A]" />
        </div>

        <div className="text-xl font-semibold mb-2">Access denied</div>

        <p className="text-[#6B7B7C]">You need admin privileges.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#333333]">Clients</h2>

          <p className="text-[#6B7B7C]">
            Manage clients, contact details and client accounts.
          </p>
        </div>

        <button
          onClick={() => setModalClient("new")}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: "#1F453B" }}
        >
          <UserPlus size={15} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7B7C]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8EAF0] bg-white text-sm outline-none focus:border-[#1F453B]"
          />
        </div>

        {/* Deleted toggle */}
        <label className="flex items-center gap-2 text-sm text-[#333333] cursor-pointer">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="w-4 h-4 accent-[#1F453B]"
          />
          Show deleted clients
        </label>
      </div>

      {/* Clients table */}
      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F3F3F1] text-xs uppercase tracking-wider text-[#6B7B7C]">
              <th className="px-5 py-3">Client</th>

              <th className="px-5 py-3">Email</th>

              <th className="px-5 py-3">Phone</th>

              <th className="px-5 py-3">Company</th>

              <th className="px-5 py-3">Status</th>

              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingClients ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#6B7B7C]">
                  Loading clients…
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#6B7B7C]">
                  {search
                    ? "No clients match your search."
                    : showDeleted
                      ? "No clients found."
                      : "No clients found."}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const active =
                  client.is_active !== false && client.deleted_at == null;

                const deleted =
                  client.deleted_at != null || client.is_deleted === true;

                return (
                  <tr
                    key={client.id}
                    className="border-t border-[#EFF2F9] hover:bg-[#FAF8F5]"
                  >
                    {/* Client */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F453B] text-white text-xs font-semibold flex items-center justify-center">
                          {(client.avatar_initials || client.name || "?")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="font-semibold text-[#333333]">
                            {client.name || "-"}
                          </div>

                          {client.client_code && (
                            <div className="text-xs text-[#6B7B7C]">
                              {client.client_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3 text-sm text-[#252525]">
                      {client.email || "-"}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3 text-sm text-[#333333]">
                      {client.phone || client.mobile || "-"}
                    </td>

                    {/* Company */}
                    <td className="px-5 py-3 text-sm text-[#333333]">
                      {client.company_name || client.company || "-"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          deleted
                            ? "bg-[#F1D9D3] text-[#7A2E1A]"
                            : active
                              ? "bg-[#D3E7D3] text-[#2A6B45]"
                              : "bg-[#EAEEF0] text-[#6B7B7C]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            deleted
                              ? "bg-[#7A2E1A]"
                              : active
                                ? "bg-[#2A6B45]"
                                : "bg-[#6B7B7C]"
                          }`}
                        />

                        {deleted ? "Deleted" : active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
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

      {/* Create / Edit Modal */}
      {modalClient && (
        <ClientModal
          client={modalClient === "new" ? undefined : modalClient}
          onClose={() => setModalClient(null)}
        />
      )}
    </div>
  );
}
