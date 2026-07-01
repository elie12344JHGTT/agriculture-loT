# Guide d'integration API - Frontend Agro IoT

Ce fichier sert de point de reference pour connecter le frontend au backend.
Chaque API indique ou elle sera utilisee dans le frontend, son role, et le format de donnees attendu.

## Configuration generale

Le frontend doit utiliser une URL backend unique, par exemple :

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

A prevoir dans `.env` :

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Toutes les requetes authentifiees devront envoyer le token recu a la connexion. Avec Laravel Sanctum/JWT, le frontend enverra :

```http
Authorization: Bearer <token>
```


## Note backend Laravel

Le backend sera developpe avec Laravel. Les routes ci-dessous peuvent etre placees dans `routes/api.php`.

Recommandation Laravel :
- utiliser Laravel Sanctum pour l'authentification API, ou JWT si l'equipe backend prefere;
- proteger les routes privees avec un middleware comme `auth:sanctum`;
- retourner uniquement du JSON;
- garder les noms de champs identiques a ceux indiques dans ce document pour faciliter le branchement frontend.

Exemple d'organisation Laravel possible :

```php
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/measurements/latest', [MeasurementController::class, 'latest']);
    Route::get('/measurements/chart', [MeasurementController::class, 'chart']);

    Route::post('/actuators/irrigation', [ActuatorController::class, 'irrigation']);
    Route::post('/actuators/ventilation', [ActuatorController::class, 'ventilation']);
    Route::post('/actuators/light', [ActuatorController::class, 'light']);

    Route::get('/alerts/active', [AlertController::class, 'active']);
    Route::get('/thresholds', [ThresholdController::class, 'index']);
    Route::put('/thresholds', [ThresholdController::class, 'update']);

    Route::get('/history/measurements', [HistoryController::class, 'measurements']);
    Route::get('/history/alerts', [HistoryController::class, 'alerts']);
    Route::get('/history/actions', [HistoryController::class, 'actions']);
    Route::get('/exports/history', [ExportController::class, 'history']);

    Route::apiResource('/users', UserController::class);
    Route::get('/access-logs', [AccessLogController::class, 'index']);
});
```

Format recommande pour les erreurs Laravel :

```json
{
  "message": "Erreur de validation",
  "errors": {
    "email": ["L'adresse email est obligatoire."]
  }
}
```

Le frontend pourra afficher `message` comme erreur principale.

## 1. Authentification

Fichier frontend concerne : `src/pages/LoginPage.jsx`

### Connexion utilisateur

`POST /auth/login`

Role : connecter un utilisateur et recuperer son role pour afficher le bon badge dans le header.

Body attendu :

```json
{
  "email": "admin@agroiot.cd",
  "password": "mot_de_passe"
}
```

Reponse attendue :

```json
{
  "token": "jwt_token",
  "user": {
    "id_user": "USR-001",
    "nom": "Nom utilisateur",
    "email": "admin@agroiot.cd",
    "role": "Admin",
    "status": "Actif"
  }
}
```

Utilisation frontend :
- stocker `token` pour les prochaines requetes;
- stocker `user` dans `currentUser`;
- afficher `user.role` dans `src/layout/Header.jsx`.

### Deconnexion utilisateur

`POST /auth/logout`

Role : enregistrer la deconnexion dans les logs backend.

Reponse attendue :

```json
{
  "success": true
}
```

Utilisation frontend :
- vider le token;
- remettre `currentUser` a `null`;
- retourner a la page de connexion.

## 2. Dashboard - mesures capteurs

Fichier frontend concerne : `src/pages/DashboardPage.jsx`

### Dernieres mesures

`GET /measurements/latest`

Role : alimenter les 6 cartes du dashboard.

Reponse attendue :

```json
{
  "temperature": { "value": 0, "unit": "C", "status": "--" },
  "air_humidity": { "value": 0, "unit": "%", "status": "--" },
  "soil_humidity": { "value": 0, "unit": "%", "status": "--" },
  "co2": { "value": 0, "unit": "ppm", "status": "--" },
  "light": { "value": 0, "unit": "lux", "status": "--" },
  "water_level": { "value": 0, "unit": "%", "status": "--" }
}
```

### Donnees du graphique

`GET /measurements/chart?type=temperature&period=day`

Role : alimenter le graphique Evolution des mesures.

Reponse attendue :

```json
{
  "labels": ["08:00", "09:00"],
  "series": [0, 0],
  "unit": "C"
}
```

## 3. Commandes manuelles actionneurs

Fichier frontend concerne : `src/pages/DashboardPage.jsx`

### Demarrer irrigation

`POST /actuators/irrigation`

Body attendu :

```json
{
  "command": "start",
  "source": "manual"
}
```

### Activer ventilation

`POST /actuators/ventilation`

Body attendu :

```json
{
  "command": "start",
  "source": "manual"
}
```

### Allumer eclairage

`POST /actuators/light`

Body attendu :

```json
{
  "command": "start",
  "source": "manual"
}
```

Reponse commune attendue :

