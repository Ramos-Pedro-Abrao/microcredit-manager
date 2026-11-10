export function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function email(value) {
  return typeof value === "string"
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function minLength(value, length) {
  return typeof value === "string" && value.length >= length;
}

export function numberAtLeastZero(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  return /^\d{1,12}(?:\.\d{1,2})?$/.test(value.trim());
}
