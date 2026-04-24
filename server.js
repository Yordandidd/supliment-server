const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ================= CONFIG ================= */
const CLIENT_ID = "suppmate-alexa-client";
const CLIENT_SECRET = "xg8356234nfds";
const REDIRECT_URI = "https://supliment-server.onrender.com/callback";

/* simple storage (später DB) */
let userTokens = {};

/* ================= OAUTH LOGIN URL ================= */
app.get("/login", (req, res) => {
  const url =
    `https://www.amazon.com/ap/oa?client_id=${CLIENT_ID}` +
    `&scope=alexa::alerts:reminders:skill:readwrite` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(url);
});

/* ================= CALLBACK ================= */
app.get("/callback", async (req, res) => {
  const code = req.query.code;

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

    const data = response.data;

    userTokens["default"] = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };

    res.send("Alexa verbunden ✅ Du kannst jetzt zurück in die App");
  } catch (e) {
    res.send("Fehler bei Login ❌");
  }
});

/* ================= CREATE REMINDER ================= */
app.post("/createReminder", async (req, res) => {
  const { title, time } = req.body;

  const token = userTokens["default"]?.access_token;

  if (!token) {
    return res.status(401).send("Alexa nicht verbunden");
  }

  try {
    const reminder = {
      requestTime: new Date().toISOString(),
      trigger: {
        type: "SCHEDULED_ABSOLUTE",
        scheduledTime: `2026-04-24T${time}:00.000`,
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
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(3000, () => console.log("Server läuft"));
