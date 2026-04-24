const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ================= CONFIG ================= */
const CLIENT_ID = "amzn1.application-oa2-client.c1953369790e40638f1ee22b5c16fd46";
const CLIENT_SECRET = "amzn1.oa2-cs.v1.f6998559b27fcce8f58afd541f02dec2b6049bd22d4d904c6b09c702b60a2b1f";
const REDIRECT_URI = "https://supliment-server.onrender.com/callback";

/* TEMP STORAGE (später DB wie MongoDB) */
let userTokens = {};

/* ================= LOGIN ================= */
app.get("/login", (req, res) => {
  const url =
    "https://www.amazon.com/ap/oa" +
    "?client_id=" + CLIENT_ID +
    "&scope=alexa::alerts:reminders:skill:readwrite" +
    "&response_type=code" +
    "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

  res.redirect(url);
});

/* ================= CALLBACK ================= */
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send("No code received");

  try {
    const response = await axios.post(
      "https://api.amazon.com/auth/o2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      })
    );

    userTokens["default"] = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
    };

    res.send("✅ Alexa erfolgreich verbunden! Du kannst zurück in die App.");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("❌ Login Fehler");
  }
});

/* ================= CREATE REMINDER ================= */
app.post("/createReminder", async (req, res) => {
  const { title, time } = req.body;

  const token = userTokens["default"]?.access_token;

  if (!token) {
    return res.status(401).json({ error: "Alexa nicht verbunden" });
  }

  try {
    // time = "12:30"
    const [h, m] = time.split(":");

    const now = new Date();
    now.setHours(Number(h));
    now.setMinutes(Number(m));
    now.setSeconds(0);

    const reminder = {
      requestTime: new Date().toISOString(),
      trigger: {
        type: "SCHEDULED_ABSOLUTE",
        scheduledTime: now.toISOString(),
        timeZoneId: "Europe/Berlin",
      },
      alertInfo: {
        spokenInfo: {
          content: [
            {
              locale: "de-DE",
              text: `Zeit für dein Supplement: ${title}`,
            },
          ],
        },
      },
      pushNotification: {
        status: "ENABLED",
      },
    };

    const response = await axios.post(
      "https://api.amazonalexa.com/v1/alerts/reminders",
      reminder,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, data: response.data });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Reminder failed" });
  }
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server läuft auf Port " + PORT);
});
