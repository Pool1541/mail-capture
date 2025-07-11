import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

class ConfigureMailContacts {
  public async execute(): Promise<void> {
    const newEmail = "test_1@hotmail.com";
    try {
      const targetMailbox = process.env.TARGET_MAILBOX;
      const tenantId = process.env.TENANT_ID;
      const clientSecret = process.env.CLIENT_SECRET;
      const appId = process.env.APP_ID;

      // Validar que las variables de entorno requeridas estén presentes
      if (!targetMailbox || !tenantId || !clientSecret || !appId) {
        throw new Error("Missing required environment variables: TARGET_MAILBOX, TENANT_ID, CLIENT_SECRET, APP_ID");
      }

      // Obtener todos los usuarios existentes de la base de datos
      const existingEmails = ["test_2@hotmail.com", "test_3@hotmail.com", "test_4@hotmail.com"];
      const allEmails = [...existingEmails, newEmail];

      // Validar que los emails sean válidos para Exchange Online
      const validEmails = allEmails.filter((email) => {
        // Verificar formato básico de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          console.warn(`Email inválido ignorado: ${email}`);
          return false;
        }

        // Verificar que no tenga caracteres problemáticos para PowerShell
        if (email.includes("'") || email.includes("`") || email.includes("$")) {
          console.warn(`Email con caracteres problemáticos ignorado: ${email}`);
          return false;
        }

        return true;
      });

      // Si no hay emails válidos para configurar, salir
      if (validEmails.length === 0) {
        console.log("No hay emails válidos para configurar en el buzón");
        return;
      }

      // Construir la ruta al script
      console.log("Ejecutando desde ruta:", process.cwd());
      const scriptPath = path.join(process.cwd(), "scripts", "config-mail-contacts.ps1");

      // Determinar el comando de PowerShell 7 según la plataforma
      const isWindows = process.platform === "win32";
      const pwshCommand = isWindows ? "pwsh.exe" : "pwsh";

      const sendersParam = validEmails.join(",");

      // Solo PowerShell 7
      const ps7Command = `${pwshCommand} -ExecutionPolicy Bypass -File "${scriptPath}" -TargetMailbox "${targetMailbox}" -AllowedSendersString "${sendersParam}" -AppId "${appId}" -TenantId "${tenantId}" -ClientSecret "${clientSecret}"`;

      console.log(`Configurando acceso al buzón para ${validEmails.length.toString()} usuarios...`);
      console.log(`Emails a configurar: ${validEmails.join(", ")}`);
      console.log("Ejecutando con PowerShell 7...");

      try {
        const result = await execAsync(ps7Command, {
          encoding: "utf8",
          timeout: 300000, // 5 minutos timeout
          env: { ...process.env, POWERSHELL_TELEMETRY_OPTOUT: "1" },
        });

        const { stdout, stderr } = result;

        if (stderr) {
          console.error("Error en script PowerShell:", stderr);
          throw new Error(`Error ejecutando script PowerShell: ${stderr}`);
        }

        if (stdout) {
          console.log("Salida del script PowerShell:", stdout);
        }

        console.log(`✅ Configuración de buzón completada para ${validEmails.length.toString()} usuarios`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("PowerShell 7 falló:", errorMessage);
        throw new Error(`Error ejecutando PowerShell 7: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error configurando contactos de correo:", error);
      throw error;
    }
  }
}

const configureMailContacts = new ConfigureMailContacts();

configureMailContacts.execute().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error("Error executing configureMailContacts:", error.message);
  }
});
