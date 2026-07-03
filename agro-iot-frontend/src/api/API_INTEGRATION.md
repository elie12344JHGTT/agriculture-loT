# Integration API - Agro IoT

Ce fichier explique les routes Laravel actuellement utilisees par le frontend React et le role de chaque API.
Il sert de reference pour le developpeur backend afin de maintenir les routes, les champs JSON et les tables attendues.

## Configuration frontend

Le frontend utilise l'instance Axios definie dans :

```txt
agro-iot-frontend/src/api/axios.js
```

Base URL actuellement utilisee par defaut :

```txt
https://agro-iot-backend.onrender.com
```

Cette valeur peut etre surchargee avec `VITE_API_URL` dans un fichier `.env`. Les appels frontend utilisent ensuite le prefixe `/api`, par exemple :

```js
api.get("/api/measurements/latest")
```

## Authentification et session frontend

### POST `/api/auth/login`

Utilise par : `src/pages/LoginPage.jsx`

Role :
- verifier email + mot de passe dans Laravel ;
- refuser les comptes non actifs ;
- renvoyer l'utilisateur connecte avec son role ;
- creer une session d'audit pour tracer les actions de cette connexion.

Body envoye :

```json
{
  "email": "admin@agroiot.cd",
  "password": "mot_de_passe"
}
```

Reponse attendue :

```json
{
  "user": {
    "id": 1,
    "id_user": "USR-001",
    "name": "elie",
    "nom": "elie",
    "email": "admin@agroiot.cd",
    "role": "Admin",
    "status": "Actif",
    "audit_session_id": "SES-20260702123000-1-a1b2c3"
  }
}
```

Important :
- `audit_session_id` est garde par le frontend et renvoye dans les logs d'audit ;
- l'utilisateur connecte est conserve dans `localStorage` avec la page active ;
- recharger la page ne doit pas etre considere comme une deconnexion ;
- seule l'action explicite sur le bouton Deconnexion appelle `/api/auth/logout`.

### POST `/api/auth/logout`

Utilise par : `src/App.jsx`

Role :
- enregistrer une vraie deconnexion dans l'audit ;
- ne doit etre appele que lorsque l'utilisateur clique sur Deconnexion.

Body envoye :

```json
{
  "session_id": "SES-20260702123000-1-a1b2c3",
  "user_id": 1,
  "user_name": "elie",
  "user_email": "admin@agroiot.cd",
  "user_role": "Admin"
}
```

Reponse :

```json
{
  "success": true
}
```

## Journal d'audit

### Table Laravel `audit_logs`

Migrations ajoutees :

```txt
agro-iot-backend/database/migrations/2026_07_02_112500_create_audit_logs_table.php
agro-iot-backend/database/migrations/2026_07_02_113500_add_session_id_to_audit_logs_table.php
```

Champs principaux :

| Champ | Role |
| --- | --- |
| `session_id` | identifiant d'une session de connexion |
| `user_id` | id utilisateur Laravel, nullable pour tentative echouee |
| `user_name` | nom affiche dans l'audit |
| `user_email` | email utilisateur ou email tente au login |
| `user_role` | role au moment de l'action |
| `page` | page concernee : Login, Dashboard, Alertes, etc. |
| `action` | action realisee |
| `details` | phrase explicative |
| `status` | `success` ou `failed` |
| `ip_address` | adresse IP de la requete |
| `occurred_at` | date/heure de l'action |

### POST `/api/audit-logs`

Utilise par : `src/api/audit.js`

Role : enregistrer toute action utilisateur depuis le frontend :
- consultation de page ;
- export CSV ;
- controle actionneur ;
- modification des seuils ;
- resolution d'alerte ;
- creation, modification, suppression utilisateur ;
- tentative de connexion echouee cote login est aussi enregistree directement par Laravel.

Body envoye :

```json
{
  "session_id": "SES-20260702123000-1-a1b2c3",
  "user_id": 1,
  "user_name": "elie",
  "user_email": "admin@agroiot.cd",
  "user_role": "Admin",
  "page": "Dashboard",
  "action": "Consultation page Dashboard",
  "details": "Ouverture de la page Dashboard",
  "status": "success"
}
```

Reponse :

```json
{
  "success": true,
  "id_log": "AUD-001"
}
```

### GET `/api/access-logs?limit=500&search=texte`

Utilise par : `src/pages/AdminPage.jsx`, onglet `Etat des acces`.

Role : renvoyer les lignes d'audit au frontend.
Le frontend regroupe ensuite l'affichage par utilisateur + journee pour eviter de repeter plusieurs fois le meme utilisateur.
Le bouton `Voir detail` ouvre la timeline complete des actions de cette journee.

Format attendu :

```json
{
  "rows": [
    {
      "id_log": "AUD-001",
      "session_id": "SES-20260702123000-1-a1b2c3",
      "utilisateur": "elie",
      "user_role": "Admin",
      "heure_connexion": "2026-07-02 12:30",
      "heure_deconnexion": "--",
      "page": "Dashboard",
      "commande": "Consultation page Dashboard",
      "commande_type": "action",
      "details": "Ouverture de la page Dashboard",
      "statut": "success"
    }
  ],
  "total": 1
}
```

Valeurs de `commande_type` :

```txt
login
logout
action
failed
```

## Dashboard

### GET `/api/measurements/latest`

Utilise par : `src/pages/DashboardPage.jsx`

Role : alimenter les 6 cartes capteurs du tableau de bord.

Reponse :

