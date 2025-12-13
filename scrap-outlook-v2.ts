/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { chromium } from "playwright";
import * as readline from "readline";

const EMAIL = process.env.SCRAPER_EMAIL ?? "";
const PASSWORD = process.env.SCRAPER_PASSWORD ?? "";

export default async function run({ subject, sender }: { subject?: string; sender?: string }) {
  const browser = await chromium.launchPersistentContext("./user-data", { headless: true, locale: "es-ES" });

  const mainPage = await browser.newPage();
  console.log("🌐 Abriendo outlook.live.com...");
  await mainPage.goto("https://outlook.live.com/mail/", { waitUntil: "domcontentloaded" });

  // Clic en "Iniciar sesión" → abre nueva pestaña
  const loginButtonSelector = 'a[id="c-shellmenu_custom_outline_signin_bhvr100_right"]:has-text("Iniciar sesión")';
  await mainPage.waitForSelector(loginButtonSelector, { timeout: 30000 });

  // const [inboxPage] = await Promise.all([browser.waitForEvent("page"), mainPage.locator(loginButtonSelector).click()]);

  // await inboxPage.bringToFront();
  mainPage.locator(loginButtonSelector).click();
  console.log("🧭 Esperando a que se cargue Outlook en la nueva pestaña...");

  await mainPage.waitForURL((url) => url.href.includes("outlook.live.com/mail") || url.href.includes("login.microsoftonline.com/common"), {
    timeout: 120000,
  });

  console.log("Estás en la página de login!");

  // Detectar si hay una sesión abierta o es la vista de login
  let stillInLoginPage = true;
  await mainPage
    .waitForSelector(`:has-text("${EMAIL}")`, { timeout: 5000 })
    .then(async () => {
      console.log("La sesión está abierta, ingresando");

      while (stillInLoginPage) {
        try {
          await mainPage.waitForSelector(`[data-test-id="${EMAIL}"]`, { timeout: 5000 });
          await mainPage.locator(`[data-test-id="${EMAIL}"]`).click();
          stillInLoginPage = false;
        } catch (error) {
          stillInLoginPage = false;
        }
      }

      console.log('"✅ Sesión iniciada correctamente."');
    })
    .catch(async () => {
      console.log("No hay sesión abierta, iniciando sesión...");

      // toma un screenshot de la página de login para depuración
      await mainPage.screenshot({ path: "login_page.png", fullPage: true });
      await mainPage.waitForSelector('input[type="email"]', { timeout: 30000 });
      await mainPage.fill('input[type="email"]', EMAIL);
      await mainPage.locator('input[type="submit"][value="Siguiente"]').click({ timeout: 1000 });

      await mainPage.waitForSelector('input[type="password"][name="passwd"][placeholder="Contraseña"]', { timeout: 30000 });
      await mainPage.fill('input[type="password"][name="passwd"][placeholder="Contraseña"]', PASSWORD);
      await mainPage.locator('input[type="submit"][value="Iniciar sesión"]').click();

      console.log("Esperando a que el usuario complete el flujo de 2FA...");

      // Esperar a que aparezca el campo de código 2FA
      await mainPage.waitForSelector('input[name="otc"]', { timeout: 5000 });

      // Pedir el código al usuario por consola
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const code: unknown = await new Promise((resolve) => {
        rl.question("Ingresa el código 2FA: ", (answer) => {
          rl.close();
          resolve(answer);
        });
      });

      // Ingresar el código automáticamente
      await mainPage.fill('input[name="otc"]', code as string);
      await mainPage.locator('input[type="submit"][value="Comprobar"]').click();

      // Verifica que la página sea la de 2FA para la intervención manual
      await mainPage.waitForURL((url) => url.href.includes("login.microsoftonline.com/common/login"), {
        timeout: 30000, // Le da 30 segundos para que el usuario complete el flujo de 2FA
      });

      // Aquí seleccionamos que queremos mantener la sesión abierta
      await mainPage.waitForURL((url) => url.href.includes("login.microsoftonline.com/common/SAS/ProcessAuth"), {
        timeout: 30000,
      });

      await mainPage.waitForSelector('input[type="submit"][data-report-event="Signin_Submit"][value="Sí"]', { timeout: 30000 });
      await mainPage.locator('input[type="submit"][data-report-event="Signin_Submit"][value="Sí"]').click();

      console.log('"✅ Sesión iniciada correctamente."');
    });

  // Esperar a que la página rediriga al inbox o nuevamente a la página de login
  // await inboxPage.waitForSelector(`:has-text("${EMAIL}")`, { timeout: 30000 });
  // await inboxPage.locator(`[data-test-id="${EMAIL}"]`).click();

  await mainPage.waitForSelector('[data-app-section="MessageList"]', { timeout: 30000 });
  console.log("📨 Bandeja de entrada cargada correctamente.");

  // Buscar mensaje por el asunto
  let subjectToFind = subject ?? "WOSUB25";
  // Recordanto el subject a 28 caracteres por si hay recorte en la vista previa
  subjectToFind = subjectToFind.slice(0, 28);
  const senderToFind = sender ?? "pool_1541@hotmail.com";
  const searchBoxSelector = 'input[id="topSearchInput"]';

  await mainPage.waitForSelector(searchBoxSelector, { timeout: 30000 });
  await mainPage.fill(searchBoxSelector, `${subjectToFind} ${senderToFind}`);
  await mainPage.keyboard.press("Enter");
  console.log(`🔍 Buscando mensaje con asunto "${subjectToFind}"...`);
  // Esperar a que los resultados de búsqueda se carguen
  await mainPage.waitForSelector('[data-app-section="MessageList"]', { timeout: 30000 });

  // Selector del email con el asunto específico
  const emailSelector = `div[aria-label*="${subjectToFind}"]`;
  // Hacer click en el elemento del email
  await mainPage.waitForSelector(emailSelector, { timeout: 30000 });

  // Solo hacer click en el primer resultado que coincida
  await mainPage.locator(emailSelector).first().click();
  console.log(`🔍 Mensaje con asunto "${subjectToFind}" encontrado y abierto.`);

  // Sector para extraer el contenido del email
  const emailContentSelector = 'div[id="UniqueMessageBody_1"]';
  await mainPage.waitForSelector(emailContentSelector, { timeout: 30000 });
  // Extrae el contenido HTML del email incluyendo el div con el selector
  const emailContent = await mainPage.locator(emailContentSelector).evaluate((el) => el.outerHTML);
  console.log("📧 Contenido del mensaje extraído:");

  // Abre una pestaña en blanco con medidas 768 de ancho para mostrar el contenido del email
  const contentPage = await browser.newPage();
  await contentPage.setViewportSize({ width: 800, height: 1024 });
  await contentPage.setContent(emailContent);

  // Agrega margin: 0 en el body para evitar espacios en blanco alrededor del contenido y remueve scrollbars
  await contentPage.addStyleTag({ content: "body { margin: 0; }" });
  await contentPage.addStyleTag({ content: "::-webkit-scrollbar { display: none; }" });

  // Esperar a que el contenido se renderice completamente con un pequeño retraso
  await contentPage.waitForTimeout(1000);

  // Debe tomar una captura de pantalla del contenido del email
  await contentPage.screenshot({ path: "email_content.png", fullPage: true });
  console.log("📸 Captura de pantalla del contenido del mensaje guardada como email_content.png");

  // cerrar el navegador
  await browser.close();
  console.log("✅ Proceso completado.");
}

// if (process.argv[1] === import.meta.filename) {
//   run({}).catch((err: unknown) => {
//     console.error("❌ Error:", err);
//     process.exit(1);
//   });
// }
