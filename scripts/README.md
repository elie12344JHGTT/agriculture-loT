# Scripts CLI Agro IoT

Ce dossier contient le script batch/CLI demande dans le cahier de charge pour executer des actions en masse ou via menu.

## Script disponible

`actionneurs-cli.bat`

Il permet d'envoyer des commandes vers le backend Laravel pour :

- irrigation;
- ventilation;
- eclairage.

## Configuration

Par defaut, le script appelle :

```txt
http://127.0.0.1:8000/api
```

Pour utiliser une autre URL Laravel :

```bat
set AGRO_API_BASE_URL=http://localhost:8000/api
```

Si les routes sont protegees par Sanctum/JWT :

```bat
set AGRO_API_TOKEN=votre_token_api
```

## Utilisation avec menu

```bat
scripts\actionneurs-cli.bat
```

## Utilisation directe

```bat
scripts\actionneurs-cli.bat irrigation start
scripts\actionneurs-cli.bat ventilation stop
scripts\actionneurs-cli.bat light start
scripts\actionneurs-cli.bat all start batch
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

Le backend Laravel peut utiliser `source` pour distinguer :

- `manual` : commande lancee depuis le menu;
- `cli` : commande lancee directement;
- `batch` : commande de masse.

Les routes ne sont pas encore forcees dans ce script : le backend peut les implementer comme indique dans `agro-iot-frontend/src/api/API_INTEGRATION.md`.
