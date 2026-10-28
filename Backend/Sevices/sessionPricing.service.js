export const buildSessionPricing = (items, categories) => {
  if (!Array.isArray(items)) return { error: "categories must be an array" };

  const used = new Set();
  const data = [];

  for (const item of items) {
    const category = categories.find(
      (c) => String(c.id) === String(item.seatCategoryId),
    );
    if (!category) {
      return {
        error: `category ${item.seatCategoryId} is not in this session's subvenue`,
      };
    }
    if (used.has(category.id)) {
      return { error: `${category.categoryName} is added more than once` };
    }
    used.add(category.id);

    const price = Number(item.price);
    if (
      item.price === undefined ||
      item.price === null ||
      item.price === "" ||
      !(price >= 0)
    ) {
      return { error: `${category.categoryName}: a valid price is required` };
    }

    const sellAll =
      item.seatsForSale === undefined ||
      item.seatsForSale === null ||
      item.seatsForSale === "";
    const seatsForSale = sellAll
      ? category.seatCount
      : Number(item.seatsForSale);
    if (
      !Number.isInteger(seatsForSale) ||
      seatsForSale < 1 ||
      seatsForSale > category.seatCount
    ) {
      return {
        error: `${category.categoryName}: seatsForSale must be between 1 and ${category.seatCount}`,
      };
    }

    data.push({
      seatCategoryId: category.id,
      alias: String(item.alias ?? "").trim() || category.categoryName,
      price,
      seatsForSale,
    });
  }

  return { data };
};
