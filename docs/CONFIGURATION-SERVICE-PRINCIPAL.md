# GUÍA COMPLETA: Configuración de Service Principal para Exchange Online

## 🎯 Objetivo

Configurar un Service Principal en Azure AD y Exchange Online para permitir autenticación automatizada sin intervención humana desde aplicaciones Node.js.

## 📚 Índice

- [PASO 1: Crear Service Principal en Azure Portal](#-paso-1-crear-service-principal-en-azure-portal)
- [PASO 2: Configurar Service Principal en Exchange Online](#-paso-2-configurar-service-principal-en-exchange-online)
- [PASO 3: Configurar Variables de Entorno](#️-paso-3-configurar-variables-de-entorno)
- [PASO 4: Probar la Configuración](#-paso-4-probar-la-configuración)
- [PASO 5: Solución de Problemas Técnicos](#-paso-5-solución-de-problemas-técnicos) ⭐ **IMPORTANTE**

---

## 📋 Prerrequisitos

- Cuenta de administrador global o Exchange Administrator
- Acceso a Azure Portal
- **PowerShell con módulo ExchangeOnlineManagement instalado** (ver PASO 5.1 si no está instalado)
- Aplicación Node.js configurada
- **IMPORTANTE**: Al menos una de estas versiones de PowerShell:
  - Windows PowerShell 5.1 (incluido en Windows)
  - PowerShell 7+ (recomendado para mejor compatibilidad)

---

## 🚀 PASO 1: Crear Service Principal en Azure Portal

### 1.1 Registrar nueva aplicación

1. Ve a [Azure Portal](https://portal.azure.com)
2. Navega a **Azure Active Directory** > **App registrations**
3. Haz clic en **+ New registration**
4. Configura:
   - **Name**: `mail-capture-service-principal`
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: Déjalo vacío
5. Haz clic en **Register**

### 1.2 Obtener IDs necesarios

Después del registro, copia y guarda:

- **Application (client) ID** → `APP_ID` (ejemplo: `12345678-1234-5678-9012-123456789abc`)
- **Directory (tenant) ID** → `TENANT_ID` (ejemplo: `87654321-4321-8765-2109-987654321def`)
- **Object ID** → Necesario para el comando Exchange (ejemplo: `abcdefgh-ijkl-mnop-qrst-uvwxyz123456`)

### 1.3 Crear Client Secret

1. Ve a **Certificates & secrets**
2. Haz clic en **+ New client secret**
3. Configura:
   - **Description**: `Exchange Online Access`
   - **Expires**: 24 months (recomendado)
4. Haz clic en **Add**
5. **¡IMPORTANTE!** Copia el **Value** inmediatamente → `CLIENT_SECRET`

### 1.4 Configurar permisos API

1. Ve a **API permissions**
2. Haz clic en **+ Add a permission**
3. Selecciona **Office 365 Exchange Online**
4. Selecciona **Application permissions**
5. Busca y marca **Exchange.ManageAsApp**
6. Haz clic en **Add permissions**
7. **¡CRUCIAL!** Haz clic en **Grant admin consent for [tu-organizacion]**
8. Verifica que aparezca un ✅ verde en "Status"

---

## 🔧 PASO 2: Configurar Service Principal en Exchange Online

### 2.1 Conectar a Exchange Online

```powershell
# Abrir PowerShell como Administrador
# Instalar módulo si no está instalado
Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber

# Conectar con cuenta de administrador
Connect-ExchangeOnline -UserPrincipalName admin@tudominio.onmicrosoft.com -Device
```

### 2.2 Habilitar personalización de organización

```powershell
# Habilitar personalización (REQUERIDO)
Enable-OrganizationCustomization

# Verificar que se habilitó
Get-OrganizationConfig | Select-Object IsDehydrated
# Debe mostrar: IsDehydrated : False
```

### 2.3 Crear Service Principal en Exchange Online

```powershell
# Crear Service Principal usando los valores de Azure Portal
New-ServicePrincipal -DisplayName "mail-capture-service-principal" -AppId "12345678-1234-5678-9012-123456789abc" -ServiceId "abcdefgh-ijkl-mnop-qrst-uvwxyz123456"

# Verificar que se creó correctamente
Get-ServicePrincipal -Identity "12345678-1234-5678-9012-123456789abc"
```

**Nota**: Reemplaza los valores con tus propios IDs:

- `DisplayName`: Nombre descriptivo de tu aplicación
- `AppId`: Application (client) ID de Azure Portal
- `ServiceId`: Object ID de Azure Portal

### 2.4 Asignar roles necesarios

```powershell
# Asignar rol de configuración organizacional
New-ManagementRoleAssignment -User "12345678-1234-5678-9012-123456789abc" -Role "Organization Configuration"

# Asignar rol para gestión de destinatarios de correo
New-ManagementRoleAssignment -User "12345678-1234-5678-9012-123456789abc" -Role "Mail Recipients"

# Asignar rol para creación de contactos de correo
New-ManagementRoleAssignment -User "12345678-1234-5678-9012-123456789abc" -Role "Mail Recipient Creation"
```

### 2.5 Verificar configuración completa

```powershell
# Verificar Service Principal
Get-ServicePrincipal -Identity "12345678-1234-5678-9012-123456789abc" | Select-Object DisplayName, AppId, Identity

# Verificar roles asignados
Get-ManagementRoleAssignment -RoleAssignee "12345678-1234-5678-9012-123456789abc" | Select-Object Role, RoleAssigneeType

# Debe mostrar los 3 roles asignados:
# - Organization Configuration
# - Mail Recipients
# - Mail Recipient Creation
```

### 2.6 Desconectar

```powershell
Disconnect-ExchangeOnline -Confirm:$false
```

---

## ⚙️ PASO 3: Configurar Variables de Entorno

### 3.1 Actualizar archivo .env.development

```bash
# Configuración del Service Principal
APP_ID=12345678-1234-5678-9012-123456789abc
CLIENT_SECRET=tu-client-secret-generado-en-azure
TENANT_ID=87654321-4321-8765-2109-987654321def

# Configuración del buzón objetivo
TARGET_MAILBOX=tu-buzon@tudominio.onmicrosoft.com
EMAIL=tu-buzon@tudominio.onmicrosoft.com

# Configuración de la aplicación
PORT=3000
REDIRECT_URI=http://localhost:3000/auth/callback
CACHE_PATH=./tokenCache.json

# Configuración de Supabase (si aplica)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_ROLE=tu-supabase-service-role
SUPABASE_JWT_SECRET=tu-supabase-jwt-secret
```

**Nota**: Reemplaza todos los valores con tus credenciales reales obtenidas de Azure Portal.

---

## 🧪 PASO 4: Probar la Configuración

### 4.1 Probar script PowerShell manualmente

```powershell
# Navegar al directorio del proyecto
cd "ruta\al\proyecto\mail-capture"

# Ejecutar script con los valores configurados (PowerShell 7 - Recomendado)
pwsh.exe -ExecutionPolicy Bypass -File ".\scripts\config-mail-contacts.ps1" `
    -TargetMailbox "tu-buzon@tudominio.onmicrosoft.com" `
    -AllowedSendersString "test@example.com" `
    -AppId "12345678-1234-5678-9012-123456789abc" `
    -TenantId "87654321-4321-8765-2109-987654321def" `
    -ClientSecret "tu-client-secret-generado-en-azure"

# O con Windows PowerShell 5.1
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File ".\scripts\config-mail-contacts.ps1" `
    -TargetMailbox "tu-buzon@tudominio.onmicrosoft.com" `
    -AllowedSendersString "test@example.com" `
    -AppId "12345678-1234-5678-9012-123456789abc" `
    -TenantId "87654321-4321-8765-2109-987654321def" `
    -ClientSecret "tu-client-secret-generado-en-azure"
```

**Nota**: El parámetro cambió de `-AllowedSenders` a `-AllowedSendersString` para mejorar la compatibilidad entre PowerShell y Node.js.

### 4.2 Verificar resultado esperado

```
✅ Debe mostrar:
Verificando e importando módulo ExchangeOnlineManagement...
Módulo ExchangeOnlineManagement importado correctamente. Versión: 3.8.0
Conectando a Exchange Online con Service Principal...
Obteniendo access token...
Access token obtenido exitosamente.
Conectado a Exchange Online exitosamente.
Creando contacto para test@example.com...
Aplicando restricciones al buzón tu-buzon@tudominio.onmicrosoft.com...
✅ ¡Listo! El buzón solo aceptará correos de:
   - test@example.com
Desconectando de Exchange Online...
Desconectado exitosamente.
🎉 Script ejecutado correctamente.
```

### 4.3 Verificar configuración del buzón

```powershell
# Conectar manualmente para verificar
Connect-ExchangeOnline -UserPrincipalName admin@tudominio.onmicrosoft.com -Device

# Verificar configuración del buzón
Get-Mailbox tu-buzon@tudominio.onmicrosoft.com | Select-Object AcceptMessagesOnlyFromSendersOrMembers

# Verificar contactos creados
Get-MailContact | Where-Object {$_.Name -like "*_ext_contact"}

# Desconectar
Disconnect-ExchangeOnline -Confirm:$false
```

### 4.4 Probar desde Node.js

```typescript
// En tu aplicación Node.js
try {
  await configureMailContacts.execute("nuevo@email.com");
  console.log("✅ Configuración automática exitosa");
} catch (error) {
  console.error("❌ Error:", error.message);
}
```

## 📑 PASO 4: Comandos útiles.

### 4.1 Quitar restricción de recepción de correos al buzón desde contactos específicos

```powershell
Set-Mailbox -Identity $TargetMailbox -AcceptMessagesOnlyFromSendersOrMembers $null
```

### 4.2 Verificar que la restricción se haya eliminado

```powershell
Get-Mailbox -Identity $TargetMailbox | Select-Object AcceptMessagesOnlyFromSendersOrMembers
# Debe mostrar: AcceptMessagesOnlyFromSendersOrMembers : {}
```

### 4.3 Eliminar todos los contactos creados

```powershell
Get-MailContact | Where-Object {$_.Name -like "*_ext_contact"} | Remove-MailContact -Confirm:$false
```

### 4.4 Eliminar un contacto específico

```powershell
Remove-MailContact -Identity "nombre_del_contacto_ext" -Confirm:$false
```

### 4.5 Verificar contactos creados

```powershell
Get-MailContact | Where-Object {$_.Name -like "*_ext_contact"} | Select-Object Name, PrimarySmtpAddress
# Debe mostrar una lista de contactos creados con el sufijo "_ext_contact"
```

---

## 🔧 PASO 5: Solución de Problemas Técnicos

### 5.1 Problemas identificados y solucionados

Durante el desarrollo e implementación del sistema, se identificaron varios problemas críticos que impedían el funcionamiento correcto. A continuación se documentan los problemas y sus soluciones:

#### **Problema 1: Módulo ExchangeOnlineManagement no disponible** ⚠️

**Síntoma:**

```
No se pudo importar el módulo ExchangeOnlineManagement
```

**Causa:**
El módulo ExchangeOnlineManagement no estaba instalado en las versiones de PowerShell utilizadas.

**Solución implementada:**

```powershell
# Para PowerShell 7 (usuario actual)
pwsh.exe -Command "Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser"

# Para Windows PowerShell 5.1 (usuario actual)
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope CurrentUser"

# Para Windows PowerShell 5.1 (todos los usuarios - requiere privilegios de administrador)
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber -Scope AllUsers"
```

**Verificación:**

```powershell
# PowerShell 7
pwsh.exe -Command "Get-Module -ListAvailable -Name ExchangeOnlineManagement"

# Windows PowerShell 5.1
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Get-Module -ListAvailable -Name ExchangeOnlineManagement"
```

#### **Problema 2: Error de formato de parámetros de array** ⚠️

**Síntoma:**

```
La dirección de correo electrónico externa @(email1@example.com,email2@example.com) no es una dirección de correo electrónico SMTP
```

**Causa:**
Node.js enviaba los emails como sintaxis de array de PowerShell `@("email1","email2")`, pero PowerShell lo interpretaba como una cadena literal en lugar de un array.

**Solución implementada:**

**Antes (❌ Incorrecto):**

```typescript
// Node.js generaba
const sendersParam = validEmails.map((email) => `"${email}"`).join(",");
const command = `powershell.exe -AllowedSenders @(${sendersParam})`;
// Resultado: -AllowedSenders @("email1","email2")
```

**Después (✅ Correcto):**

```typescript
// Node.js ahora genera
const sendersParam = validEmails.join(",");
const command = `powershell.exe -AllowedSendersString "${sendersParam}"`;
// Resultado: -AllowedSendersString "email1,email2"
```

**Script PowerShell actualizado:**

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$AllowedSendersString  # Cambiado de [string[]] a [string]
)

# Conversión manual en el script
$AllowedSenders = $AllowedSendersString -split ',' | ForEach-Object { $_.Trim().Trim('"') }
```

#### **Problema 3: Falta de estrategia de fallback entre versiones de PowerShell** ⚠️

**Síntoma:**
Fallos intermitentes dependiendo de la versión de PowerShell disponible o problemas de codificación.

**Solución implementada:**

```typescript
// Estrategia dual con fallback automático
let result;
let lastError;

// Intentar primero con Windows PowerShell 5.1
try {
  console.log("Intentando con Windows PowerShell 5.1...");
  result = await execAsync(winPSCommand, {
    encoding: "utf8",
    timeout: 300000,
    env: { ...process.env, POWERSHELL_TELEMETRY_OPTOUT: "1" },
  });
} catch (error) {
  console.warn("Windows PowerShell 5.1 falló:", error.message);
  lastError = error;

  // Si falla, intentar con PowerShell 7
  try {
    console.log("Intentando con PowerShell 7...");
    result = await execAsync(ps7Command, {
      encoding: "utf8",
      timeout: 300000,
      env: { ...process.env, POWERSHELL_TELEMETRY_OPTOUT: "1" },
    });
  } catch (ps7Error) {
    console.error("PowerShell 7 también falló:", ps7Error.message);
    throw lastError; // Lanzar el error original
  }
}
```

#### **Problema 4: Problemas de codificación de caracteres** ⚠️

**Síntoma:**

```
No se pudo importar el m��dulo ExchangeOnlineManagement
```

**Causa:**
Problemas de codificación UTF-8 al ejecutar PowerShell desde Node.js.

**Solución implementada:**

```typescript
// Configuración de codificación y variables de entorno
const options = {
  encoding: "utf8" as const,
  timeout: 300000,
  env: {
    ...process.env,
    POWERSHELL_TELEMETRY_OPTOUT: "1", // Reduce ruido en salida
  },
};
```

### 5.2 Estado actual del sistema

**✅ Funcionando correctamente:**

- PowerShell 7: Totalmente funcional
- Service Principal: Autenticación OAuth2 exitosa
- Creación de contactos: Automática y funcional
- Configuración de buzón: Restricciones aplicadas correctamente
- Fallback automático: PowerShell 7 como respaldo

**⚠️ Problema conocido (no crítico):**

- Windows PowerShell 5.1: Problema de codificación desde Node.js
- **Impacto**: Mínimo, el fallback a PowerShell 7 funciona automáticamente

### 5.3 Script de diagnóstico

Para diagnosticar problemas en el entorno, utiliza:

```powershell
# Ejecutar diagnóstico completo
pwsh.exe -ExecutionPolicy Bypass -File ".\scripts\diagnose-powershell.ps1"
```

Este script verifica:

- Versiones de PowerShell disponibles
- Estado del módulo ExchangeOnlineManagement
- Políticas de ejecución
- Conectividad a Microsoft Online
- Repositorios de PowerShell

### 5.4 Elementos críticos para el funcionamiento

**Orden de importancia para que el sistema funcione:**

1. **🚨 CRÍTICO**: Instalación del módulo ExchangeOnlineManagement
   - Sin esto, el script no puede conectarse a Exchange Online
2. **🔧 IMPORTANTE**: Formato correcto de parámetros de email
   - Evita errores de interpretación de arrays en PowerShell
3. **🛡️ RECOMENDADO**: Estrategia de fallback entre versiones
   - Garantiza robustez del sistema
4. **⚙️ CONFIGURACIÓN**: Service Principal correctamente configurado
   - Permisos API y roles Exchange asignados

**El sistema actual es robusto y maneja automáticamente los problemas de compatibilidad entre versiones de PowerShell.**
