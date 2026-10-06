import authenticate from "./Middleware/authentication.js";
import authorize from "./Middleware/authorization.js";
import express from "express";
import "dotenv/config.js";
import cors from "cors";
import authRouter from "./Routes/auth.js";
import eventRouter from "./Routes/event.js";
import sessionRouter from "./Routes/session.js";
import venueRouter from "./Routes/venues.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// app.use((err, req, res, next) => {

//   if (err.type === "entity.parse.failed") {
//     console.log("Bad JSON body received:", err.body);
//     console.log(
//       "First chars:",
//       [...err.body.slice(0, 8)].map((c) => c.charCodeAt(0)),
//     );
//   }
//   console.error(err);
//   return res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.statusCode ? err.message : "Internal server error",
//   });
// });
app.use("/auth", authRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), eventRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), sessionRouter);
app.use("/organizer", authenticate, authorize("ORGANIZER"), venueRouter);

app.listen(port, () => {
  console.log("app is listening on port", port);
});
