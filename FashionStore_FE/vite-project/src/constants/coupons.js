export const COUPON_STORAGE_KEY = "fashionstore.savedCoupons";

export const isCouponExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
};
