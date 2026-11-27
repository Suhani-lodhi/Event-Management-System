import { verifyWebhookSignature } from "../../utils/razorpay.js";
import { confirmPayment } from "../../Sevices/User_Services/booking.service.js";
import { handleRefundWebhook } from "../../Sevices/User_Services/refund.service.js";

export const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature) return res.status(400).json({ message: "No signature" });
  if (!Buffer.isBuffer(req.body))
    return res.status(400).json({ message: "Invalid body" });
  if (!verifyWebhookSignature(req.body, signature)) {
    // req.body is a raw Buffer here
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    try {
      await confirmPayment(payment.order_id, payment.id);
    } catch (err) {
      console.error("webhook booking failed:", err);
    }
  }

  // Razorpay tells us when a refund finishes or fails
  if (event.event === "refund.processed" || event.event === "refund.failed") {
    try {
      await handleRefundWebhook(event.event, event.payload.refund.entity);
    } catch (err) {
      console.error("webhook refund update failed:", err);
    }
  }

  res.status(200).send("ok"); // always 200, or Razorpay keeps retrying
};
