export const refundLabel = (status) =>
  status === "PROCESSED"
    ? "Refunded"
    : status === "FAILED"
      ? "Failed"
      : "In progress";

export const refundStatusText = (status) => {
  if (status === "PROCESSED") return "Your refund has been processed.";
  if (status === "FAILED")
    return "We could not complete the refund automatically. Please contact support with your booking ID.";
  return "Your refund is in progress. It usually reaches your account in 5 to 7 working days.";
};
