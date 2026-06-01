export function addTimelineEntry(order, status, { note = "", source = "system" } = {}) {
  if (!order.orderTimeline) order.orderTimeline = [];
  const last = order.orderTimeline[order.orderTimeline.length - 1];
  if (last && last.status === status) return false;
  order.orderTimeline.push({
    status,
    timestamp: new Date(),
    note,
    source
  });
  return true;
}

export function getTimeline(order) {
  return (order.orderTimeline || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
