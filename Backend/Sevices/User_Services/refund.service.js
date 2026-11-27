import prisma from "../../index.js";
import { razorpay } from "../../utils/razorpay.js";

// Cancellation.status in the database: PENDING | REFUND | FAILED
// What we show to the user:            PENDING | PROCESSED | FAILED
export const publicRefundStatus = (dbStatus) =>
  dbStatus === "REFUND" ? "PROCESSED" : dbStatus;

// Used when a booking has no online payment (for example, bookings made before Razorpay)
export const NO_PAYMENT_MSG = "No online payment found. Refund manually.";

const toPaise = (decimal) => Math.round(Number(decimal) * 100);
const errText = (e) =>
  String(e?.error?.description || e?.message || e).slice(0, 500);

// Looks for a refund we already created for this cancellation.
// This protects against refunding twice if a request timed out after Razorpay accepted it.
const findExistingRefund = async (paymentId, cancellationId) => {
  const list = await razorpay.payments.fetchMultipleRefund(paymentId, {
    count: 100,
  });
  return (
    (list?.items || []).find(
      (r) => r?.notes?.cancellationId === cancellationId,
    ) || null
  );
};

// Sends the refund request to Razorpay and saves the refund id (rfnd_...) on the Cancellation row.
// It never throws, so a Razorpay problem cannot break the cancellation that already happened.
export const initiateRefund = async (cancellationId) => {
  const c = await prisma.cancellation.findUnique({
    where: { id: cancellationId },
  });
  if (!c) return { refundRef: null, status: "FAILED" };

  // already created or finished: nothing to do (the webhook finishes pending ones)
  if (c.refundRef) {
    return { refundRef: c.refundRef, status: publicRefundStatus(c.status) };
  }

  const payment = await prisma.paymentOrder.findFirst({
    where: { bookingId: c.bookingId, status: "PAID" },
    select: { paymentId: true },
  });

  if (!payment?.paymentId) {
    await prisma.cancellation.update({
      where: { id: cancellationId },
      data: { status: "PENDING", refundError: NO_PAYMENT_MSG },
    });
    return { refundRef: null, status: "PENDING" };
  }

  try {
    const rp =
      (await findExistingRefund(payment.paymentId, cancellationId)) ||
      (await razorpay.payments.refund(payment.paymentId, {
        amount: toPaise(c.refundAmount), // paise
        speed: "normal",
        receipt: cancellationId,
        notes: { cancellationId, bookingId: c.bookingId },
      }));

    // Razorpay says "processed" when the refund is done and "pending" while it is in progress
    const processed = rp.status === "processed";

    await prisma.cancellation.update({
      where: { id: cancellationId },
      data: {
        refundRef: rp.id,
        status: processed ? "REFUND" : "PENDING",
        refundedAt: processed ? new Date() : null,
        refundError: null,
      },
    });

    return {
      refundRef: rp.id,
      status: processed ? "PROCESSED" : "PENDING",
    };
  } catch (e) {
    console.error("REFUND FAILED:", cancellationId, e?.error || e);
    await prisma.cancellation.update({
      where: { id: cancellationId },
      data: { status: "FAILED", refundError: errText(e) },
    });
    return { refundRef: null, status: "FAILED" };
  }
};

// Called by the Razorpay webhook for refund.processed and refund.failed
export const handleRefundWebhook = async (eventName, refund) => {
  if (!refund?.id) return;

  const cancellationId = refund.notes?.cancellationId;
  const where = {
    OR: [
      { refundRef: refund.id },
      ...(cancellationId ? [{ id: cancellationId }] : []),
    ],
  };

  if (eventName === "refund.processed") {
    await prisma.cancellation.updateMany({
      where,
      data: {
        status: "REFUND",
        refundRef: refund.id,
        refundedAt: new Date(),
        refundError: null,
      },
    });
  }

  if (eventName === "refund.failed") {
    await prisma.cancellation.updateMany({
      where,
      data: {
        status: "FAILED",
        refundRef: refund.id,
        refundError:
          "Razorpay could not complete this refund. Refund manually.",
      },
    });
  }
};

// Retries refunds where the Razorpay call itself failed (no refund id was ever created).
// Call this from your cron job or an admin-only route.
export const retryPendingRefunds = async () => {
  const rows = await prisma.cancellation.findMany({
    where: {
      refundRef: null,
      status: { in: ["PENDING", "FAILED"] },
      OR: [{ refundError: null }, { refundError: { not: NO_PAYMENT_MSG } }],
    },
    select: { id: true },
    take: 50,
  });

  for (const r of rows) await initiateRefund(r.id);
  return rows.length;
};
