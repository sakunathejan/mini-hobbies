import { Clock, ExternalLink, MapPin, Package, Phone, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { getKoombiyoWaybillTracking } from "../services/koombiyoService.js";
import { formatCurrency } from "../utils/formatters.js";

const statusIcon = {
  pending: Package,
  pickup_requested: Clock,
  processing: Clock,
  in_transit: Truck,
  delivered: Truck,
  returned: Package,
  cancelled: Package
};

function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    pickup_requested: "bg-blue-100 text-blue-800",
    processing: "bg-blue-100 text-blue-800",
    in_transit: "bg-purple-100 text-purple-800",
    delivered: "bg-emerald-100 text-emerald-800",
    returned: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

const TrackingPage = () => {
  const { waybillId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTracking = useCallback(async () => {
    if (!waybillId) return;
    setLoading(true);
    setError("");
    try {
      const result = await getKoombiyoWaybillTracking(waybillId);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Could not find tracking information for this waybill.");
    } finally {
      setLoading(false);
    }
  }, [waybillId]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const tracking = data?.tracking;
  const order = data?.order;
  const trackingUrl = data?.trackingUrl;
  const history = tracking?.history || [];

  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ember" />
        <p className="mt-4 text-gray-600">Loading tracking information...</p>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="container-page py-20 text-center">
        <Package className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">Tracking Not Found</h1>
        <p className="mt-2 text-gray-600">{error || "No tracking information available for this waybill."}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex min-h-[48px]">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Seo title={`Track Waybill ${waybillId}`} description={`Tracking status for waybill ${waybillId}`} canonical={`/track/${waybillId}`} />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black">Track Shipment</h1>
              <p className="mt-1 break-all text-sm text-gray-500">Waybill: <span className="font-mono font-semibold">{waybillId}</span></p>
              {order?.orderNumber && (
                <p className="text-sm text-gray-500">Order: <span className="font-semibold">{order.orderNumber}</span></p>
              )}
            </div>
            <StatusBadge status={tracking.status} />
          </div>

          {order?.customerName && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{order.customerName}</span>
            </div>
          )}

          {tracking.location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Current location: {tracking.location}</span>
            </div>
          )}

          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-4 inline-flex min-h-[44px]">
              <ExternalLink className="h-4 w-4" /> Track on Koombiyo
            </a>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
              <Truck className="h-4 w-4" /> Tracking History
            </h2>
            <div className="mt-6 space-y-0">
              {[...history].reverse().map((entry, idx) => (
                <div key={idx} className="relative flex gap-4 pb-6">
                  {idx < history.length - 1 && (
                    <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gray-200" />
                  )}
                  <div className={`mt-1 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    idx === 0 ? "border-ember bg-ember/10" : "border-gray-300 bg-white"
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${idx === 0 ? "bg-ember" : "bg-gray-300"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{entry.label || entry.status}</span>
                      <StatusBadge status={entry.status} />
                    </div>
                    {entry.location && <p className="mt-0.5 text-xs text-gray-500">{entry.location}</p>}
                    {entry.note && <p className="mt-0.5 text-xs text-gray-500">{entry.note}</p>}
                    {entry.timestamp && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order?.delivery?.shipmentCreatedAt && (
          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
              <Clock className="h-4 w-4" /> Shipment Details
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Shipped on</span>
                <span className="font-medium">
                  {new Date(order.delivery.shipmentCreatedAt).toLocaleDateString("en-LK", { dateStyle: "long" })}
                </span>
              </div>
              {order.delivery.lastTrackingSyncAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last updated</span>
                  <span className="font-medium">
                    {new Date(order.delivery.lastTrackingSyncAt).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/track-order" className="btn-secondary min-h-[44px]">
            <Package className="h-4 w-4" /> Track by Order Number
          </Link>
          <Link to="/" className="btn-secondary min-h-[44px]">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
