import { Truck, ExternalLink, RefreshCw, Package, Loader2, ArrowUpDown, Undo2, ClipboardList, Clock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/formatters.js";
import {
  createKoombiyoShipment,
  refreshKoombiyoTracking,
  requestKoombiyoPickup,
  getKoombiyoReturnNotes,
  getKoombiyoReturnItems,
  processKoombiyoReturnReceive,
} from "../../services/koombiyoService.js";

const DELIVERY_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-800",
  processing: "bg-blue-50 text-blue-800",
  in_transit: "bg-sky-50 text-sky-800",
  delivered: "bg-emerald-50 text-emerald-800",
  returned: "bg-red-50 text-red-700",
  cancelled: "bg-gray-50 text-gray-700",
};

const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
};

const deliveryIcon = (status) => {
  switch (status) {
    case "delivered": return Truck;
    case "returned": return Undo2;
    default: return Package;
  }
};

export const canCreateShipment = (order) => {
  if (order.status === "Cancelled" || order.status === "Returned") return false;
  const eligibleStatuses = ["Fully Paid", "Preparing Order", "Shipped", "Delivered"];
  return eligibleStatuses.includes(order.status) || order.paymentMethod === "cod";
};

export const KoombiyoDeliveryBadge = ({ status }) => {
  if (!status) return null;
  const s = String(status).toLowerCase();
  const label = STATUS_LABELS[s] || status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${DELIVERY_STATUS_STYLES[s] || "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
};

const DeliveryTimeline = ({ history }) => {
  if (!history || history.length === 0) return <p className="text-xs text-gray-400">No tracking history yet.</p>;
  return (
    <div className="space-y-2">
      {[...history].reverse().map((entry, i) => {
        const Icon = deliveryIcon(entry.status);
        return (
          <div key={i} className="flex gap-2 text-xs">
            <div className="flex flex-col items-center">
              <Icon className="h-3.5 w-3.5 text-gray-400" />
              {i < history.length - 1 && <div className="mt-1 h-4 w-px bg-gray-200" />}
            </div>
            <div>
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${DELIVERY_STATUS_STYLES[entry.status] || "bg-gray-100 text-gray-700"}`}>
                {STATUS_LABELS[entry.status] || entry.status}
              </span>
              {entry.location && <span className="ml-1 text-gray-500">{entry.location}</span>}
              {entry.timestamp && (
                <p className="text-gray-400">{new Date(entry.timestamp).toLocaleString("en-LK")}</p>
              )}
              {entry.note && <p className="text-gray-500">{entry.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PickupModal = ({ order, onClose }) => {
  const [vehicleType, setVehicleType] = useState("Bike");
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [pickupAddress, setPickupAddress] = useState(order?.customer?.address || "");
  const [phone, setPhone] = useState(order?.customer?.phone || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await requestKoombiyoPickup({
        vehicleType,
        qty,
        remarks,
        pickupAddress,
        phone,
        orderId: order._id,
      });
      if (result.success) {
        toast.success("Pickup request submitted");
        onClose();
      } else {
        toast.error(result.error || "Could not request pickup");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not request pickup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
          <ArrowUpDown className="h-4 w-4" /> Request Pickup
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Vehicle Type</label>
            <select className="input w-full text-sm" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="Bike">Bike</option>
              <option value="Three wheel">Three Wheel</option>
              <option value="Lorry">Lorry</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Quantity</label>
            <input type="number" min={1} className="input w-full text-sm" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Pickup Address</label>
            <input className="input w-full text-sm" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Phone</label>
            <input className="input w-full text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Remarks</label>
            <input className="input w-full text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm min-h-[40px]">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm min-h-[40px]">
              {submitting ? "Submitting..." : "Request Pickup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReturnsModal = ({ order, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const result = await getKoombiyoReturnNotes();
      if (result.success) setNotes(result.notes || []);
    } catch {}
    setLoading(false);
  };

  const loadItems = async (noteId) => {
    setLoading(true);
    setSelectedNote(noteId);
    try {
      const result = await getKoombiyoReturnItems(noteId);
      if (result.success) setItems(result.items || []);
    } catch {}
    setLoading(false);
  };

  const handleReturnReceive = async (waybillId) => {
    setProcessing(true);
    try {
      const result = await processKoombiyoReturnReceive(waybillId);
      if (result.success) {
        toast.success("Return processed");
      } else {
        toast.error(result.error || "Could not process return");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not process return");
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
          <Undo2 className="h-4 w-4" /> Returns Management
        </h3>

        <div className="mt-4 space-y-3">
          <button onClick={loadNotes} disabled={loading} className="btn-secondary w-full text-sm min-h-[40px]">
            {loading ? "Loading..." : "Load Return Notes"}
          </button>

          {notes.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {notes.map((note) => (
                <button
                  key={note.id || note.note_id}
                  onClick={() => loadItems(note.id || note.note_id)}
                  className={`w-full rounded-lg border p-3 text-left text-xs transition ${selectedNote === (note.id || note.note_id) ? "border-ember bg-amber-50" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <p className="font-semibold text-gray-700">Note #{note.id || note.note_id}</p>
                  {note.date && <p className="text-gray-500">{note.date}</p>}
                </button>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              <p className="text-xs font-bold text-gray-500">Return Items</p>
              {items.map((item, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs">
                  <p className="font-medium text-gray-700">{item.name || item.item_name || `Item ${i + 1}`}</p>
                  <p className="text-gray-500">Waybill: {item.waybillid || item.waybill_id || "—"}</p>
                  {item.waybillid && (
                    <button
                      onClick={() => handleReturnReceive(item.waybillid)}
                      disabled={processing}
                      className="mt-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      {processing ? "..." : "Mark as Received"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!notes.length && !loading && (
            <p className="text-xs text-gray-400">Click "Load Return Notes" to fetch returns from Koombiyo.</p>
          )}
        </div>

        <button onClick={onClose} className="btn-secondary mt-4 w-full text-sm min-h-[40px]">Close</button>
      </div>
    </div>
  );
};

const KoombiyoDeliveryPanel = ({ order, onShipmentCreated, compact, showActions, readOnly }) => {
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPickup, setShowPickup] = useState(false);
  const [showReturns, setShowReturns] = useState(false);

  const delivery = order.delivery || {};
  const canCreate = !readOnly && canCreateShipment(order) && !delivery.shipmentCreated;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await createKoombiyoShipment(order._id);
      if (result.success) {
        toast.success("Shipment created successfully");
        if (onShipmentCreated) onShipmentCreated(result.order);
      } else {
        toast.error(result.error || "Could not create shipment.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create shipment.");
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshKoombiyoTracking(order._id);
      if (result.success) {
        if (result.lifecycleStatus === "CANCELLED") {
          const updatedOrder = { ...order, status: "Cancelled", delivery: result.delivery || order.delivery, lifecycleStatus: "CANCELLED" };
          if (onShipmentCreated) onShipmentCreated(updatedOrder);
          toast.success("Order cancelled — deleted from Koombiyo portal");
        } else {
          const updatedOrder = { ...order, delivery: result.delivery || order.delivery };
          if (onShipmentCreated) onShipmentCreated(updatedOrder);
          toast.success("Tracking refreshed");
        }
      } else {
        toast.error(result.error || "Could not refresh tracking.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not refresh tracking.");
    } finally {
      setRefreshing(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {delivery.shipmentCreated ? (
          <>
            <KoombiyoDeliveryBadge status={delivery.deliveryStatus} />
            {delivery.waybillId && <span className="text-xs text-gray-500">#{delivery.waybillId}</span>}
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Refresh tracking">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </>
        ) : canCreate ? (
          <button type="button" onClick={handleCreate} disabled={creating} className="btn-primary text-xs min-h-[30px] px-3 py-1">
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
            Ship
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Truck className="h-4 w-4" /> Koombiyo Delivery
          </h4>
          <div className="flex items-center gap-2">
            {delivery.shipmentCreated && (
              <button type="button" onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-xs min-h-[32px] px-3 py-1">
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                Sync
              </button>
            )}
            {canCreate && (
              <button type="button" onClick={handleCreate} disabled={creating} className="btn-primary text-xs min-h-[32px] px-3 py-1">
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                Create shipment
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400">Provider</p>
            <p className="font-semibold text-sm">{delivery.provider || "Koombiyo"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Waybill</p>
            <p className="font-semibold text-sm">{delivery.waybillId || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <KoombiyoDeliveryBadge status={delivery.deliveryStatus} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Last Sync</p>
            <p className="text-xs text-gray-600">
              {delivery.lastTrackingSyncAt
                ? new Date(delivery.lastTrackingSyncAt).toLocaleString("en-LK")
                : "—"}
            </p>
          </div>
        </div>

        {delivery.trackingUrl && (
          <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-ember hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Track on Koombiyo
          </a>
        )}

        {!readOnly && (showActions || order?.delivery?.shipmentCreated) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {delivery.shipmentCreated && (
              <button type="button" onClick={() => setShowPickup(true)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                <ArrowUpDown className="mr-1 inline h-3 w-3" />
                Request Pickup
              </button>
            )}
            <button type="button" onClick={() => setShowReturns(true)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Undo2 className="mr-1 inline h-3 w-3" />
              View Returns
            </button>
          </div>
        )}

        {delivery.shipmentCreated && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <Clock className="h-3 w-3" /> Tracking history
            </p>
            <DeliveryTimeline history={delivery.history} />
          </div>
        )}

        {!delivery.shipmentCreated && (
          <>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
              <p className="mb-2 font-semibold text-gray-700">Payment Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product Value</span>
                  <span className="font-medium">{formatCurrency(order.productValue || order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Charge</span>
                  <span className="font-medium">{formatCurrency(order.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold">{formatCurrency(order.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium capitalize">{order.paymentMethod || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status</span>
                  <span className={`font-medium capitalize ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.paymentStatus || "pending"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 text-xs">
                  <span className="font-semibold text-gray-700">COD Amount to Koombiyo</span>
                  <span className={`font-bold ${order.paymentMethod === "cod" ? "text-amber-700" : "text-emerald-700"}`}>
                    {order.paymentMethod === "cod" ? formatCurrency(order.total || 0) : formatCurrency(0)}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {canCreate ? `Click "Create shipment" to send this order to Koombiyo.` : "Shipment will be created once the order is fully paid."}
            </p>
          </>
        )}
      </div>

      {showPickup && <PickupModal order={order} onClose={() => setShowPickup(false)} />}
      {showReturns && <ReturnsModal order={order} onClose={() => setShowReturns(false)} />}
    </>
  );
};

export default KoombiyoDeliveryPanel;
