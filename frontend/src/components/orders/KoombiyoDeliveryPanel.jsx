import { Truck, ExternalLink, RefreshCw, Package, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { createKoombiyoShipment, refreshKoombiyoTracking } from "../../services/koombiyoService.js";

const DELIVERY_STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-800",
  Booked: "bg-blue-50 text-blue-800",
  Picked: "bg-indigo-50 text-indigo-800",
  InTransit: "bg-sky-50 text-sky-800",
  Delivered: "bg-emerald-50 text-emerald-800",
  Failed: "bg-red-50 text-red-700",
  Cancelled: "bg-gray-50 text-gray-700",
};

const deliveryIcon = (status) => {
  switch (status) {
    case "Delivered": return Truck;
    default: return Package;
  }
};

export const canCreateShipment = (order) => {
  const eligibleStatuses = ["Fully Paid", "Preparing Order", "Shipped", "Delivered"];
  return eligibleStatuses.includes(order.status) || order.paymentMethod === "cod";
};

export const KoombiyoDeliveryBadge = ({ status }) => {
  if (!status) return null;
  const s = String(status);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${DELIVERY_STATUS_STYLES[s] || "bg-gray-100 text-gray-700"}`}>
      {s}
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
                {entry.status}
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

const KoombiyoDeliveryPanel = ({ order, onShipmentCreated, compact }) => {
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const delivery = order.delivery || {};
  const canCreate = canCreateShipment(order) && !delivery.shipmentCreated;

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
        if (onShipmentCreated) onShipmentCreated(result.order);
        toast.success("Tracking refreshed");
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <Truck className="h-4 w-4" /> Delivery ({delivery.provider || "Not shipped"})
        </h4>
        <div className="flex items-center gap-2">
          {delivery.shipmentCreated && (
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-xs min-h-[32px] px-3 py-1">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
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

      {delivery.shipmentCreated ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-600">Waybill: <strong>{delivery.waybillId || "—"}</strong></span>
            <KoombiyoDeliveryBadge status={delivery.deliveryStatus} />
          </div>
          {delivery.trackingUrl && (
            <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-ember hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Track on Koombiyo
            </a>
          )}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">Tracking history</p>
            <DeliveryTimeline history={delivery.history} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">
          {canCreate ? `Click "Create shipment" to send this order to Koombiyo.` : "Shipment will be created once the order is ready."}
        </p>
      )}
    </div>
  );
};

export default KoombiyoDeliveryPanel;
