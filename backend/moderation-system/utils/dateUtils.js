export const toUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

export const isExpired = (date) => {
  if (!date) return false;
  return new Date() >= new Date(date);
};

export const getRemainingSeconds = (endDate) => {
  if (!endDate) return 0;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.floor(diff / 1000));
};
