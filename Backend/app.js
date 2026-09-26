import express from "express";
import "dotenv/config.js";
import cors from "cors";
import authRouter from "./Routes/auth.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log("app is listening on port", port);
});
