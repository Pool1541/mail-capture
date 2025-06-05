# === PARÁMETROS PERSONALIZABLES ===
$adminUser = "imbox@domain.onmicrosoft.com"  # Tu cuenta de administrador de Microsoft 365
$targetMailbox = "imbox@domain.onmicrosoft.com"  # Buzón que quieres proteger
$allowedSenders = @(
    "email@hotmail.com",
    "email2@outlook.com",
    "email3@gmail.com"
)

# === CONECTARSE A EXCHANGE ONLINE ===
Write-Host "Conectando a Exchange Online..." -ForegroundColor Cyan
Connect-ExchangeOnline -UserPrincipalName $adminUser -Device

# === CREAR CONTACTOS SI NO EXISTEN ===
$contactNames = @()

foreach ($email in $allowedSenders) {
    $contactName = $email.Split("@")[0] + "_ext_contact"
    $existing = Get-MailContact -Filter "ExternalEmailAddress -eq 'smtp:$email'" -ErrorAction SilentlyContinue

    if (-not $existing) {
        Write-Host "Creando contacto para $email..." -ForegroundColor Yellow
        New-MailContact -Name $contactName -ExternalEmailAddress $email | Out-Null
    } else {
        Write-Host "El contacto para $email ya existe. Usando $($existing.Name)" -ForegroundColor Green
        $contactName = $existing.Name
    }

    $contactNames += $contactName
}

# === RESTRINGIR ENVÍOS AL BUZÓN SOLO DESDE ESTOS CONTACTOS ===
Write-Host "Aplicando restricciones al buzón $targetMailbox..." -ForegroundColor Cyan
Set-Mailbox -Identity $targetMailbox -AcceptMessagesOnlyFromSendersOrMembers $contactNames

Write-Host "`n✅ ¡Listo! El buzón solo aceptará correos de:" -ForegroundColor Green
$allowedSenders | ForEach-Object { Write-Host "   - $_" }