```json
{
  "success": true,
  "id_action": "ACT-001",
  "status": "En attente"
}
```

Utilisation frontend :
- afficher un etat `En attente`, `Executee` ou `Echec`;
- ajouter la commande dans l'historique des actions via le backend.

## 4. Alertes et seuils

Fichier frontend concerne : `src/pages/AlertsPage.jsx`

### Liste des alertes actives

`GET /alerts/active`

Reponse attendue :

```json
[
  {
    "id_alerte": "ALT-001",
    "date_creation": "2026-06-26T10:00:00Z",
    "parcelle": "Serre principale",
    "type_alerte": "CO2",
    "message": "Concentration CO2 elevee",
    "niveau": "Moyen",
    "statut": "Ouverte",
    "action": "Ventilation recommandee"
  }
]
```

### Recuperer les seuils

`GET /thresholds`

Reponse attendue :

```json
[
  { "key": "soil_humidity_min", "label": "Humidite sol minimale", "value": 30, "unit": "%", "rule": "Declencher irrigation" }
]
```

### Modifier les seuils

`PUT /thresholds`

Body attendu :

```json
[
  { "key": "soil_humidity_min", "value": 30 }
]
```

## 5. Historique

Fichier frontend concerne : `src/pages/HistoryPage.jsx`

Le frontend contient deja une pagination de 7 lignes par tableau.
Le backend peut aussi paginer si le volume devient important.

### Historique des mesures

`GET /history/measurements?page=1&limit=7&type=CO2&date=2026-06-26`

Reponse attendue :

```json
{
  "rows": [
    {
      "id_mesure": "MES-001",
      "date_mesure": "2026-06-26T10:00:00Z",
      "parcelle": "Serre principale",
      "capteur": "SEN0159",
      "type_mesure": "CO2",
      "valeur": 0,
      "unite": "ppm"
    }
  ],
  "total": 1
}
```

### Historique des alertes

`GET /history/alerts?page=1&limit=7`

### Historique des actions

`GET /history/actions?page=1&limit=7`

### Export CSV

Option 1 : le frontend garde l'export CSV local avec les lignes recues.

Option 2 : le backend fournit un export complet :

`GET /exports/history?type=measurements&format=csv`

## 6. Administration - utilisateurs

Fichier frontend concerne : `src/pages/AdminPage.jsx`

### Liste des utilisateurs

`GET /users?page=1&limit=7&search=texte`

Reponse attendue :

```json
{
  "rows": [
    {
      "id_user": "USR-001",
      "nom": "Nom utilisateur",
      "email": "user@agroiot.cd",
      "role": "Agriculteur",
      "status": "Actif"
    }
  ],
  "total": 1
}
```

### Creer un utilisateur

`POST /users`

Body attendu :

```json
{
  "nom": "Nom utilisateur",
  "email": "user@agroiot.cd",
  "role": "Agriculteur",
  "status": "Invite",
  "password": "mot_de_passe_attribue_par_admin"
}
```

Important backend :
- le mot de passe ne doit jamais etre renvoye au frontend;
- le backend doit stocker seulement le hash du mot de passe.

### Modifier un utilisateur

`PUT /users/:id_user`

Body attendu :

```json
{
  "nom": "Nom utilisateur",
  "email": "user@agroiot.cd",
  "role": "Technicien",
  "status": "Actif",
  "password": "nouveau_mot_de_passe_optionnel"
}
```

### Supprimer un utilisateur

`DELETE /users/:id_user`

## 7. Administration - etat des acces

Fichier frontend concerne : `src/pages/AdminPage.jsx`

### Logs des acces

`GET /access-logs?page=1&limit=7&search=texte`

Reponse attendue :

```json
{
  "rows": [
    {
      "id_log": "LOG-001",
      "utilisateur": "Nom utilisateur",
      "heure_connexion": "2026-06-26T10:00:00Z",
      "heure_deconnexion": "2026-06-26T11:00:00Z",
      "commande": "Irrigation"
    }
  ],
  "total": 1
}
```

## 8. Roles attendus cote frontend

Les roles actuellement prevus dans l'interface :

```txt
Admin
Agriculteur
Technicien
```

Le backend doit renvoyer exactement ces valeurs ou fournir une table de correspondance.

Affichage frontend par role :

| Role | Pages visibles |
| --- | --- |
| Admin | Dashboard, Historique, Alertes, Administration |
| Agriculteur | Dashboard, Historique, Alertes |
| Technicien | Dashboard, Historique, Alertes |

Important : la page Administration est reservee au role `Admin`. Le backend doit aussi proteger les routes sensibles cote serveur, car le filtrage frontend sert seulement a l'affichage.

## 9. Etats vides a respecter

Quand le backend n'a pas encore de donnees, renvoyer des tableaux vides :

```json
[]
```

ou pour les endpoints pagines :

```json
{
  "rows": [],
  "total": 0
}
```

Le frontend affichera alors les messages :
- aucune mesure recue;
- aucune alerte recue;
- aucune commande recue;
- aucun utilisateur trouve;
- aucun acces trouve.


