import authenticate from "./Middleware/authentication.js";
import authorize from "./Middleware/authorization.js";
import express from "express";
import "dotenv/config.js";
import cors from "cors";

//Routers
import authRouter from "./Routes/auth.js";
import eventRouter from "./Routes/event.js";
import sessionRouter from "./Routes/session.js";
import venueRouter from "./Routes/venues.js";
import profileRouter from "./Routes/profile.js";
import userEventRouter from "./Routes/User_Routes/event.js";
import userEventBookingRouter from "./Routes/User_Routes/eventBooking.js"
import categoryRouter from "./Routes/seatCategory.js";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/profile", profileRouter);
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), eventRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), sessionRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), venueRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), categoryRouter);

app.use("/user", authenticate, authorize("USER"), userEventRouter);
app.use("/user", authenticate, authorize("USER"), userEventBookingRouter)

app.listen(port, () => {
  console.log("app is listening on port", port);
});
