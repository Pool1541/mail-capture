# === PARÁMETROS DEL SCRIPT ===
param(
    [Parameter(Mandatory=$true, HelpMessage="Buzón que quieres proteger")]
    [string]$TargetMailbox,
    
    [Parameter(Mandatory=$true, HelpMessage="Lista de remitentes permitidos como string separado por comas")]
    [string]$AllowedSendersString,
    
    [Parameter(Mandatory=$true, HelpMessage="ID de la aplicación Azure AD")]
    [string]$AppId,
    
    [Parameter(Mandatory=$true, HelpMessage="ID del tenant Azure AD")]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true, HelpMessage="Secret del cliente para autenticación")]
    [string]$ClientSecret
)

# Convertir la cadena de emails en un array
Write-Host "Procesando lista de emails: $AllowedSendersString" -ForegroundColor Yellow
$AllowedSenders = $AllowedSendersString -split ',' | ForEach-Object { $_.Trim().Trim('"') }
Write-Host "Emails procesados: $($AllowedSenders -join ', ')" -ForegroundColor Green

# === VERIFICAR E IMPORTAR MÓDULO DE EXCHANGE ONLINE ===
Write-Host "Verificando e importando módulo ExchangeOnlineManagement..." -ForegroundColor Cyan

try {
    # Configurar TLS para descargas seguras
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    Write-Host "Verificando módulo ExchangeOnlineManagement..." -ForegroundColor Yellow
    
    # Intentar importar desde diferentes ubicaciones
    $moduleImported = $false
    
    # Método 1: Intentar importar directamente si ya está instalado
    try {
        $availableModule = Get-Module -ListAvailable -Name ExchangeOnlineManagement | Select-Object -First 1
        if ($availableModule) {
            Import-Module ExchangeOnlineManagement -Force -ErrorAction Stop
            $module = Get-Module ExchangeOnlineManagement
            if ($module) {
                Write-Host "Módulo ExchangeOnlineManagement importado correctamente. Versión: $($module.Version)" -ForegroundColor Green
                $moduleImported = $true
            }
        } else {
            Write-Host "Módulo no encontrado en ubicaciones disponibles." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Método 1 falló: $_" -ForegroundColor Yellow
    }
    
    # Método 2: Intentar instalarlo para CurrentUser si no está disponible
    if (-not $moduleImported) {
        Write-Host "Intentando instalar módulo para CurrentUser..." -ForegroundColor Yellow
        try {
            # Configurar repositorio PSGallery como confiable temporalmente
            $originalPolicy = Get-PSRepository -Name PSGallery | Select-Object -ExpandProperty InstallationPolicy
            Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
            
            Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser -ErrorAction Stop
            Import-Module ExchangeOnlineManagement -Force -ErrorAction Stop
            
            # Restaurar política original
            Set-PSRepository -Name PSGallery -InstallationPolicy $originalPolicy
            
            $module = Get-Module ExchangeOnlineManagement
            if ($module) {
                Write-Host "Módulo ExchangeOnlineManagement instalado e importado. Versión: $($module.Version)" -ForegroundColor Green
                $moduleImported = $true
            }
        } catch {
            Write-Host "Método 2 falló: $_" -ForegroundColor Yellow
            # Restaurar política original en caso de error
            try { Set-PSRepository -Name PSGallery -InstallationPolicy $originalPolicy } catch {}
        }
    }
    
    # Método 3: Verificar si tenemos los cmdlets necesarios disponibles
    if (-not $moduleImported) {
        Write-Host "Verificando cmdlets de Exchange Online disponibles..." -ForegroundColor Yellow
        $connectCmd = Get-Command Connect-ExchangeOnline -ErrorAction SilentlyContinue
        $getMailboxCmd = Get-Command Get-Mailbox -ErrorAction SilentlyContinue
        
        if ($connectCmd -and $getMailboxCmd) {
            Write-Host "Cmdlets de Exchange Online encontrados, continuando..." -ForegroundColor Green
            $moduleImported = $true
        }
    }
    
    if (-not $moduleImported) {
        Write-Error "No se pudo importar el módulo ExchangeOnlineManagement."
        Write-Host "`nSOLUCIONES RECOMENDADAS:" -ForegroundColor Yellow
        Write-Host "1. Ejecute PowerShell como Administrador y ejecute:" -ForegroundColor White
        Write-Host "   Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber" -ForegroundColor Gray
        Write-Host "2. O para usuario actual:" -ForegroundColor White
        Write-Host "   Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser" -ForegroundColor Gray
        Write-Host "3. Si usa PowerShell 7, instale desde una sesión de Windows PowerShell 5.1" -ForegroundColor White
        Write-Host "4. Reinicie PowerShell después de la instalación" -ForegroundColor White
        exit 1
    }
    
} catch {
    Write-Error "Error al importar el módulo ExchangeOnlineManagement: $_"
    Write-Host "Verifique que el módulo esté instalado correctamente." -ForegroundColor Yellow
    exit 1
}

# === CONECTARSE A EXCHANGE ONLINE ===
Write-Host "Conectando a Exchange Online con Service Principal..." -ForegroundColor Cyan

try {
    # Método alternativo: Usar certificado temporal o access token
    # Para Client Secret, necesitamos obtener un access token primero
    
    Write-Host "Obteniendo access token..." -ForegroundColor Yellow
    
    # Construir la URL del endpoint de token
    $tokenEndpoint = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
    
    # Preparar el cuerpo de la solicitud
    $body = @{
        client_id     = $AppId
        client_secret = $ClientSecret
        scope         = "https://outlook.office365.com/.default"
        grant_type    = "client_credentials"
    }
    
    # Obtener el access token
    $tokenResponse = Invoke-RestMethod -Uri $tokenEndpoint -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    if ($tokenResponse.access_token) {
        Write-Host "Access token obtenido exitosamente." -ForegroundColor Green
        
        # Conectar usando el access token
        Connect-ExchangeOnline -AccessToken $tokenResponse.access_token -Organization "$TenantId" -ShowProgress:$false -ShowBanner:$false
        
        Write-Host "Conectado a Exchange Online exitosamente." -ForegroundColor Green
        
    } else {
        throw "No se pudo obtener el access token"
    }
    
} catch {
    Write-Error "Error al conectar a Exchange Online: $_"
    Write-Host "`nVerificar configuración:" -ForegroundColor Yellow
    Write-Host "1. AppId: $AppId" -ForegroundColor White
    Write-Host "2. TenantId: $TenantId" -ForegroundColor White
    Write-Host "3. Que el Client Secret sea válido y no haya expirado" -ForegroundColor Yellow
    Write-Host "4. Que la aplicación tenga permisos API:" -ForegroundColor Yellow
    Write-Host "   - Office 365 Exchange Online > Exchange.ManageAsApp" -ForegroundColor White
    Write-Host "5. Que el Service Principal tenga rol Exchange Administrator" -ForegroundColor Yellow
    Write-Host "`nPasos para configurar permisos:" -ForegroundColor Cyan
    Write-Host "1. Azure Portal > App registrations > Tu aplicación" -ForegroundColor White
    Write-Host "2. API permissions > Add permission > Office 365 Exchange Online" -ForegroundColor White
    Write-Host "3. Application permissions > Exchange.ManageAsApp" -ForegroundColor White
    Write-Host "4. Grant admin consent" -ForegroundColor White
    Write-Host "`nComando para asignar rol Exchange:" -ForegroundColor Cyan
    Write-Host "Connect-ExchangeOnline -UserPrincipalName admin@tudominio.com" -ForegroundColor White
    Write-Host "New-ServicePrincipal -AppId `"$AppId`" -ServiceId `"$AppId`"" -ForegroundColor White
    Write-Host "New-RoleAssignment -RoleAssignee `"$AppId`" -Role `"Exchange Administrator`"" -ForegroundColor White
    exit 1
}

# === CREAR CONTACTOS SI NO EXISTEN ===
$ContactNames = @()

foreach ($Email in $AllowedSenders) {
    $ContactName = $Email.Split("@")[0] + "_ext_contact"
    $existing = Get-MailContact -Filter "ExternalEmailAddress -eq 'smtp:$Email'" -ErrorAction SilentlyContinue

    if (-not $existing) {
        Write-Host "Creando contacto para $Email..." -ForegroundColor Yellow
        New-MailContact -Name $ContactName -ExternalEmailAddress $Email | Out-Null
    } else {
        Write-Host "El contacto para $Email ya existe. Usando $($existing.Name)" -ForegroundColor Green
        $ContactName = $existing.Name
    }

    $ContactNames += $ContactName
}

# === RESTRINGIR ENVÍOS AL BUZÓN SOLO DESDE ESTOS CONTACTOS ===
# Actualmente se tienen que registrar tanto los contactos que ya existen como los nuevos
# TODO: Modificar el script para registrar solo los contactos nuevos sin eliminar los existentes
Write-Host "Aplicando restricciones al buzón $TargetMailbox..." -ForegroundColor Cyan
Set-Mailbox -Identity $TargetMailbox -AcceptMessagesOnlyFromSendersOrMembers $ContactNames

Write-Host "`n✅ ¡Listo! El buzón solo aceptará correos de:" -ForegroundColor Green
$AllowedSenders | ForEach-Object { Write-Host "   - $_" }

# === DESCONECTAR DE EXCHANGE ONLINE ===
Write-Host "`nDesconectando de Exchange Online..." -ForegroundColor Cyan
try {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Host "Desconectado exitosamente." -ForegroundColor Green
} catch {
    Write-Warning "Error al desconectar: $_"
}

Write-Host "`n🎉 Script ejecutado correctamente." -ForegroundColor Green