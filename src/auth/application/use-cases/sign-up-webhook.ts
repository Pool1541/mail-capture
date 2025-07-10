/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SendWelcomeEmail } from "./send-welcome-email";
import { RegisterInWhitelist } from "./register-in-whitelist";

export class SignUpWebhook {
  constructor(
    private readonly senderEmail: SendWelcomeEmail,
    private readonly registerInWhitelist: RegisterInWhitelist,
  ) {}

  public async execute(payload: any): Promise<void> {
    await Promise.resolve();
    if (payload.type !== "UPDATE") return;
    const { record, old_record } = payload;
    const userEmail = record.email as string;
    const oldVerified = !old_record.last_sign_in_at;
    const isVerifiedNow = !!record.last_sign_in_at && !!record.raw_user_meta_data.email_verified;

    if (oldVerified && isVerifiedNow) {
      console.log(`${userEmail} is now verified.`);
      await this.configureMailAccess(userEmail);
      await this.senderEmail.execute(userEmail, record.email as string);
    }
  }

  private async configureMailAccess(userEmail: string): Promise<void> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt.toString()} de ${maxRetries.toString()} para configurar acceso de correo para ${userEmail}`);
        await this.registerInWhitelist.execute(userEmail);
        console.log(`✅ Configuración de acceso de correo exitosa para ${userEmail} en el intento ${attempt.toString()}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Intento ${attempt.toString()} falló para ${userEmail}:`, lastError.message);

        if (attempt < maxRetries) {
          const delayMs = 5000;
          console.log(`⏳ Esperando ${(delayMs / 1000).toString()} segundos antes del siguiente intento...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(`🚨 Todos los intentos (${maxRetries.toString()}) fallaron para configurar acceso de correo para ${userEmail}`);
    console.error("Error final:", lastError);
    throw lastError ?? new Error(`Failed to configure mail access for ${userEmail} after ${maxRetries.toString()} attempts`);
  }
}
