const KEY = "mini_hobbies_my_orders";

export const saveTrackedOrder = ({ orderNumber, phone }) => {
  const existing = getTrackedOrders();
  const entry = {
    orderNumber,
    phone,
    savedAt: new Date().toISOString()
  };

  const next = [entry, ...existing.filter((order) => order.orderNumber !== orderNumber)];
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 20)));
};

export const getTrackedOrders = () => {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
