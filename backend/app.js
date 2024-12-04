const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const createMQTTManager = require("./mqtt");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const mqttManager = createMQTTManager().connect(process.env.MQTT_BROKER_URL);

app.use(bodyParser.json());
app.use(cors());

// GET endpoint for data retrieval
app.get("/api/data", (req, res) => {
    const { temperature, humidity } = mqttManager.getData();
    
    if (temperature && humidity) {
        return res.status(200).json({ temperature, humidity });
    } else {
        return res.status(500).json({ error: "Data not available yet" });
    }
});

// Dialogflow webhook endpoint
app.post("/api/dialogflow", (req, res) => {
    const { temperature, humidity } = mqttManager.getData();
    
    if (temperature && humidity) {
        return res.status(200).json({
            fulfillmentText: `The current temperature is ${temperature} degrees and humidity is ${humidity}%.`
        });
    } else {
        return res.status(200).json({
            fulfillmentText: "Sorry, sensor data is not available at the moment."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});