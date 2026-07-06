import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStatusConfig } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  LayoutGrid,
  LayoutList,
} from "lucide-react";

// RTK Query hooks
import {
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from "../../api/vendor.api"; // adjust path as needed

import VendorFormModal from "../../components/vendors/VendorFormModal"; // adjust path as needed

export default function VendorsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // will hold category id
  const [typeFilter, setTypeFilter] = useState(""); // will hold business type id
  const [modal, setModal] = useState(null);
  const [view, setView] = useState(
    () => localStorage.getItem("vendors_view") || "list",
  );

  const setViewPref = (v) => {
    setView(v);
    localStorage.setItem("vendors_view", v);
  };

  // categories from API
  const { data: categories = [], isFetching: categoriesLoading } =
    useGetVendorCategoriesQuery();

  // business types for active category (for chips)
  const { data: subTypes = [], isFetching: subTypesLoading } =
    useGetBusinessTypesQuery(categoryFilter, { skip: !categoryFilter });

  // vendors from API using category/type ids for server filtering
  const {
    data: vendors = [],
    isLoading,
    refetch,
  } = useGetVendorsQuery({
    status: undefined,
    vendor_category_id: categoryFilter || undefined,
    business_type_id: typeFilter || undefined,
  });

  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();

  // client-side text search (server-side search can be added if API supports it)
  const filteredVendors = React.useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return (vendors || []).filter((v) => {
      return (
        (v.name || "").toLowerCase().includes(q) ||
        (v.type_of_business || "").toLowerCase().includes(q) ||
        (v.address || "").toLowerCase().includes(q)
      );
    });
  }, [vendors, search]);

  const handleSubmitVendor = async (payload, isEdit, id) => {
    if (isEdit) {
      await updateVendor({ id, ...payload }).unwrap();
    } else {
      await createVendor(payload).unwrap();
    }
    await refetch();
  };

  const handleSave = () => {
    setModal(null);
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this vendor?")) return;
    try {
      await deleteVendor(id).unwrap();
      await refetch();
    } catch (err) {
      console.error("Error deleting vendor:", err);
    }
  };

  const handleCategoryClick = (catId) => {
    if (categoryFilter === catId) {
      setCategoryFilter("");
      setTypeFilter("");
    } else {
      setCategoryFilter(catId);
      setTypeFilter("");
    }
  };

  const currentCategoryName = categories.find(
    (c) => c.id === categoryFilter,
  )?.name;

  return (
    <div className="p-6">
      {modal && (
        <VendorFormModal
          vendor={modal.vendor}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onSubmit={handleSubmitVendor}
          categories={categories}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#333333]">Vendors</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E5E7EB] rounded-md overflow-hidden">
            <button
              onClick={() => setViewPref("list")}
              className={`p-2 ${view === "list" ? "bg-[#1A3C34] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewPref("grid")}
              className={`p-2 ${view === "grid" ? "bg-[#1A3C34] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            data-testid="add-vendor-btn"
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-[#1A3C34] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#16352F] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Category Tabs — Level 1 */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => {
            setCategoryFilter("");
            setTypeFilter("");
          }}
          className={`px-5 py-2 text-sm font-semibold rounded-md border-2 transition-all ${!categoryFilter ? "bg-[#333333] text-white border-[#333333]" : "border-[#E5E7EB] text-gray-500 hover:border-gray-300"}`}
        >
          All
        </button>

        {(categories || []).map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-md border-2 transition-all ${categoryFilter === cat.id ? "bg-[#1A3C34] text-white border-[#1A3C34]" : "border-[#E5E7EB] text-gray-600 hover:border-[#1A3C34] hover:text-[#1A3C34]"}`}
          >
            {cat.name}
          </button>
        ))}

        <span className="text-xs text-gray-400 ml-1">
          {categoryFilter
            ? `${filteredVendors.length} ${currentCategoryName || ""} vendor${filteredVendors.length !== 1 ? "s" : ""}`
            : `${filteredVendors.length} total`}
        </span>
      </div>

      {/* Sub-type chips — Level 2 (from API business types) */}
      {(subTypes || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 pl-1">
          {subTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(typeFilter === t.id ? "" : t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === t.id ? "bg-[#1A3C34] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Search & Status Filter Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            data-testid="vendor-search"
            placeholder="Search by name, type, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34] w-64"
          />
        </div>
        <select
          value={""} // keep status filter UI but not wired to server in this example
          onChange={() => {}}
          className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34] text-gray-600"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : !filteredVendors || filteredVendors.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">No vendors found</p>
          <button
            onClick={() => setModal({ type: "add" })}
            className="mt-2 text-sm text-[#1A3C34] hover:underline"
          >
            Add your first vendor
          </button>
        </div>
      ) : view === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVendors.map((v) => {
            const cfg = getStatusConfig(v.status);
            return (
              <div
                key={v.id}
                onClick={() => navigate(`/vendors/${v.id}`)}
                className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#333333] text-sm truncate group-hover:text-[#1A3C34] transition-colors">
                      {v.name}
                    </div>
                    {v.position && (
                      <div className="text-xs text-gray-400">{v.position}</div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                {v.company_name && (
                  <div className="text-xs text-gray-500 mb-1 truncate">
                    {v.company_name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {v.vendor_category && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${v.vendor_category === "Material" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}
                    >
                      {v.vendor_category}
                    </span>
                  )}
                  {v.type_of_business && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {v.type_of_business}
                    </span>
                  )}
                </div>
                {v.address && (
                  <div className="text-xs text-gray-400 truncate mb-1">
                    {v.address}
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    {v.contact_number}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View — sticky header */
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB] w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Company
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Category / Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Contact
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Address
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Status
                  </th>

                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase bg-[#F9FAFB]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, idx) => {
                  const cfg = getStatusConfig(v.status);
                  return (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/vendors/${v.id}`)}
                      className="border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#333333]">
                          {v.name}
                        </div>
                        {v.position && (
                          <div className="text-xs text-gray-400">
                            {v.position}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.company_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-col gap-1">
                            {v.vendorCategory?.name && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-fit ${
                                  v.vendorCategory.name === "Material"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }`}
                              >
                                {v.vendorCategory.name}
                              </span>
                            )}

                            {v.businessType?.name && (
                              <span className="text-xs text-gray-500">
                                {v.businessType.name}
                              </span>
                            )}

                            {!v.vendorCategory && !v.businessType && (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {v.contact_number}
                        </div>
                        {v.alternate_contact && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {v.alternate_contact}
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate"
                        title={v.address}
                      >
                        {v.address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`view-vendor-${v.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/vendors/${v.id}`);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: "edit", vendor: v });
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {user?.role === "ADMIN" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(v.id);
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-[#1A3C34] hover:bg-[#1A3C34]/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