```json
{
  "temperature": { "value": 25, "unit": "C", "status": "Recu", "date": "2026-07-02 12:00" },
  "air_humidity": { "value": 60, "unit": "%", "status": "Recu", "date": "2026-07-02 12:00" },
  "soil_humidity": { "value": 45, "unit": "%", "status": "Recu", "date": "2026-07-02 12:00" },
  "co2": { "value": 420, "unit": "ppm", "status": "Recu", "date": "2026-07-02 12:00" },
  "light": { "value": 800, "unit": "lux", "status": "Recu", "date": "2026-07-02 12:00" },
  "water_level": { "value": 75, "unit": "%", "status": "Recu", "date": "2026-07-02 12:00" }
}
```

### GET `/api/measurements/chart?type=temperature&period=day`

Utilise par : `src/pages/DashboardPage.jsx`

Role : alimenter le graphique d'evolution des mesures.

Reponse :

```json
{
  "labels": ["08:00", "09:00"],
  "series": [24, 25],
  "unit": "C"
}
```

### POST `/api/actuators/{actuator}`

Utilise par :
- `src/pages/DashboardPage.jsx`
- `scripts/actionneurs-cli.bat`

Role : declencher une commande manuelle ou CLI vers un actionneur.

Valeurs de `{actuator}` :

```txt
irrigation
ventilation
light
```

Body :

```json
{
  "command": "start",
  "source": "manual"
}
```

Valeurs possibles :

```txt
command: start | stop
source: manual | cli | batch
```

Reponse :

```json
{
  "success": true,
  "id_action": "ACT-001",
  "status": "Executee"
}
```

Le frontend journalise aussi cette action via `/api/audit-logs`.

## Alertes et seuils

### GET `/api/alerts/active`

Utilise par : `src/pages/AlertsPage.jsx`

Role : afficher les alertes actives.

### PUT `/api/alerts/{alert}/resolve`

Utilise par : `src/pages/AlertsPage.jsx`

Role : marquer une alerte comme resolue.
Le frontend ajoute ensuite une trace d'audit : `Resolution alerte`.

### GET `/api/thresholds`

Utilise par : `src/pages/AlertsPage.jsx`

Role : afficher les regles/seuils automatiques.

### PUT `/api/thresholds`

Utilise par : `src/pages/AlertsPage.jsx`

Role : enregistrer les modifications de seuils/regles automatiques.
Le frontend ajoute une trace d'audit : `Modification regles automatiques`.

Body :

```json
[
  { "key": "soil_humidity_min", "value": 30 }
]
```

### GET `/api/automation-rules`

Utilise par : `src/pages/AlertsPage.jsx`

Role : afficher les regles automatiques configurees cote backend.

### GET `/api/notifications/channels`

Utilise par : `src/pages/AlertsPage.jsx`

Role : afficher l'etat des canaux de notification.

## Historique

Utilise par : `src/pages/HistoryPage.jsx`

### GET `/api/history/measurements?limit=500`

Role : renvoyer l'historique des mesures.

### GET `/api/history/alerts?limit=500`

Role : renvoyer l'historique des alertes.

### GET `/api/history/actions?limit=500`

Role : renvoyer l'historique des actions/commandes.

Le frontend gere :
- recherche ;
- pagination par 7 lignes ;
- export CSV local des donnees recues ;
- journalisation audit des exports CSV.

## Administration utilisateurs

Utilise par : `src/pages/AdminPage.jsx`, onglet `Gestion des utilisateurs`.

### GET `/api/users?limit=500&search=texte`

Role : lister les utilisateurs Laravel avec leurs roles.

Reponse :

```json
{
  "rows": [
    {
      "id": 1,
      "id_user": "USR-001",
      "nom": "elie",
      "email": "admin@agroiot.cd",
      "role": "Admin",
      "status": "Actif",
      "password": ""
    }
  ],
  "total": 1
}
```

### POST `/api/users`

Role : creer un utilisateur depuis l'administration.

Body :

```json
{
  "nom": "Nom utilisateur",
  "email": "user@agroiot.cd",
  "role": "Agriculteur",
  "status": "Invite",
  "password": "mot_de_passe_attribue_par_admin"
}
```

Important :
- l'administrateur attribue le mot de passe ;
- Laravel doit stocker uniquement le hash ;
- ne jamais renvoyer le mot de passe au frontend ;
- le frontend journalise l'action `Creation utilisateur`.

### PUT `/api/users/{user}`

Role : modifier nom, email, role, statut ou mot de passe d'un utilisateur.
Le mot de passe est optionnel : s'il est vide, il ne doit pas etre modifie.

Le frontend journalise l'action `Modification utilisateur`.

### DELETE `/api/users/{user}`

Role : supprimer un utilisateur.
Le frontend journalise l'action `Suppression utilisateur`.

## Roles et affichage frontend

Roles attendus :

```txt
Admin
Agriculteur
Technicien
```

Affichage par role :

| Role | Pages visibles |
| --- | --- |
| Admin | Dashboard, Historique, Alertes, Administration |
| Agriculteur | Dashboard, Historique, Alertes |
| Technicien | Dashboard, Historique, Alertes |

Important : le frontend masque les pages non autorisees, mais Laravel doit aussi proteger les routes sensibles cote backend.

## Etats vides

Quand il n'y a pas encore de donnees, Laravel doit renvoyer :

```json
{ "rows": [], "total": 0 }
```

ou un tableau vide selon le endpoint :

```json
[]
```

Le frontend affichera alors les etats vides prevus : aucune mesure, aucune alerte, aucun utilisateur, aucun acces, etc.


