import { apiGet, apiPost, apiDelete } from "./api";

const TOGGLE_PATH = "/wishlist/toggle";
const LIST_PATH = "/wishlist";

export const wishlistList = () => apiGet(LIST_PATH, { auth: true });

export const wishlistToggle = (productId) =>
  apiPost(TOGGLE_PATH, { product_id: productId }, { auth: true });

export const wishlistRemove = (productId) =>
  apiDelete(`${LIST_PATH}/${productId}`, { auth: true });

export const wishlistAdd = (productId) => wishlistToggle(productId);
