import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import {
  CheckCircle2, CloudUpload, FileText,
  MapPin, Search, Truck, X, Upload, Clock,
  PackageCheck, RefreshCw, Trash2, ArrowRight
} from "lucide-react";
import {
  getDeliveryZones, importCSV, getImportHistory,
  toggleZoneActive, deleteDeliveryZone, getZoneStats,
  bulkDeleteZones
} from "../../services/deliveryZoneService.js";
import { getSetting, updateSetting } from "../../services/settingService.js";
import { formatCurrency } from "../../utils/formatters.js";

const AdminDeliveryZonesPage = () => {
  const { data: zones, setData, loading } = useFetch(() => getDeliveryZones({}), []);
  const [stats, setStats] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [importReport, setImportReport] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    getSetting("freeShipping").then((s) => setFreeShipping(s.value)).catch(() => {});
    getZoneStats().then(setStats).catch(() => {});
    getImportHistory().then(setImportHistory).catch(() => {});
  }, []);

  const refreshAll = useCallback(async () => {
    const [z, st, hist] = await Promise.allSettled([
      getDeliveryZones({}),
      getZoneStats(),
      getImportHistory()
    ]);
    if (z.status === "fulfilled") setData(z.value);
    if (st.status === "fulfilled") setStats(st.value);
    if (hist.status === "fulfilled") setImportHistory(hist.value);
  }, [setData]);

  const filteredZones = Array.isArray(zones)
    ? zones.filter((z) => {
        if (!showInactive && !z.isActive) return false;
        const q = search.toLowerCase();
        if (q && !z.from.toLowerCase().includes(q) && !z.to.toLowerCase().includes(q)) return false;
        if (originFilter && z.from.toLowerCase() !== originFilter.toLowerCase()) return false;
        return true;
      })
    : [];

  const originOptions = Array.isArray(zones)
    ? [...new Set(zones.map((z) => z.from))].sort()
    : [];

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setImportReport(null);
    try {
      const report = await importCSV(file, (e) => {
        const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
        setUploadProgress(pct);
      });
      setImportReport(report);
      toast.success(`Imported ${report.imported} routes, updated ${report.updated}.`);
      await refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "CSV import failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleToggle = async (id) => {
    try {
      const updated = await toggleZoneActive(id);
      setData(zones.map((z) => (z._id === id ? { ...z, isActive: updated.isActive } : z)));
      toast.success(updated.isActive ? "Route activated." : "Route deactivated.");
      getZoneStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Could not toggle route.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDeliveryZone(deleteTarget);
      setData(zones.filter((z) => z._id !== deleteTarget));
      setSelectedIds(new Set());
      toast.success("Route deleted.");
      getZoneStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Could not delete route.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredZones.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredZones.map((z) => z._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const result = await bulkDeleteZones([...selectedIds]);
      setData(zones.filter((z) => !selectedIds.has(z._id)));
      setSelectedIds(new Set());
      toast.success(result.message);
      getZoneStats().then(setStats).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Delivery Zones</h1>
          <p className="mt-1 text-sm text-gray-600">Import Koombiyo CSV rates or manage delivery routes.</p>
        </div>
        <button className="btn-secondary text-sm min-h-[44px] self-start" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Total Routes</span>
            </div>
            <p className="mt-1 text-2xl font-black">{stats.totalZones}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500">Active</span>
            </div>
            <p className="mt-1 text-2xl font-black">{stats.activeZones}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-gray-500">Origins</span>
            </div>
            <p className="mt-1 text-2xl font-black">{stats.origins?.length || 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-500">Providers</span>
            </div>
            <p className="mt-1 text-2xl font-black">{Object.keys(stats.zonesByProvider || {}).length}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-bold text-sm">Free Shipping</p>
            <p className="text-xs text-gray-500">{freeShipping ? "All orders get free delivery" : "Delivery fees are charged per route"}</p>
          </div>
        </div>
        <button
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition disabled:opacity-50 ${freeShipping ? "bg-ember" : "bg-gray-200"}`}
          disabled={toggling}
          onClick={async () => {
            setToggling(true);
            try {
              const s = await updateSetting("freeShipping", !freeShipping);
              setFreeShipping(s.value);
              toast.success(s.value ? "Free shipping enabled." : "Free shipping disabled.");
            } catch {
              toast.error("Could not update setting.");
            } finally {
              setToggling(false);
            }
          }}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${freeShipping ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-ember" />
              Upload Koombiyo CSV
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Upload the official Koombiyo delivery rate CSV to import or update routes.
            </p>

            <div
              className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition min-h-[160px] ${dragOver ? "border-ember bg-ember/5" : "border-gray-300 hover:border-gray-400"} ${uploading ? "pointer-events-none opacity-60" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="w-full max-w-xs">
                  <Upload className="mx-auto h-8 w-8 text-ember animate-bounce" />
                  <p className="mt-2 text-sm font-medium">Uploading... {uploadProgress}%</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-ember transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : importReport ? (
                <div className="w-full max-w-sm text-left">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-bold">Import Complete</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <p className="text-lg font-black text-emerald-600">{importReport.imported}</p>
                      <p className="text-xs text-gray-500">Imported</p>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <p className="text-lg font-black text-blue-600">{importReport.updated}</p>
                      <p className="text-xs text-gray-500">Updated</p>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <p className="text-lg font-black text-amber-600">{importReport.skipped}</p>
                      <p className="text-xs text-gray-500">Skipped</p>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <p className="text-lg font-black text-red-600">{importReport.invalid}</p>
                      <p className="text-xs text-gray-500">Invalid</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    File: {importReport.sourceFile} &middot; {importReport.totalRows} rows processed
                  </p>
                  {importReport.invalidRows?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-red-600">
                        View {importReport.invalidRows.length} invalid rows
                      </summary>
                      <div className="mt-1 max-h-32 overflow-y-auto text-xs text-gray-600">
                        {importReport.invalidRows.map((r, i) => (
                          <p key={i} className="py-0.5">Line {r.line}: {r.reason}</p>
                        ))}
                      </div>
                    </details>
                  )}
                  <button className="btn-secondary mt-3 w-full text-sm min-h-[44px]" onClick={() => setImportReport(null)}>
                    <X className="h-4 w-4" /> Dismiss
                  </button>
                </div>
              ) : (
                <>
                  <CloudUpload className={`h-10 w-10 ${dragOver ? "text-ember" : "text-gray-300"}`} />
                  <p className="mt-2 text-sm font-medium">
                    {dragOver ? "Drop CSV here" : "Drag & drop CSV here"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">or</p>
                  <label className="btn-primary mt-3 cursor-pointer min-h-[44px]">
                    <FileText className="h-4 w-4" />
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; handleFile(f); }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-400">Only .csv files up to 5MB</p>
                </>
              )}
            </div>
          </div>

          {importHistory.length > 0 && (
            <div className="rounded-lg border bg-white p-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Import History
              </h2>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {importHistory.map((entry) => (
                  <div key={entry._id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.details?.report?.imported || 0} imported</span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      File: {entry.details?.file || entry.details?.report?.sourceFile || "unknown"}
                      {entry.admin?.name && ` by ${entry.admin.name}`}
                    </p>
                    {entry.details?.report && (
                      <div className="mt-1 flex gap-2 text-xs text-gray-500">
                        <span>{entry.details.report.updated} updated</span>
                        <span>{entry.details.report.skipped} skipped</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 text-base"
                placeholder="Search origins or destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input text-base sm:w-44"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
            >
              <option value="">All Origins</option>
              {originOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                className="accent-ember h-4 w-4"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
              />
              Show inactive
            </label>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <p className="text-sm font-medium text-red-800">
                {selectedIds.size} route{selectedIds.size > 1 ? "s" : ""} selected
              </p>
              <button
                className="btn-danger text-sm min-h-[44px]"
                disabled={bulkDeleting}
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : filteredZones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <MapPin className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-600">
                {zones.length === 0
                  ? "No delivery routes yet. Upload a CSV to get started."
                  : "No routes match your filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="mobile-card-grid">
                {filteredZones.map((zone) => (
                  <div key={zone._id} className={`rounded-lg border bg-white p-3 ${!zone.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="accent-ember mt-1 h-4 w-4 shrink-0"
                        checked={selectedIds.has(zone._id)}
                        onChange={() => toggleSelection(zone._id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <span>{zone.from}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span>{zone.to}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span><span className="text-gray-700">{formatCurrency(zone.firstKgCharge)}</span> first kg</span>
                          <span><span className="text-gray-700">{formatCurrency(zone.additionalKgCharge)}</span> additional</span>
                          <span>{zone.courierProvider || "koombiyo"}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(zone._id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition ${zone.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {zone.isActive ? "Active" : "Inactive"}
                          </button>
                          <button className="text-xs text-red-600 hover:underline" onClick={() => setDeleteTarget(zone._id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="desktop-table overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          className="accent-ember h-4 w-4"
                          checked={filteredZones.length > 0 && selectedIds.size === filteredZones.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">First Kg</th>
                      <th className="px-4 py-3">Additional Kg</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredZones.map((zone) => (
                      <tr key={zone._id} className={`hover:bg-gray-50 ${!zone.isActive ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="accent-ember h-4 w-4"
                            checked={selectedIds.has(zone._id)}
                            onChange={() => toggleSelection(zone._id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{zone.from}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{zone.to}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(zone.firstKgCharge)}</td>
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(zone.additionalKgCharge)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{zone.courierProvider || "koombiyo"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(zone._id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition ${zone.isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {zone.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => setDeleteTarget(zone._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t px-4 py-2 text-xs text-gray-500">
                  Showing {filteredZones.length} of {Array.isArray(zones) ? zones.length : 0} routes
                </p>
              </div>
            </>
          )}

          {stats?.latestImport && (
            <p className="text-xs text-gray-500">
              Latest import: {new Date(stats.latestImport.createdAt).toLocaleString("en-LK")}
              {stats.latestImport.admin?.name && ` by ${stats.latestImport.admin.name}`}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete route?"
        message="Are you sure you want to delete this delivery route? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminDeliveryZonesPage;
