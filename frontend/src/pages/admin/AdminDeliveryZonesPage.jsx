import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { DollarSign, Truck } from "lucide-react";
import { createDeliveryZone, deleteDeliveryZone, getDeliveryZones, seedDeliveryZones, updateDeliveryZone, bulkUpdateZones } from "../../services/deliveryZoneService.js";
import { getSetting, updateSetting } from "../../services/settingService.js";
import { formatCurrency } from "../../utils/formatters.js";

const AdminDeliveryZonesPage = () => {
  const { data, setData, loading } = useFetch(getDeliveryZones, []);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFee, setBulkFee] = useState("");
  const [bulkDays, setBulkDays] = useState("");
  const [bulking, setBulking] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ district: "", fee: "650", codAvailable: true, estimatedDays: "3-5 business days" });
  const [freeShipping, setFreeShipping] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getSetting("freeShipping").then((s) => setFreeShipping(s.value)).catch(() => {});
  }, []);

  const zones = Array.isArray(data) ? data : [];

  const resetForm = () => {
    setForm({ district: "", fee: "650", codAvailable: true, estimatedDays: "3-5 business days" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        district: form.district,
        fee: Number(form.fee),
        codAvailable: form.codAvailable,
        estimatedDays: form.estimatedDays
      };

      if (editId) {
        const updated = await updateDeliveryZone(editId, payload);
        setData(zones.map((z) => (z._id === editId ? updated : z)));
        toast.success("Zone updated.");
      } else {
        const zone = await createDeliveryZone(payload);
        setData([...zones, zone]);
        toast.success("Zone created.");
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save zone.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (zone) => {
    setEditId(zone._id);
    setForm({
      district: zone.district,
      fee: String(zone.fee),
      codAvailable: zone.codAvailable,
      estimatedDays: zone.estimatedDays || "3-5 business days"
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDeliveryZone(deleteTarget);
      setData(zones.filter((z) => z._id !== deleteTarget));
      toast.success("Zone deleted.");
    } catch (err) {
      toast.error("Could not delete zone.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-black">Delivery Zones</h1>
      <p className="mt-1 text-sm text-gray-600">Manage district-wise delivery fees and COD availability.</p>

      <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-bold text-sm">Free Shipping</p>
            <p className="text-xs text-gray-500">{freeShipping ? "All orders get free delivery" : "Delivery fees are charged per zone"}</p>
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

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-bold">{editId ? "Edit Zone" : "Add Zone"}</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">District</label>
              <input className="input mt-1" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Colombo" required />
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Fee (LKR)</label>
              <input className="input mt-1" type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Delivery Days</label>
              <input className="input mt-1" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} placeholder="3-5 business days" />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="accent-ember h-5 w-5" checked={form.codAvailable} onChange={(e) => setForm({ ...form, codAvailable: e.target.checked })} />
              <span className="text-sm font-medium">Cash on Delivery Available</span>
            </label>
            <div className="flex gap-3">
              <button className="btn-primary flex-1" disabled={saving}>{saving ? "Saving..." : editId ? "Update Zone" : "Add Zone"}</button>
              {editId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        <div>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : zones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-600">No zones configured.</p>
              <button className="btn-primary mt-4" disabled={seeding} onClick={async () => {
                setSeeding(true);
                try {
                  const seeded = await seedDeliveryZones();
                  setData(seeded);
                  toast.success(`Added ${seeded.length} default delivery zones.`);
                } catch (err) {
                  toast.error(err.response?.data?.message || "Could not seed zones.");
                } finally {
                  setSeeding(false);
                }
              }}>
                {seeding ? "Configuring..." : "Configure Default Zones"}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">{zones.length} zones</p>
                <button className="btn-secondary text-sm" onClick={() => { setBulkMode(!bulkMode); setBulkFee(""); setBulkDays(""); }}>
                  <DollarSign className="h-4 w-4" /> {bulkMode ? "Cancel" : "Bulk Update"}
                </button>
              </div>

              {bulkMode && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800">Bulk Update All Zones</p>
                  <div className="mt-3 grid gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-blue-700">Delivery Fee (LKR)</label>
                      <input className="input" type="number" min="0" placeholder="Leave blank to keep current" value={bulkFee} onChange={(e) => setBulkFee(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-blue-700">Estimated Days</label>
                      <input className="input" placeholder="Leave blank to keep current" value={bulkDays} onChange={(e) => setBulkDays(e.target.value)} />
                    </div>
                    <button className="btn-primary text-sm" disabled={bulking || (!bulkFee && !bulkDays)} onClick={async () => {
                      setBulking(true);
                      try {
                        const payload = {};
                        if (bulkFee) payload.fee = Number(bulkFee);
                        if (bulkDays) payload.estimatedDays = bulkDays;
                        const result = await bulkUpdateZones(payload);
                        setData(result.zones);
                        const parts = [];
                        if (payload.fee !== undefined) parts.push(`fee to ${formatCurrency(payload.fee)}`);
                        if (payload.estimatedDays) parts.push(`days to "${payload.estimatedDays}"`);
                        toast.success(`Updated ${result.modifiedCount} zones (${parts.join(", ")}).`);
                        setBulkFee("");
                        setBulkDays("");
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Bulk update failed.");
                      } finally {
                        setBulking(false);
                      }
                    }}>
                      {bulking ? "Applying..." : "Apply to All Zones"}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
              {zones.map((zone) => (
                <div key={zone._id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{zone.district}</p>
                      <p className="text-sm text-gray-600">Fee: {formatCurrency(zone.fee)}</p>
                      <p className="text-xs text-gray-500">{zone.estimatedDays}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${zone.codAvailable ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                        COD: {zone.codAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:underline" onClick={() => handleEdit(zone)}>Edit</button>
                      <button className="text-sm text-red-600 hover:underline" onClick={() => setDeleteTarget(zone._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete zone?"
        message="Are you sure you want to delete this delivery zone? This action cannot be undone."
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
