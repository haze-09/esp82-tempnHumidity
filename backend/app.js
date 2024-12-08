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

// Advice functions with multilingual support
function getTemperatureAdvice(temperature, language = 'en-IN') {
    const advices = {
        'en-IN': {
            hot: "The room is quite warm. Consider opening a window for ventilation or adjusting the air conditioning.",
            cold: "The room feels chilly. You might want to use a heater or add an extra layer of clothing.",
            comfortable: "Your house temperature is perfect. Enjoy your comfortable environment!",
            warmish: "The room is slightly warm. If you feel uncomfortable, consider light clothing or minimal cooling.",
            coolish: "The room is a bit cool. A light sweater might help you feel more comfortable."
        },
        'ja-JP': {
            hot: "部屋が暑すぎます。窓を開けて換気してください。エアコンの使用も検討してください。",
            cold: "部屋が寒いです。暖房を入れるか、厚めの服を着ることをお勧めします。",
            comfortable: "室温が快適です。快適な環境をお楽しみください！",
            warmish: "部屋がやや暑いです。不快に感じる場合は、軽い服装や軽い冷房を検討してください。",
            coolish: "部屋がやや涼しいです。軽いセーターが快適さを助けるかもしれません。"
        }
    };

    const messages = advices[language] || advices['en-IN'];

    if (temperature > 30) {
        return messages.hot;
    } else if (temperature < 15) {
        return messages.cold;
    } else if (temperature >= 20 && temperature <= 25) {
        return messages.comfortable;
    } else if (temperature > 25 && temperature <= 30) {
        return messages.warmish;
    } else if (temperature >= 15 && temperature < 20) {
        return messages.coolish;
    }
    return messages.comfortable; // Default to comfortable for any unexpected values
}

function getHumidityAdvice(humidity, language = 'en-IN') {
    const advices = {
        'en-IN': {
            high: "The humidity is quite high. Consider using a dehumidifier or improving ventilation to prevent moisture-related issues.",
            low: "The air is very dry. You might want to use a humidifier to add some moisture to the environment.",
            comfortable: "The humidity levels are just right. Your indoor environment is comfortable!",
            moderate_high: "The humidity is slightly high. Keep an eye on potential moisture accumulation.",
            moderate_low: "The humidity is a bit low. Stay hydrated and consider adding some moisture to the air."
        },
        'ja-JP': {
            high: "湿度が高いです。除湿器を使用するか、換気をしてください。カビに注意しましょう。",
            low: "空気が乾燥しています。加湿器の使用をお勧めします。",
            comfortable: "湿度が快適です。室内環境を楽しんでください！",
            moderate_high: "湿度がやや高いです。湿気の蓄積に注意してください。",
            moderate_low: "湿度がやや低いです。水分補給を心がけ、空気に湿気を加えることを検討してください。"
        }
    };

    const messages = advices[language] || advices['en-IN'];

    if (humidity > 70) {
        return messages.high;
    } else if (humidity < 30) {
        return messages.low;
    } else if (humidity >= 40 && humidity <= 60) {
        return messages.comfortable;
    } else if (humidity > 60 && humidity <= 70) {
        return messages.moderate_high;
    } else if (humidity >= 30 && humidity < 40) {
        return messages.moderate_low;
    }
    return messages.comfortable; // Default to comfortable for any unexpected values
}

// GET endpoint for data retrieval with multilingual advice
app.get("/api/data", (req, res) => {
    const { temperature, humidity } = mqttManager.getData();
    
    if (temperature && humidity) {
        return res.status(200).json({ 
            temperature, 
            humidity,
            advice: {
                'en-IN': {
                    tempAdvice: getTemperatureAdvice(temperature, 'en-IN'),
                    humidityAdvice: getHumidityAdvice(humidity, 'en-IN')
                },
                'ja-JP': {
                    tempAdvice: getTemperatureAdvice(temperature, 'ja-JP'),
                    humidityAdvice: getHumidityAdvice(humidity, 'ja-JP')
                }
            }
        });
    } else {
        return res.status(500).json({ 
            error: "Data not available yet",
            advice: {
                'en-IN': "No advice available due to missing sensor data.",
                'ja-JP': "センサーデータがないため、アドバイスを提供できません。"
            }
        });
    }
});

// Dialogflow webhook endpoint for English (India)
app.post("/api/dialogflow", (req, res) => {
    const { temperature, humidity } = mqttManager.getData();
    
    if (temperature && humidity) {
        const tempAdvice = getTemperatureAdvice(temperature, 'en-IN');
        const humidityAdvice = getHumidityAdvice(humidity, 'en-IN');
        
        return res.status(200).json({
            fulfillmentText: `The current temperature is ${temperature} degrees and humidity is ${humidity}%. ${tempAdvice} ${humidityAdvice}`.trim()
        });
    } else {
        return res.status(200).json({
            fulfillmentText: "Sorry, sensor data is not available at the moment."
        });
    }
});

// Dialogflow webhook endpoint for Japanese
app.post("/api/dialogflow/ja", (req, res) => {
    const { temperature, humidity } = mqttManager.getData();
    
    if (temperature && humidity) {
        const tempAdvice = getTemperatureAdvice(temperature, 'ja-JP');
        const humidityAdvice = getHumidityAdvice(humidity, 'ja-JP');
        
        return res.status(200).json({
            fulfillmentText: `現在の気温は${temperature}度、湿度は${humidity}%です。${tempAdvice} ${humidityAdvice}`.trim()
        });
    } else {
        return res.status(200).json({
            fulfillmentText: "申し訳ありません。センサーデータが現在利用できません。"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});