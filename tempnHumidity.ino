#include <ESP8266WiFi.h>
#include <WiFiManager.h>  // WiFiManager for managing Wi-Fi credentials
#include <ESP8266mDNS.h>  // mDNS for local network discovery
#include "DHT.h"

#define DPIN 4        // Pin to connect DHT sensor (GPIO number) D2
#define DTYPE DHT11   // Define DHT 11 or DHT22 sensor type

DHT dht(DPIN, DTYPE);
WiFiServer server(80);

void setup() {
  Serial.begin(9600);
  dht.begin();

  // Initialize WiFiManager
  WiFiManager wifiManager;
  
  // Uncomment to reset settings (useful for testing)
  // wifiManager.resetSettings();

  // Start WiFiManager and wait for user to input Wi-Fi credentials if none are saved
  if (!wifiManager.autoConnect("NodeMCU-AP", "password123")) {
    Serial.println("Failed to connect and hit timeout.");
    ESP.restart();  // Restart and try again
  }

  Serial.println("WiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Start mDNS responder for local network discovery
  if (MDNS.begin("nodemcu")) {  // Replace "nodemcu" with your desired hostname
    Serial.println("mDNS responder started. You can access the device at http://nodemcu.local");
  } else {
    Serial.println("Error setting up mDNS responder.");
  }

  // Start the HTTP server
  server.begin();
}

void loop() {
  // Handle mDNS requests
  MDNS.update();

  WiFiClient client = server.available();  // Listen for incoming clients

  if (client) {
    Serial.println("New Client.");
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        if (c == '\n') {
          // If a newline is found and it's an empty line, send a response
          if (currentLine.length() == 0) {
            float tc = dht.readTemperature(false);  // Read temperature in Celsius
            float hu = dht.readHumidity();          // Read humidity

            String json = "{\"temperature\":" + String(tc) + ", \"humidity\":" + String(hu) + "}";

            // Send HTTP response
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
    // Close the connection
    client.stop();
    Serial.println("Client Disconnected.");
  }
}
