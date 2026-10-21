
export const emptyCategory = () => ({
  categoryName: "",
  categoryDetail: "",
  seatCount: "",
});


export function validateCategory({ categoryName, seatCount }) {
  if (!String(categoryName ?? "").trim()) {
    return "Category name is required";
  }
  const count = Number(seatCount);
  if (seatCount === "" || !Number.isInteger(count) || count < 1) {
    return "Seat count must be a whole number, 1 or more";
  }
  return null;
}

export const toCategoryPayload = (c) => ({
  categoryName: c.categoryName.trim(),
  categoryDetail: String(c.categoryDetail ?? "").trim() || null,
  seatCount: Number(c.seatCount),
});

export const sumSeats = (categories = []) =>
  categories.reduce((total, c) => total + (Number(c.seatCount) || 0), 0);


export function hasDuplicateNames(categories = []) {
  const names = categories.map((c) => c.categoryName.trim().toLowerCase());
  return new Set(names).size !== names.length;
}