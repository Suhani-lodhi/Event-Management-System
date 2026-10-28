export const emptyPriceRow = () => ({
  seatCategoryId: "",
  alias: "",
  price: "",
  seatsForSale: "",
});

export function validatePricingRows(rows, categories) {
  const seen = new Set();

  for (const r of rows) {
    const cat = categories.find((c) => String(c.id) === String(r.seatCategoryId));
    if (!cat) return "Select a category for every row";

    if (seen.has(cat.id)) return `"${cat.categoryName}" is added twice`;
    seen.add(cat.id);

    const price = Number(r.price);
    if (r.price === "" || Number.isNaN(price) || price < 0) {
      return `Enter a valid price for "${cat.categoryName}"`;
    }

    if (r.seatsForSale !== "") {
      const seats = Number(r.seatsForSale);
      if (!Number.isInteger(seats) || seats < 1) {
        return `Seats for "${cat.categoryName}" must be a whole number, 1 or more`;
      }
      if (seats > cat.seatCount) {
        return `"${cat.categoryName}" has only ${cat.seatCount} seats`;
      }
    }
  }
  return null;
}

// shape the backend expects: { seatCategoryId, alias?, price, seatsForSale? }
// alias and seatsForSale are left out when empty
export const toPricingPayload = (rows) =>
  rows.map((r) => ({
    seatCategoryId: r.seatCategoryId,
    price: Number(r.price),
    ...(r.alias.trim() ? { alias: r.alias.trim() } : {}),
    ...(r.seatsForSale !== "" ? { seatsForSale: Number(r.seatsForSale) } : {}),
  }));

export const sumSeatsForSale = (rows, categories) =>
  rows.reduce((total, r) => {
    if (r.seatsForSale !== "") return total + (Number(r.seatsForSale) || 0);
    const cat = categories.find((c) => String(c.id) === String(r.seatCategoryId));
    return total + (cat ? cat.seatCount : 0);
  }, 0);