#include <ESP8266WiFi.h>
#include <WiFiManager.h>  
#include <ESP8266mDNS.h>  
#include "DHT.h"

#define DPIN 4        
#define DTYPE DHT11   

DHT dht(DPIN, DTYPE);
WiFiServer server(80);

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  WiFiManager wifiManager; 

  
  if (!wifiManager.autoConnect("NodeMCU-AP", "password123")) {
    Serial.println("Failed to connect and hit timeout.");
    ESP.restart();  
  }

  Serial.println("WiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  
  if (MDNS.begin("nodemcu")) {  
    Serial.println("mDNS responder started. You can access the device at http://nodemcu.local");
  } else {
    Serial.println("Error setting up mDNS responder.");
  }
  server.begin();
}

void loop() {
  
  MDNS.update();

  WiFiClient client = server.available();  

  if (client) {
    Serial.println("New Client.");
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        if (c == '\n') {
          /
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
