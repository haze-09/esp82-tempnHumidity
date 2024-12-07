
const api_url = "https://thankful-properly-meerkat.ngrok-free.app/api/data";

async function fetchData() {
  try {
    const response = await fetch(api_url, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    const data = await response.json();
    document.querySelector('#tempSensor').innerText = data.temperature;
    document.querySelector('#humiditySensor').innerText = data.temperature;
    document.querySelector('#statement').innerText = data.advice['en-IN'].tempAdvice + ' ' + data.advice['en-IN'].humidityAdvice;
    
    console.log(data);
  } catch (error) {
    console.error('Fetch Error:', error);
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
fetchData();
setInterval(fetchData, 5000);
