import { EmailService } from "@/shared/domain/contracts/email-service";

export class SendWelcomeEmail {
  constructor(private readonly emailService: EmailService) {}

  public async execute(userEmail: string, username: string) {
    await this.emailService.send({
      to: [userEmail],
      subject: "Bienvenido a Mail Capture",
      html: `<p>Hola, ${username}</p><p>Tu acceso de correo ha sido configurado correctamente.</p><p>Saludos,</p><p>Equipo de Mail Capture</p>`,
    });
  }
}
