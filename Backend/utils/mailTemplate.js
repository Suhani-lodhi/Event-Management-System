export const welcomeEmail = (name, role) => ({
  subject: "Welcome to Event Manager",
  html: `<h2>Hi ${name},</h2><p>Your ${role} account has been created. You can now log in.</p>`,
});

export const otpVerificationTemplate = (otp) => ({
  subject: "Otp verification",
  html: `<h2>Your 6-digit Otp is ${otp}</h2>`,
});
