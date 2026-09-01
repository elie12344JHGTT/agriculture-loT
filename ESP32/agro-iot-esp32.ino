#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ================= WIFI / MQTT =================
// Remplace par tes identifiants locaux (non versionnés).
const char* WIFI_SSID     = "TonSSID";
const char* WIFI_PASSWORD = "TonMotDePasse";
const char* MQTT_HOST     = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT_ID = "esp32_agro_john_v2";
const char* TOPIC_ACTIONS = "agro-iot/actions";   // Laravel -> ESP32
const char* TOPIC_SENSORS = "agro-iot/sensors";   // ESP32 -> Laravel

// ================= BROCHES =================
const int LED_PIN    = 4;   // éclairage
const int LED2_PIN   = 27;
const int POMPE_PIN  = 26;  // via relais
const int DHTPIN     = 14;
const int SOL_PIN    = 34;  // humidité sol (ADC1_CH6)
const int CO2_PIN    = 35;  // MQ-135   (ADC1_CH7)
// AJOUTE tes capteurs sur l'ADC1 uniquement (32-39) pour rester stable
// avec le WiFi actif. Ton capteur de luminosité est sur GPIO 36 (ADC1_CH0).

// Mettez DHT11 si votre capteur est bleu/blanc standard, ou gardez DHT22
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long dernierEnvoi = 0;
const unsigned long INTERVAL_MESURES_MS = 10000;

// ================= PILOTAGE ACTIONNEURS =================
void commander(String nom, int id, bool actif) {
  nom.toLowerCase();
  bool estPompe = nom.indexOf("pompe") != -1 || nom.indexOf("irrigation") != -1;
  bool estLumiere = nom.indexOf("light") != -1 || nom.indexOf("lumin") != -1
    || nom.indexOf("lampe") != -1 || nom.indexOf("eclairage") != -1;

  if (estPompe) {
    digitalWrite(POMPE_PIN, actif ? HIGH : LOW);
    Serial.printf(">>> POMPE %s\n", actif ? "ACTIVEE" : "ARRETEE");
  } else if (estLumiere || id == 5 || id == 6) {
    digitalWrite(LED_PIN, actif ? HIGH : LOW);
    digitalWrite(LED2_PIN, actif ? HIGH : LOW);
    Serial.printf(">>> LED %s\n", actif ? "ALLUMEE" : "ETEINTE");
  } else {
    Serial.printf(">>> Inconnu (nom=%s, id=%d)\n", nom.c_str(), id);
  }
}

// ================= CALLBACK ORDRES =================
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.print("ORDRE RECU: ");
  Serial.println(message);

  String nom;
  int i = message.indexOf("\"actionneur\":\"");
  if (i != -1) nom = message.substring(i + 14, message.indexOf("\"", i + 14));

  int id = -1;
  i = message.indexOf("\"actionneur_id\":");
  if (i != -1) id = message.substring(i + 15).toInt();

  bool actif = message.indexOf("\"state\":\"on\"") != -1;
  commander(nom, id, actif);
}

// ================= PUBLICATION MESURES =================
void lireEtPublierMesures() {
  float temp = dht.readTemperature();
  if (isnan(temp)) temp = 0;

  float hum = dht.readHumidity(); // Lecture de l'humidité de l'air
  if (isnan(hum)) hum = 0;

  // Humidité sol -> "eau" (niveau d'eau pour irrigation)
  int brutSol = analogRead(SOL_PIN);
  int eauPct = constrain(map(brutSol, 1200, 2900, 100, 0), 0, 100);

  // Luminosité (capteur branché sur GPIO 36 ADC1_CH0)
  int lum = analogRead(36);

  // CO2 : brut MQ-135
  int co2 = analogRead(CO2_PIN);

  // JSON contenant toutes les métriques
  char payload[256];
  snprintf(payload, sizeof(payload),
    "{\"temperature\":%.1f,\"humidity\":%.1f,\"luminosite\":%d,\"eau\":%d,\"co2\":%d}",
    temp, hum, lum, eauPct, co2);

  bool ok = client.publish(TOPIC_SENSORS, payload);
  Serial.print("Mesures envoyees: ");
  Serial.println(payload);
  Serial.println(ok ? "-> PUBLIE (confirme par le broker)" : "-> ECHEC: pas de connexion MQTT");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("connecte !");
      client.subscribe(TOPIC_ACTIONS);
    } else {
      Serial.print("echec code=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(POMPE_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); digitalWrite(LED2_PIN, LOW); digitalWrite(POMPE_PIN, LOW);

  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi...");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());

  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(callback);
  client.setBufferSize(512);
  reconnect();
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - dernierEnvoi >= INTERVAL_MESURES_MS) {
    dernierEnvoi = now;
    lireEtPublierMesures();
  }
}