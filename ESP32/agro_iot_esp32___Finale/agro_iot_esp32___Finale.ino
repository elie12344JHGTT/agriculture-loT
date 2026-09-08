#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ================= WIFI / MQTT =================
const char* WIFI_SSID     = "I.K.E";        // SSID du réseau WiFi
const char* WIFI_PASSWORD = "123456789"; // Mot de passe WiFi
const char* MQTT_HOST     = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT_ID = "esp32_agro_john_v2";
const char* TOPIC_ACTIONS = "agro-iot/actions";   // Laravel -> ESP32
const char* TOPIC_SENSORS = "agro-iot/sensors";   // ESP32 -> Laravel

// ================= BROCHES =================
const int LED_PIN            = 4;    // Éclairage (LED classique supposée -> HIGH = Allumé)
const int LED2_PIN           = 27;   // Ventilation (Relais -> LOW = Actif)
const int LED_IRRIGATION_PIN = 25;   // Voyant/Relais d'irrigation (Relais -> LOW = Actif)
const int POMPE_PIN          = 26;   // Pompe via relais (Relais -> LOW = Actif)
const int DHTPIN             = 14;
const int TRIG_PIN           = 18;   // HC-SR04 Trig
const int ECHO_PIN           = 19;   // HC-SR04 Echo
const int CO2_PIN            = 35;   // MQ-135 (analogique)

// ================= SEUILS D'ALERTE =================
const int SEUIL_CO2_ELEVE = 1000;    // Valeur analogique/PPM pour déclencher l'alerte CO2

#define DHTTYPE DHT11 
DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

// Timers et États
unsigned long dernierEnvoi = 0;
const unsigned long INTERVAL_MESURES_MS = 10000;

unsigned long dernierClignotement = 0;
const unsigned long INTERVAL_CLIGNOTEMENT = 500; // Vitesse de clignotement (500 ms)
bool etatClignotement = false;

// Variables d'état globales
bool alerteEauBasse = false;
bool alerteCo2Eleve = false;
bool etatManuelPompe = false;
bool etatManuelVentil = false;
bool etatManuelLumiere = false;

// ================= PILOTAGE ACTIONNEURS =================
// Routage uniquement par slug (nom logique) envoyé par Laravel :
//   irrigation / ventilation / light
// Les broches sont pilotées selon leur polarité propre (relais = actif LOW).

// Vérifie si la chaîne (déjà en minuscules) contient le mot-clé donné.
bool contientSlug(const char* texte, const char* mot) {
  if (texte == nullptr) return false;
  String t = String(texte);
  t.toLowerCase();
  return t.indexOf(mot) != -1;
}

void commander(const char* slug, bool actif) {
  bool estPompe     = contientSlug(slug, "pompe") || contientSlug(slug, "irrigation") || contientSlug(slug, "arrosage");
  bool estLumiere   = contientSlug(slug, "light") || contientSlug(slug, "lumin") || contientSlug(slug, "lampe") || contientSlug(slug, "eclairage");
  bool estVentilation = contientSlug(slug, "ventilat") || contientSlug(slug, "ventilo") || contientSlug(slug, "fan");

  if (estPompe) {
    etatManuelPompe = actif;
    // Les relais s'activent généralement à l'état LOW (0)
    digitalWrite(POMPE_PIN, actif ? LOW : HIGH);
    if (!alerteEauBasse) {
      digitalWrite(LED_IRRIGATION_PIN, actif ? LOW : HIGH);
    }
    Serial.printf(">>> IRRIGATION %s\n", actif ? "ACTIVEE" : "ARRETEE");
  }
  else if (estVentilation) {
    etatManuelVentil = actif;
    if (!alerteCo2Eleve) {
      digitalWrite(LED2_PIN, actif ? LOW : HIGH);
    }
    Serial.printf(">>> VENTILATION %s\n", actif ? "ACTIVEE" : "ARRETEE");
  }
  else if (estLumiere) {
    etatManuelLumiere = actif;
    // La LED classique s'allume avec HIGH (1)
    digitalWrite(LED_PIN, actif ? HIGH : LOW);
    Serial.printf(">>> ECLAIRAGE %s\n", actif ? "ALLUME" : "ETEINT");
  }
  else {
    Serial.printf(">>> Inconnu (nom=%s)\n", slug == nullptr ? "NULL" : slug);
  }
}

// ================= CALLBACK ORDRES =================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("ORDRE RECU: ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();

  StaticJsonDocument<200> doc;
  DeserializationError erreur = deserializeJson(doc, payload, length);
  if (erreur) {
    Serial.print("JSON invalide: ");
    Serial.println(erreur.c_str());
    return;
  }

  const char* slug = doc["actionneur"] | "";
  bool actif = strcmp(doc["state"] | "off", "on") == 0;
  // actionneur_id est disponible mais le routage se fait par slug.
  int id = doc["actionneur_id"] | -1;
  Serial.printf(">>> actionneur=%s id=%d state=%s\n", slug, id, actif ? "on" : "off");

  commander(slug, actif);
}

