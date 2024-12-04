const mqtt = require("mqtt");
require("dotenv").config();

function createMQTTManager() {
    let temperature = null;
    let humidity = null;
    let client = null;

    function connect(brokerUrl) {
        client = mqtt.connect(brokerUrl);

        client.on("connect", () => {
            console.log("Connected to MQTT broker");
            
            client.subscribe("home/temperature", (err) => {
                if (err) console.error("Failed to subscribe to temperature topic:", err);
            });
            
            client.subscribe("home/humidity", (err) => {
                if (err) console.error("Failed to subscribe to humidity topic:", err);
            });
        });

        client.on("message", (topic, message) => {
            if (topic === "home/temperature") {
                temperature = message.toString();
            } else if (topic === "home/humidity") {
                humidity = message.toString();
            }
        });

        return {
            getData: () => ({ temperature, humidity }),
            disconnect: () => client.end()
        };
    }

    return {
        connect
    };
}

module.exports = createMQTTManager;