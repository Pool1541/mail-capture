# === SCRIPT DE DIAGNÓSTICO PARA EXCHANGE ONLINE ===
# Ejecutar este script para diagnosticar problemas con el entorno de PowerShell

Write-Host "=== DIAGNÓSTICO DEL ENTORNO POWERSHELL ===" -ForegroundColor Cyan

# Información básica del sistema
Write-Host "`n1. INFORMACIÓN DEL SISTEMA:" -ForegroundColor Yellow
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor White
Write-Host "PowerShell Edition: $($PSVersionTable.PSEdition)" -ForegroundColor White
Write-Host "Usuario actual: $($env:USERNAME)" -ForegroundColor White
Write-Host "Dominio: $($env:USERDOMAIN)" -ForegroundColor White

# Política de ejecución
Write-Host "`n2. POLITICA DE EJECUCION:" -ForegroundColor Yellow
try {
    $currentUserPolicy = Get-ExecutionPolicy -Scope CurrentUser
    $localMachinePolicy = Get-ExecutionPolicy -Scope LocalMachine
    Write-Host "Politica actual (CurrentUser): $currentUserPolicy" -ForegroundColor White
    Write-Host "Politica actual (LocalMachine): $localMachinePolicy" -ForegroundColor White
} catch {
    Write-Host "Error verificando politicas de ejecucion: $_" -ForegroundColor Red
}

# Verificar PSModulePath
Write-Host "`n3. RUTAS DE MÓDULOS:" -ForegroundColor Yellow
$env:PSModulePath -split ';' | ForEach-Object { 
    Write-Host "  - $_" -ForegroundColor White
}

# Verificar si PowerShellGet está disponible
Write-Host "`n4. POWERSHELLGET:" -ForegroundColor Yellow
try {
    $psget = Get-Module -ListAvailable -Name PowerShellGet | Select-Object -First 1
    if ($psget) {
        Write-Host "PowerShellGet versión: $($psget.Version)" -ForegroundColor Green
        Write-Host "Ubicación: $($psget.ModuleBase)" -ForegroundColor White
    } else {
        Write-Host "PowerShellGet NO está disponible" -ForegroundColor Red
    }
} catch {
    Write-Host "Error verificando PowerShellGet: $_" -ForegroundColor Red
}

# Verificar si ExchangeOnlineManagement está disponible
Write-Host "`n5. EXCHANGE ONLINE MANAGEMENT:" -ForegroundColor Yellow
try {
    $exchangeModule = Get-Module -ListAvailable -Name ExchangeOnlineManagement | Select-Object -First 1
    if ($exchangeModule) {
        Write-Host "ExchangeOnlineManagement versión: $($exchangeModule.Version)" -ForegroundColor Green
        Write-Host "Ubicación: $($exchangeModule.ModuleBase)" -ForegroundColor White
        
        # Intentar importar el módulo
        try {
            Import-Module ExchangeOnlineManagement -Force
            Write-Host "Módulo importado correctamente" -ForegroundColor Green
            
            # Verificar comandos disponibles
            $commands = Get-Command -Module ExchangeOnlineManagement | Measure-Object
            Write-Host "Comandos disponibles: $($commands.Count)" -ForegroundColor White
            
        } catch {
            Write-Host "Error importando módulo: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "ExchangeOnlineManagement NO está instalado" -ForegroundColor Red
    }
} catch {
    Write-Host "Error verificando ExchangeOnlineManagement: $_" -ForegroundColor Red
}

# Verificar conectividad a internet
Write-Host "`n6. CONECTIVIDAD:" -ForegroundColor Yellow
try {
    $response = Test-NetConnection -ComputerName "login.microsoftonline.com" -Port 443 -InformationLevel Quiet
    if ($response) {
        Write-Host "Conectividad a Microsoft Online: OK" -ForegroundColor Green
    } else {
        Write-Host "Sin conectividad a Microsoft Online" -ForegroundColor Red
    }
} catch {
    Write-Host "Error verificando conectividad: $_" -ForegroundColor Red
}

# Verificar repositorios de PowerShell
Write-Host "`n7. REPOSITORIOS DE POWERSHELL:" -ForegroundColor Yellow
try {
    $repos = Get-PSRepository
    foreach ($repo in $repos) {
        Write-Host "  - $($repo.Name): $($repo.InstallationPolicy) ($($repo.SourceLocation))" -ForegroundColor White
    }
} catch {
    Write-Host "Error verificando repositorios: $_" -ForegroundColor Red
}

# Recomendaciones
Write-Host "`n=== RECOMENDACIONES ===" -ForegroundColor Cyan

$moduleInstalled = Get-Module -ListAvailable -Name ExchangeOnlineManagement
if (-not $moduleInstalled) {
    Write-Host "CRITICO: ExchangeOnlineManagement no esta instalado" -ForegroundColor Red
    Write-Host "   Solucion 1: Ejecute como Administrador en Windows PowerShell 5.1:" -ForegroundColor Yellow
    Write-Host "   C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command `"Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope AllUsers`"" -ForegroundColor Gray
    Write-Host "" -ForegroundColor White
    Write-Host "   Solucion 2: Ejecute como usuario actual en PowerShell 7:" -ForegroundColor Yellow
    Write-Host "   pwsh.exe -Command `"Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser`"" -ForegroundColor Gray
    Write-Host "" -ForegroundColor White
    Write-Host "   Solucion 3: Instalar manualmente con PowerShellGet:" -ForegroundColor Yellow
    Write-Host "   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12" -ForegroundColor Gray
    Write-Host "   Install-PackageProvider -Name NuGet -Force" -ForegroundColor Gray
    Write-Host "   Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber" -ForegroundColor Gray
} else {
    Write-Host "✅ ExchangeOnlineManagement esta instalado correctamente" -ForegroundColor Green
    Write-Host "   Version: $($moduleInstalled.Version)" -ForegroundColor White
    Write-Host "   Ubicacion: $($moduleInstalled.ModuleBase)" -ForegroundColor White
}

try {
    $execPolicy = Get-ExecutionPolicy -Scope CurrentUser
    if ($execPolicy -eq "Restricted") {
        Write-Host "ADVERTENCIA: Politica de ejecucion muy restrictiva" -ForegroundColor Yellow
        Write-Host "   Solucion: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error verificando politica de ejecucion: $_" -ForegroundColor Red
}

Write-Host "`nDiagnostico completado." -ForegroundColor Green
Write-Host "Si ExchangeOnlineManagement esta instalado, el script principal deberia funcionar." -ForegroundColor White
