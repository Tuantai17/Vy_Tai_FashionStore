export const CUSTOMER_TOKEN_KEY = "customerToken";
export const CUSTOMER_USER_KEY = "customerUser";
export const ADMIN_TOKEN_KEY = "adminToken";
export const ADMIN_USER_KEY = "adminUser";

const LEGACY_CUSTOMER_TOKEN_KEYS = [
  "token",
  "mbs.customer.token",
  "mbs.customerToken",
];
const LEGACY_CUSTOMER_USER_KEYS = ["user"];

const LEGACY_ADMIN_TOKEN_KEYS = ["admin_token"];
const LEGACY_ADMIN_USER_KEYS = ["admin_user"];
const LEGACY_ADMIN_SESSION_KEYS = ["admin_session"];

const pickStored = (keys) => {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const setCustomerSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
  }

  LEGACY_CUSTOMER_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_CUSTOMER_USER_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearCustomerSession = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
  LEGACY_CUSTOMER_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_CUSTOMER_USER_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getCustomerToken = () =>
  localStorage.getItem(CUSTOMER_TOKEN_KEY) ||
  pickStored(LEGACY_CUSTOMER_TOKEN_KEYS);

export const getCustomerUser = () =>
  safeParse(
    localStorage.getItem(CUSTOMER_USER_KEY) ||
      pickStored(LEGACY_CUSTOMER_USER_KEYS)
  );

export const setAdminSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  }

  LEGACY_ADMIN_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_ADMIN_USER_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  LEGACY_ADMIN_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_ADMIN_USER_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_ADMIN_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getAdminToken = () =>
  localStorage.getItem(ADMIN_TOKEN_KEY) || pickStored(LEGACY_ADMIN_TOKEN_KEYS);

export const getAdminUser = () =>
  safeParse(
    localStorage.getItem(ADMIN_USER_KEY) ||
      pickStored(LEGACY_ADMIN_USER_KEYS)
  );
