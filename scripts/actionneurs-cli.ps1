param(
    [string]$Actuator,
    [string]$Command = "start",
    [string]$Source = "cli",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$apiBaseUrl = if ($env:AGRO_API_BASE_URL) { $env:AGRO_API_BASE_URL.TrimEnd('/') } else { "https://agro-iot-backend.onrender.com/api" }
$apiToken = $env:AGRO_API_TOKEN

$actuatorAliases = @{
    "irrigation" = "irrigation"
    "arrosage" = "irrigation"
    "pompe" = "irrigation"
    "ventilation" = "ventilation"
    "ventilateur" = "ventilation"
    "light" = "light"
    "eclairage" = "light"
    "éclairage" = "light"
    "luminosite" = "light"
    "luminosité" = "light"
    "lampe" = "light"
    "all" = "all"
    "tout" = "all"
}

$commandAliases = @{
    "start" = "start"
    "on" = "start"
    "demarrer" = "start"
    "démarrer" = "start"
    "activer" = "start"
    "allumer" = "start"
    "stop" = "stop"
    "off" = "stop"
    "arreter" = "stop"
    "arrêter" = "stop"
    "eteindre" = "stop"
    "éteindre" = "stop"
}

function Show-Help {
    Write-Host "Agro IoT - CLI Actionneurs"
    Write-Host ""
    Write-Host "Mode menu :"
    Write-Host "  .\scripts\actionneurs-cli.bat"
    Write-Host "  .\scripts\actionneurs-cli.ps1"
    Write-Host ""
    Write-Host "Mode direct :"
    Write-Host "  .\scripts\actionneurs-cli.bat arrosage start"
    Write-Host "  .\scripts\actionneurs-cli.bat ventilation stop"
    Write-Host "  .\scripts\actionneurs-cli.bat luminosite start"
    Write-Host "  .\scripts\actionneurs-cli.bat tout stop batch"
    Write-Host ""
    Write-Host "Variables :"
    Write-Host "  AGRO_API_BASE_URL  Defaut: https://agro-iot-backend.onrender.com/api"
    Write-Host "  AGRO_API_TOKEN     Token Bearer optionnel si le backend protege les routes"
}

function Normalize-Actuator([string]$value) {
    if ([string]::IsNullOrWhiteSpace($value)) { return $null }
    $key = $value.Trim().ToLowerInvariant()
    if ($actuatorAliases.ContainsKey($key)) { return $actuatorAliases[$key] }
    return $null
}

function Normalize-Command([string]$value) {
    if ([string]::IsNullOrWhiteSpace($value)) { return "start" }
    $key = $value.Trim().ToLowerInvariant()
    if ($commandAliases.ContainsKey($key)) { return $commandAliases[$key] }
    return $null
}

function Send-ActuatorCommand([string]$target, [string]$action, [string]$source) {
    $endpoint = "$apiBaseUrl/actuators/$target"
    $body = @{
        command = $action
        source = $source
    } | ConvertTo-Json -Compress

    $headers = @{ "Accept" = "application/json" }
    if ($apiToken) { $headers["Authorization"] = "Bearer $apiToken" }

    Write-Host ""
    Write-Host "Commande: $target -> $action [$source]"
    Write-Host "Endpoint: $endpoint"

    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType "application/json" -Body $body
        $response | ConvertTo-Json -Compress
        return 0
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        Write-Error "Erreur API ($statusCode): $($_.Exception.Message)"
        return 1
    }
}

function Invoke-Direct([string]$targetInput, [string]$commandInput, [string]$sourceInput) {
    $target = Normalize-Actuator $targetInput
    $action = Normalize-Command $commandInput
    $sourceValue = if ([string]::IsNullOrWhiteSpace($sourceInput)) { "cli" } else { $sourceInput }

    if (-not $target) {
        Write-Error "Actionneur inconnu. Utilisez: arrosage, ventilation, luminosite ou tout."
        return 1
    }

    if (-not $action) {
        Write-Error "Commande inconnue. Utilisez: start/on/demarrer/allumer ou stop/off/arreter/eteindre."
        return 1
    }

    if ($target -eq "all") {
        $exitCode = 0
        foreach ($item in @("irrigation", "ventilation", "light")) {
            $result = Send-ActuatorCommand $item $action $sourceValue
            if ($result -ne 0) { $exitCode = $result }
        }
        return $exitCode
    }

    return Send-ActuatorCommand $target $action $sourceValue
}

function Show-Menu {
    while ($true) {
        Clear-Host
        Write-Host "============================================"
        Write-Host "       Agro IoT - CLI Actionneurs"
        Write-Host "============================================"
        Write-Host "API Laravel: $apiBaseUrl"
        Write-Host ""
        Write-Host "1. Demarrer arrosage"
        Write-Host "2. Activer ventilation"
        Write-Host "3. Allumer luminosite"
        Write-Host "4. Tout demarrer"
        Write-Host "5. Arreter arrosage"
        Write-Host "6. Arreter ventilation"
        Write-Host "7. Eteindre luminosite"
        Write-Host "8. Tout arreter"
        Write-Host "0. Quitter"
        Write-Host ""
        $choice = Read-Host "Votre choix"

        switch ($choice) {
            "1" { Invoke-Direct "arrosage" "start" "manual"; pause }
            "2" { Invoke-Direct "ventilation" "start" "manual"; pause }
            "3" { Invoke-Direct "luminosite" "start" "manual"; pause }
            "4" { Invoke-Direct "tout" "start" "batch"; pause }
            "5" { Invoke-Direct "arrosage" "stop" "manual"; pause }
            "6" { Invoke-Direct "ventilation" "stop" "manual"; pause }
            "7" { Invoke-Direct "luminosite" "stop" "manual"; pause }
            "8" { Invoke-Direct "tout" "stop" "batch"; pause }
            "0" { return 0 }
            default { Write-Host "Choix invalide."; pause }
        }
    }
}

if ($Help -or $Actuator -in @("help", "--help", "-h", "/?")) {
    Show-Help
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Actuator)) {
    Show-Menu
    exit 0
}

exit (Invoke-Direct $Actuator $Command $Source)
