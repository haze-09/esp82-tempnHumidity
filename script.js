const NODEMCU_IP = 'http://192.168.1.7';

async function fetchSensorData() {
  try {
    console.log('Attempting to fetch data from:', NODEMCU_IP);
    const response = await fetch(NODEMCU_IP, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log('Received data:', data);
        document.getElementById('temperature').innerText = data.temperature;
        document.getElementById('humidity').innerText = data.humidity;
      } else {
        console.error('Received non-JSON response');
        const text = await response.text();
        console.log('Response text:', text);
      }
    } else {
      console.error('Error fetching data:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

setInterval(fetchSensorData, 2000);

fetchSensorData();