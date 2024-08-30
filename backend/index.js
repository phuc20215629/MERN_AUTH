import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import router from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // to process JSON requests
app.use(cookieParser()); // parse incoming cookies
app.use("/api/auth", router);

app.listen(PORT, async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB: ", conn.connection.host);
  } catch (error) {
    console.log("Couldn't connect to MongoDB: ", error.message);
    process.exit(1);
  }
  console.log(`Server listening on port ${PORT}!`);
});
