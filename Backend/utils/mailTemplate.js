export const welcomeEmail = (name, role) => ({
  subject: "Welcome to Event Manager",
  html: `<h2>Hi ${name},</h2><p>Your ${role} account has been created. You can now log in.</p>`,
});

export const otpVerificationTemplate = (otp) => ({
  subject: "Otp verification",
  html: `<h2>Your 6-digit Otp is ${otp}</h2>`,
});

// export const bookinConfirmationTemplate = (bookingId, userName  )
const money = (n) => `₹${Number(n).toFixed(2)}`;
const date = (d) =>
  new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const bookingConfirmationTemplate = ({
  userName,
  bookingId,
  eventName,
  session,
  venue,
  items,
  totalCount,
  totalAmount,
}) => {
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.alias}</td><td>${i.quantity}</td><td>${money(i.unitPrice)}</td><td>${money(i.subtotal)}</td></tr>`,
    )
    .join("");

  return {
    subject: `Booking confirmed – ${eventName} (#${bookingId})`,
    html: `
      <h2>Booking confirmed</h2>
      <p>Hi ${userName}, your booking is confirmed.</p>

      <p>
        <b>Booking ID:</b> #${bookingId}<br>
        <b>Event:</b> ${eventName}<br>
        <b>Starts:</b> ${date(session.startDateTime)}<br>
        <b>Ends:</b> ${date(session.endDateTime)}<br>
        <b>Venue:</b> ${venue.venueName}, ${venue.subVenueName}<br>
        <b>Address:</b> ${venue.address}
      </p>

      <table border="1" cellpadding="8" cellspacing="0">
        <tr><th>Category</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
        ${rows}
        <tr><td><b>Total</b></td><td><b>${totalCount}</b></td><td></td><td><b>${money(totalAmount)}</b></td></tr>
      </table>
    `,
  };
};
