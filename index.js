const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

/**
 * 🔥 HIER kommt später der Alexa OAuth Token vom User rein
 * (für Demo erstmal hardcoded)
 */
let alexaAccessToken = "USER_ACCESS_TOKEN_HERE";

/**
 * CREATE REMINDER
 */
app.post("/createReminder", async (req, res) => {
  try {
    const { title, time, count } = req.body;

    // Alexa API Format (Reminder)
    const reminder = {
      requestTime: new Date().toISOString(),
      trigger: {
        type: "SCHEDULED_ABSOLUTE",
        scheduledTime: `2026-01-01T${time}:00.000`,
        timeZoneId: "Europe/Berlin"
      },
      alertInfo: {
        spokenInfo: {
          content: [
            {
              locale: "de-DE",
              text: `${count}x ${title} nehmen`
            }
          ]
        }
      },
      pushNotification: { status: "ENABLED" }
    };

    const response = await axios.post(
      "https://api.amazonalexa.com/v1/alerts/reminders",
      reminder,
      {
        headers: {
          Authorization: `Bearer ${alexaAccessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true, alexa: response.data });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Alexa request failed" });
  }
});

app.listen(3000, () => console.log("Server running"));
