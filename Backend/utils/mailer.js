import "dotenv/config"; 
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};
// import nodemailer from "nodemailer";

// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "itsnagpals@gmail.com",
//     pass: "jcaungorsrkmjnps",
//   },
// });

// export const sendMail = async ({ to, subject, text, html }) => {
//   return transporter.sendMail({
//     from: process.env.MAIL_FROM,
//     to,
//     subject,
//     text,
//     html,
//   });
// };

// try {
//   const info = await sendMail({
//     to: "ishpreet.singh@argusoft.com",
//     subject: "Test email",
//     text: "Plain text body",
//     html: "<h1>Hello</h1><p>HTML body</p>",
//   });

//   console.log("Sent:", info.messageId);

//   console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
// } catch (err) {
//   console.error("Failed:", err);
//   process.exit(1);
// }

