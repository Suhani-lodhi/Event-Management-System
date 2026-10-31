import prisma from "../index.js";
import { sendMail } from "./mailer.js";
import {
  bookingConfirmationTemplate,
  bookingCancellationTemplate,
} from "./mailTemplate.js";

// loads the booking with everything the email needs
const loadBookingForEmail = (bookingId) =>
  prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      session: {
        include: {
          event: true,
          subVenue: { include: { venue: true } },
        },
      },
    },
  });

// venue details used in both emails
const buildVenueInfo = (session) => {
  const { venue } = session.subVenue;
  return {
    venueName: venue.venueName,
    subVenueName: session.subVenue.subVenueName,
    address: [
      venue.addressLine1,
      venue.city,
      venue.state,
      venue.country,
      venue.pincode,
    ]
      .filter(Boolean)
      .join(", "),
  };
};

export const sendBookingEmail = async (result) => {
  const booking = await loadBookingForEmail(result.bookingId);
  if (!booking?.user?.email) return;

  const { session } = booking;

  const { subject, html } = bookingConfirmationTemplate({
    userName: `${booking.user.firstName} ${booking.user.lastName}`,
    bookingId: booking.id,
    eventName: session.event.Title,
    session,
    venue: buildVenueInfo(session),
    items: result.orderLines.map((l) => ({
      alias: l.alias,
      unitPrice: Number(l.unitPrice),
      quantity: l.quantity,
      subtotal: Number(l.subtotal),
    })),
    totalCount: result.totalCount,
    totalAmount: Number(result.totalAmount),
  });

  await sendMail({ to: booking.user.email, subject, html });
};

export const sendCancellationEmail = async (bookingId, result) => {
  const booking = await loadBookingForEmail(bookingId);
  if (!booking?.user?.email) return;

  const { session } = booking;

  const { subject, html } = bookingCancellationTemplate({
    userName: `${booking.user.firstName} ${booking.user.lastName}`,
    bookingId,
    eventName: session.event.Title,
    session,
    venue: buildVenueInfo(session),
    items: result.cancelledLines,
    cancelledCount: result.cancelledCount,
    refundAmount: result.refundAmount,
    bookingCancelled: result.bookingCancelled,
    remainingCount: result.remainingCount,
  });

  await sendMail({ to: booking.user.email, subject, html });
};
