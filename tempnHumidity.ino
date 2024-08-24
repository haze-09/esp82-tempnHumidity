#include <ESP8266WiFi.h>
#include "DHT.h"

// Replace with your network credentials
const char* ssid = "Airtel_kevi_2003";
const char* password = "air45373";

#define DPIN 4        // Pin to connect DHT sensor (GPIO number) D2
#define DTYPE DHT11   // Define DHT 11 or DHT22 sensor type

DHT dht(DPIN, DTYPE);

WiFiServer server(80);

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Start the server
  server.begin();
}

void loop() {
  WiFiClient client = server.available();   // Listen for incoming clients

  if (client) {
    Serial.println("New Client.");
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        if (c == '\n') {
          if (currentLine.length() == 0) {
            float tc = dht.readTemperature(false);
            float hu = dht.readHumidity();

            String json = "{\"temperature\":" + String(tc) + ", \"humidity\":" + String(hu) + "}";

            client.println("HTTP/1.1 200 OK");
            client.println("Content-Type: application/json");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Access-Control-Allow-Methods: GET");
            client.println("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
            client.println("Connection: close");
            client.println();
            client.println(json);
            
            Serial.println("Sent response: " + json);
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
    client.stop();
    Serial.println("Client Disconnected.");
  }
}
