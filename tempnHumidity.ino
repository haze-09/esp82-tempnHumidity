#include <ESP8266WiFi.h>
#include <WiFiManager.h>         
#include <PubSubClient.h>        
#include <DHT.h>                 


#define DHTPIN 4          
#define DHTTYPE DHT11     
DHT dht(DHTPIN, DHTTYPE);


IPAddress local_IP(192, 168, 1, 13);     
IPAddress gateway(192, 168, 1, 1);        
IPAddress subnet(255, 255, 255, 0);       
IPAddress primaryDNS(8, 8, 8, 8);         
IPAddress secondaryDNS(8, 8, 4, 4);       


const char* mqttServer = "192.168.1.9";  
const int mqttPort = 1883;
const char* temperatureTopic = "home/temperature";
const char* humidityTopic = "home/humidity";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);


  dht.begin();

  WiFiManager wifiManager;


  if (!wifiManager.autoConnect("NodeMCU-AP", "password123")) {
    Serial.println("Failed to connect via Wi-Fi Manager. Trying static IP...");
    if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
      Serial.println("Static IP configuration failed!");
    }
    WiFi.begin();  
    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.print(".");
    }
  }

  Serial.println("\nWi-Fi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize MQTT
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);


  connectToMQTT();
}

void loop() {

  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();


  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    char tempStr[8];
    char humidityStr[8];
    dtostrf(temperature, 1, 2, tempStr);
    dtostrf(humidity, 1, 2, humidityStr);

    client.publish(temperatureTopic, tempStr);
    client.publish(humidityTopic, humidityStr);

    Serial.println("Published data:");
    Serial.print("Temperature: ");
    Serial.println(tempStr);
    Serial.print("Humidity: ");
    Serial.println(humidityStr);
  }

  delay(5000);  
}

void connectToMQTT() {
  while (!client.connected()) {
    Serial.println("Attempting MQTT connection...");
    String clientId = "ESP8266-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("Connected to MQTT broker!");
    } else {
      Serial.print("Failed to connect, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic ");
  Serial.print(topic);
  Serial.print(": ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}
