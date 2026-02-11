

import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
import paymentRoutes from "./routes/payment.route.js";

const app = express()
// Bacis COnfigurations
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //it parse the form data into a JSON object
app.use(express.static("public"));
app.use(cookieParser());

//CORS configurations
app.use(
  cors({
    origin: process.env.CROS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true, //Send or recieve Credentials from the req or res
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// Routes

app.use("/api/payments", paymentRoutes);



app.get("/", (req, res) => {
  res.send("This is my first Project");
});
export default app;