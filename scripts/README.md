# Scripts batch/CLI Agro IoT

Ce dossier contient le script demande dans le cahier de charge pour executer des actions en masse ou via menu depuis un terminal.

## Objectif

Permettre de declencher les actionneurs sans passer par l'interface web :

- arrosage / irrigation ;
- ventilation ;
- luminosite / eclairage ;
- commandes groupees sur tous les actionneurs.

## Scripts disponibles

```txt
scripts/actionneurs-cli.bat
scripts/actionneurs-cli.ps1
```

Le fichier `.bat` est le lanceur Windows. Il appelle le script PowerShell `.ps1`.

## Configuration

Par defaut, le script appelle le backend en ligne :

```txt
https://agro-iot-backend.onrender.com/api
```

Pour utiliser un backend local :

```bat
set AGRO_API_BASE_URL=http://127.0.0.1:8000/api
```

Si les routes sont protegees plus tard par token :

```bat
set AGRO_API_TOKEN=votre_token_api
```

## Mode menu

```bat
scripts\actionneurs-cli.bat
```

## Mode direct

```bat
scripts\actionneurs-cli.bat arrosage start
scripts\actionneurs-cli.bat ventilation stop
scripts\actionneurs-cli.bat luminosite start
scripts\actionneurs-cli.bat tout stop batch
```

Alias acceptes :

```txt
arrosage, irrigation, pompe
ventilation, ventilateur
luminosite, eclairage, light, lampe
tout, all
```

Commandes acceptees :

```txt
start, on, demarrer, activer, allumer
stop, off, arreter, eteindre
```

## Routes Laravel appelees

```txt
POST /api/actuators/irrigation
POST /api/actuators/ventilation
POST /api/actuators/light
```

Body envoye :

```json
{
  "command": "start",
  "source": "cli"
}
```

Valeurs possibles pour `source` :

```txt
manual  commande lancee via menu
cli     commande directe
batch   commande groupee
```

Le script affiche la reponse JSON du backend et renvoie un code d'erreur non nul si l'appel API echoue.
