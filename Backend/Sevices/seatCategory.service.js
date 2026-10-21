export const validateCategory = ({ categoryName, seatCount }) => {
  if (!categoryName || !String(categoryName).trim()) {
    return "categoryName is required";
  }
  const count = Number(seatCount);
  if (!Number.isInteger(count) || count < 1) {
    return "seatCount must be a whole number, 1 or more";
  }
  return null;
};

                     
export const validateCategoryForUpdate = ({ categoryName, seatCount } = {}) => {
  if (categoryName !== undefined && !String(categoryName).trim()) {
    return "categoryName cannot be empty";
  }
  if (seatCount !== undefined) {
    const count = Number(seatCount);
    if (!Number.isInteger(count) || count < 1) {
      return "seatCount must be a whole number, 1 or more";
    }
  }
  return null;
};