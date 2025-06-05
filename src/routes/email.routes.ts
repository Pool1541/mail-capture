import { Router } from "express";
import { EmailController } from "../controllers/EmailController";

const router = Router();
const emailController = new EmailController();

// Ruta para inicializar la sesión con Outlook
router.get("/init-session", (req, res) => emailController.initialize(req, res));
router.get("/emails", (req, res) => emailController.getEmails(req, res));

export default router;
