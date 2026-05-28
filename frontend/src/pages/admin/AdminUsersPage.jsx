import { CheckSquare, Download, Eye, Search, Square, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import StatusBadge from "../../moderation-system/components/StatusBadge.jsx";
import useFetch from "../../hooks/useFetch.js";
import { bulkDeleteUsers, deleteUser, exportUsers, getUsers, getUserStats } from "../../services/adminUserService.js";
import { formatCurrency } from "../../utils/formatters.js";

const PER_PAGE = 20;

const AdminUsersPage = () => {
  const { data: statsData, loading: statsLoading } = useFetch(getUserStats, []);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: PER_PAGE, sortBy, sortOrder };
      if (search) params.search = search;
      if (verifiedFilter) params.verified = verifiedFilter;
      const result = await getUsers(params);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, verifiedFilter, sortBy, sortOrder]);

  useEffect(() => { fetchUsers(page); }, [fetchUsers, page]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u._id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(users.map((u) => u._id));
  };
  const toggleOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      const result = await bulkDeleteUsers(selectedIds);
      toast.success(result.message);
      setSelectedIds([]);
      setDeleteTarget(null);
      fetchUsers(Math.min(page, Math.ceil((pagination.total - selectedIds.length) / PER_PAGE) || 1));
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk delete failed.");
    }
  };

  const handleSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget._id);
      toast.success("Customer deleted.");
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget._id));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    try {
      await exportUsers();
      toast.success("Export started.");
    } catch {
      toast.error("Export failed.");
    }
  };

  const stats = [
    { label: "Total Users", value: statsData?.totalUsers ?? "—", icon: Users, color: "text-gray-900" },
    { label: "Active", value: statsData?.activeUsers ?? "—", icon: UserCheck, color: "text-emerald-600" },
    { label: "Verified", value: statsData?.verifiedUsers ?? "—", icon: UserCheck, color: "text-blue-600" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Users</h1>
          <p className="mt-1 text-sm text-gray-600">Manage customer accounts and platform activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleExport} className="btn-secondary text-xs">
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className={`mt-1 text-2xl font-black ${stat.color}`}>
                {statsLoading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                ) : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input w-full pl-9 text-sm"
          />
        </div>
        <select value={verifiedFilter} onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }} className="input w-40 text-sm">
          <option value="">All verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
          <button type="button" onClick={() => { setDeleteTarget({ _id: "bulk", count: selectedIds.length }); }} className="btn-danger text-xs">
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-xs text-gray-500 hover:text-gray-700">
            Clear selection
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
              <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">No users found</p>
          <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-10 p-4">
                    <button type="button" onClick={toggleAll} className="flex items-center">
                      {allSelected ? <CheckSquare className="h-4 w-4 text-ember" /> : <Square className="h-4 w-4 text-gray-400" />}
                    </button>
                  </th>
                  <th className="p-4">
                    <button type="button" onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-gray-700">
                      Name{sortIcon(sortBy, sortOrder, "name")}
                    </button>
                  </th>
                  <th className="p-4">
                    <button type="button" onClick={() => handleSort("email")} className="flex items-center gap-1 hover:text-gray-700">
                      Email{sortIcon(sortBy, sortOrder, "email")}
                    </button>
                  </th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">
                    <button type="button" onClick={() => handleSort("moderationStatus")} className="flex items-center gap-1 hover:text-gray-700">
                      Status{sortIcon(sortBy, sortOrder, "moderationStatus")}
                    </button>
                  </th>
                  <th className="p-4">Verified</th>
                  <th className="p-4 text-right">Orders</th>
                  <th className="p-4 text-right">Spent</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4">Last Login</th>
                  <th className="w-24 p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className={`border-t ${selectedIds.includes(user._id) ? "bg-amber-50" : ""}`}>
                    <td className="p-4">
                      <button type="button" onClick={() => toggleOne(user._id)} className="flex items-center">
                        {selectedIds.includes(user._id) ? <CheckSquare className="h-4 w-4 text-ember" /> : <Square className="h-4 w-4 text-gray-400" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <Link to={`/admin/users/${user._id}`} className="flex items-center gap-3 hover:underline">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (user.name || "U")[0].toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">{user.name || "—"}</span>
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-gray-600">{user.phone || "—"}</td>
                    <td className="p-4">
                      <StatusBadge status={user.moderationStatus || user.status || "active"} />
                    </td>
                    <td className="p-4">
                      {user.emailVerified ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <UserCheck className="h-3.5 w-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <UserX className="h-3.5 w-3.5" /> No
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium">{user.orderCount}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(user.totalSpent)}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-LK") : "—"}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-LK") : "Never"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-ember hover:bg-ember/5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-8">
              <Pagination current={page} total={pagination.pages} onChange={setPage} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget && deleteTarget._id !== "bulk"}
        title="Delete customer account?"
        message={`Are you sure you want to permanently disable ${deleteTarget?.name || "this customer"}'s account? This action can be reversed by an admin.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleSingleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget?._id === "bulk"}
        title={`Delete ${selectedIds.length} users?`}
        message={`Are you sure you want to delete ${selectedIds.length} user account(s)?`}
        confirmLabel={`Delete ${selectedIds.length}`}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const sortIcon = (sortBy, sortOrder, field) => {
  if (sortBy !== field) return null;
  return sortOrder === "asc" ? " ▲" : " ▼";
};

export default AdminUsersPage;
