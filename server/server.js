
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Tailor Direct API is running"
  });
});

// Orders route
app.use("/api/orders", require("./routes/orders"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