// ================= PUBLICATION MESURES & VERIFICATION ALERTES =================
void lireEtPublierMesures() {
  float temp = dht.readTemperature();
  if (isnan(temp)) temp = 0;
  
  float hum = dht.readHumidity();
  if (isnan(hum)) hum = 0;

  // --- CALCUL DU NIVEAU D'EAU ---
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distance = (duration * 0.034) / 2;

  int eauPct = 0;
  if (duration > 0 && distance < 400) {
    int distanceMaxVide = 20; 
    int distanceMinPlein = 2;
    eauPct = constrain(map(distance, distanceMaxVide, distanceMinPlein, 0, 100), 0, 100);
  } else {
    eauPct = 0;
  }

  int lum = analogRead(36);
  int co2 = analogRead(CO2_PIN);

  // --- EVALUATION DES ALERTES ---
  alerteEauBasse = (eauPct < 50);            // Moins de la moitié (50%)
  alerteCo2Eleve = (co2 > SEUIL_CO2_ELEVE);   // Seuil de CO2 dépassé

  // Remise de l'état fixe si plus d'alerte (Inversion LOW pour les relais)
  if (!alerteEauBasse) {
    digitalWrite(LED_IRRIGATION_PIN, etatManuelPompe ? LOW : HIGH);
  }
  if (!alerteCo2Eleve) {
    digitalWrite(LED2_PIN, etatManuelVentil ? LOW : HIGH);
  }

  // Publication JSON
  char payload[256];
  snprintf(payload, sizeof(payload),
    "{\"temperature\":%.1f,\"humidity\":%.1f,\"luminosite\":%d,\"eau\":%d,\"co2\":%d}",
    temp, hum, lum, eauPct, co2);

  bool ok = client.publish(TOPIC_SENSORS, payload);
  Serial.print("Mesures envoyees: ");
  Serial.println(payload);
  Serial.println(ok ? "-> PUBLIE" : "-> ECHEC MQTT");
}

void reconnect() {
  unsigned long debut = millis();
  const unsigned long TIMEOUT_MS = 15000;

  while (!client.connected()) {
    // Si le WiFi s'est déconnecté, on tente de le rétablir avant le MQTT.
    if (WiFi.status() != WL_CONNECTED) {
      Serial.print("WiFi perdu, reconnexion...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      unsigned long debutWifi = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - debutWifi < 10000) {
        delay(500);
        Serial.print(".");
      }
      Serial.println(WiFi.status() == WL_CONNECTED ? " OK" : " ECHEC");
    }

    Serial.print("Connexion MQTT...");
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("connecte !");
      client.subscribe(TOPIC_ACTIONS);
      return;
    } else {
      Serial.print("echec code=");
      Serial.println(client.state());
    }

    // Évite de bloquer indéfiniment si le broker est injoignable :
    // après TIMEOUT_MS, on renonce pour ce cycle (loop fera relancer).
    if (millis() - debut > TIMEOUT_MS) {
      Serial.println("Timeout MQTT, nouvelle tentative au prochain cycle.");
      return;
    }
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED_IRRIGATION_PIN, OUTPUT);
  pinMode(POMPE_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(36, INPUT);       // Capteur de luminosité (ADC1_CH0 / VP)
  pinMode(CO2_PIN, INPUT);  // MQ-135 (ADC)
  
  // États initiaux au démarrage (HIGH = Relais éteints / LOW = LED éteinte)
  digitalWrite(LED_PIN, LOW); 
  digitalWrite(LED2_PIN, HIGH); 
  digitalWrite(LED_IRRIGATION_PIN, HIGH);
  digitalWrite(POMPE_PIN, HIGH);

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

  // --- GESTION DU CLIGNOTEMENT NON-BLOQUANT (Adapté aux relais Active LOW) ---
  if (now - dernierClignotement >= INTERVAL_CLIGNOTEMENT) {
    dernierClignotement = now;
    etatClignotement = !etatClignotement;

    if (alerteEauBasse) {
      // Pour faire clignoter un relais : LOW active, HIGH désactive
      digitalWrite(LED_IRRIGATION_PIN, etatClignotement ? LOW : HIGH);
    }
    if (alerteCo2Eleve) {
      digitalWrite(LED2_PIN, etatClignotement ? LOW : HIGH);
    }
  }

  // --- LECTURE PERIODIQUE ---
  if (now - dernierEnvoi >= INTERVAL_MESURES_MS) {
    dernierEnvoi = now;
    lireEtPublierMesures();
  }
}