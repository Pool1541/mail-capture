# EMAIL CAPTURE

## Configuración inicial del proyecto

### Instalación de PowerShell y Exchange Online Management en Ubuntu (Linux)

- Es necesario instalar PowerShell y el módulo de exchange online en Ubuntu antes de ejecutar el script que registra los correos electrónicos en la whitelist de Exchange Online.

```bash
# Actualiza repositorios e instala requerimientos
sudo apt update
sudo apt install -y wget apt-transport-https software-properties-common

# Importa el repositorio de Microsoft
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update

# Instala PowerShell
sudo apt install -y powershell

# Verificar instalación e iniciar PowerShell
pwsh

# Instalar el módulo de exchange online
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
```

### Ejecutar el script de configuración de contacto

- Configura los datos del script (adminUser, targetMailbox, allowedSenders) para que se ajusten a tus necesidades.

- Ejecuta el script en PowerShell:

```powershell
# Iniciar PowerShell si no está ya en ejecución
pwsh

# Ejecuta el script
./scripts/config-mail-contacts.ps1

# Puedes verificar los mensajes de éxito en la consola misntras se ejecuta el script.
```

- Verifica los contactos creados

```powershell
Get-Mailbox mailcapture@imboxmcapturehotmail.onmicrosoft.com | Select-Object AcceptMessagesOnlyFromSendersOrMembers
```
