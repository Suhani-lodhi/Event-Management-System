import { StatusCodes } from "http-status-codes";
import { ServiceError } from "../utils/serviceError.js";

const bad = (msg) => new ServiceError(msg, StatusCodes.BAD_REQUEST);

export const buildSessionPricing = (items, categories) => {
  if (!Array.isArray(items)) throw bad("categories must be an array");

  const used = new Set();

  return items.map((item) => {
    const category = categories.find(
      (c) => String(c.id) === String(item.seatCategoryId),
    );
    if (!category) {
      throw bad(
        `category ${item.seatCategoryId} is not in this session's subvenue`,
      );
    }
    if (used.has(category.id)) {
      throw bad(`${category.categoryName} is added more than once`);
    }
    used.add(category.id);

    const price = Number(item.price);
    if (
      item.price === undefined ||
      item.price === null ||
      item.price === "" ||
      !(price >= 0)
    ) {
      throw bad(`${category.categoryName}: a valid price is required`);
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
      throw bad(
        `${category.categoryName}: seatsForSale must be between 1 and ${category.seatCount}`,
      );
    }

    return {
      seatCategoryId: category.id,
      alias: String(item.alias ?? "").trim() || category.categoryName,
      price,
      seatsForSale,
    };
  });
};
