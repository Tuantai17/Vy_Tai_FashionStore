import { apiGet, apiPost, apiDelete } from "./api";

const TOGGLE_PATH = "/wishlist/toggle";
const LIST_PATH = "/wishlist";

export const wishlistList = (opts = {}) =>
  apiGet(LIST_PATH, { auth: true, timeout: 45000, ...opts });

export const wishlistToggle = (productId, opts = {}) =>
  apiPost(TOGGLE_PATH, { product_id: productId }, { auth: true, timeout: 45000, ...opts });

export const wishlistRemove = (productId, opts = {}) =>
  apiDelete(`${LIST_PATH}/${productId}`, { auth: true, timeout: 45000, ...opts });

export const wishlistAdd = (productId) => wishlistToggle(productId);
