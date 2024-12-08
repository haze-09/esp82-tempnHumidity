const api_url = "https://thankful-properly-meerkat.ngrok-free.app/api/data";
let currentLanguage = "en-IN";
let adviceData = {};

async function fetchData() {
  try {
    const response = await fetch(api_url, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = await response.json();
    adviceData = data.advice;
    document.querySelector("#tempSensor").innerText = data.temperature;
    document.querySelector("#tempSensor").dataset.loading = "false";
    document.querySelector("#humiditySensor").innerText = data.humidity;
    document.querySelector("#humiditySensor").dataset.loading = "false";
    document.querySelector("#statement").innerText =
      data.advice[currentLanguage].tempAdvice +
      " " +
      data.advice[currentLanguage].humidityAdvice;
    document.querySelector("#statement").dataset.loading = "false";

    console.log(data);
  } catch (error) {
    console.error("Fetch Error:", error);
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
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${currentLanguage === 'en-IN' ? 'en' : 'ja'}`;

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
  document.querySelector("#temp").innerText =
    currentLanguage === "en-IN" ? "Loading..." : "読み込み中...";
  document.querySelector("#humidity").innerText =
    currentLanguage === "en-IN" ? "Loading..." : "読み込み中...";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const data = await fetchWeatherData(latitude, longitude);
        const place = await getNominatimLocationName(latitude, longitude);
        console.log(data);
        document.querySelector("h1").innerText = place;
        document.querySelector("h1").dataset.loading = "false";
        document.querySelector("#temp").innerText = data.currentConditions.temp;
        document.querySelector("#temp").dataset.loading = "false";
        document.querySelector("#humidity").innerText =
          data.currentConditions.humidity;
        document.querySelector("#humidity").dataset.loading = "false";
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
setInterval(fetchData, 15000);

document
  .getElementById("languageToggle")
  .addEventListener("change", (event) => {
    document.querySelector("#statement").innerText =
      adviceData[currentLanguage === "en-IN" ? "ja-JP" : "en-IN"].tempAdvice +
      " " +
      adviceData[currentLanguage === "en-IN" ? "ja-JP" : "en-IN"]
        .humidityAdvice;

    currentLanguage = event.target.checked ? "ja-JP" : "en-IN";

    const translatableElements =
      document.querySelectorAll("[data-en][data-ja]");
    translatableElements.forEach((element) => {
      if (element.dataset.loading !== "false") {
        element.textContent = element.getAttribute(
          `data-${currentLanguage === "en-IN" ? "en" : "ja"}`
        );
      }
    });
  });
