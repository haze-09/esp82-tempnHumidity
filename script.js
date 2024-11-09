function generateStatement(
  tempSensor,
  humiditySensor,
  weatherTemp,
  weatherHumidity
) {
  let statementP = document.querySelector("#statement");
  let statement = "";

  if (!tempSensor || !humiditySensor || !weatherHumidity || !weatherTemp) {
    statement =
      "Please connect to NodeMCU-AP WIFI(password: password123) and connect the nodeMCU to WIFI";
  } else {
    if (tempSensor > weatherTemp + 2) {
      statement +=
        "The room is too hot, consider turning on the fan or air conditioning. ";
    } else if (tempSensor < weatherTemp - 2) {
      statement += "The room is too cold, consider turning on the heater. ";
    }

    if (humiditySensor > weatherHumidity + 10 || humiditySensor > 60) {
      statement +=
        "The room is too humid, consider using a dehumidifier or opening a window. ";
    } else if (humiditySensor < weatherHumidity - 10 || humiditySensor < 40) {
      statement += "The room is too dry, consider using a humidifier. ";
    }

    if (tempSensor > 28 && humiditySensor > 60) {
      statement +=
        "The room is too stuffy, open the window to improve airflow. ";
    }
    if (!statement) {
      statement = "The room temperature and humidity are comfortable.";
    }
  }

  statementP.innerText = statement;
}

async function fetchSensorData() {
  try {
    const NODEMCU_HOSTNAME = "http://nodemcu.local";
    console.log("Attempting to fetch data from:", NODEMCU_HOSTNAME);

    const response = await fetch(NODEMCU_HOSTNAME, {
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Received data:", data);
      document.querySelector("#tempSensor").innerText = data.temperature;
      document.querySelector("#humiditySensor").innerText = data.humidity;
      const weatherTemp = parseFloat(document.querySelector("#temp").innerText);
      const weatherHumidity = parseFloat(
        document.querySelector("#humidity").innerText
      );

      generateStatement(
        parseFloat(data.temperature),
        parseFloat(data.humidity),
        weatherTemp,
        weatherHumidity
      );
    } else {
      console.error(
        "Error fetching data:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    document.querySelector("#tempSensor").innerText = "Loading...";
    document.querySelector("#humiditySensor").innerText = "Loading...";
    document.querySelector("#statement").innerText =
      "Please connect to NodeMCU-AP WIFI(password: password123) and connect the nodeMCU to WIFI";
    console.error("Fetch error:", error);
  }
}

async function fetchWeatherData(latitude, longitude) {
  try {
    let response = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}?unitGroup=metric&key=D6FJHHE29KMGZ47KUBVCVUJ9J&contentType=json`
    );
    if (!response.ok) {
      domBuilder.error();
      throw new Error(`Place: ${location} not found`);
    }
    let weatherData = await response.json();
    return weatherData;
  } catch (err) {
    console.error(err.message);
  }
}

async function getNominatimLocationName(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log("Location data:", data);
      let place = data.address;
      return place.residential + ", " + place.county;
    } else {
      console.error(
        "Error fetching location data:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function setWeatherinDOM() {
  document.querySelector("#temp").innerText = "Loading...";
  document.querySelector("#humidity").innerText = "Loading...";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const data = await fetchWeatherData(latitude, longitude);
        const place = await getNominatimLocationName(latitude, longitude);
        console.log(data);
        document.querySelector("h1").innerText = place;
        document.querySelector("#temp").innerText = data.currentConditions.temp;
        document.querySelector("#humidity").innerText =
          data.currentConditions.humidity;
        const sensorTemp = parseFloat(
          document.querySelector("#tempSensor").innerText
        );
        const sensorHumidity = parseFloat(
          document.querySelector("#humiditySensor").innerText
        );

        generateStatement(
          sensorTemp,
          sensorHumidity,
          data.currentConditions.temp,
          data.currentConditions.humidity
        );
      },
      (error) => {
        console.error("Error obtaining location:", error);
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

setWeatherinDOM();
setInterval(fetchSensorData, 2000);
fetchSensorData();
