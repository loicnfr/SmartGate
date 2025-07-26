import express from "express";
import { dbConnection } from "./config/db.js";
import router from "./routes/route.js";
import cors from "cors";

const app = express();
const port = 8001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", router);

app.listen(port, () => {
  console.log(`The server is running on port http://localhost:${port}`);
  dbConnection();
});
