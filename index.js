const express = require("express");

const app = express();
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("SuppMate Server läuft 🚀");
});

// PLAN EMPFANGEN
app.post("/plan", (req, res) => {
  const { name, time, count } = req.body;

  console.log("Neuer Plan:");
  console.log(name, time, count);

  // HIER später Alexa / Notification / IFTTT / etc.

  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server läuft auf Port 3000");
});