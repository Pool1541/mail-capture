/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { mkdir } from "node:fs/promises";
import { resolve } from "path";
import { chromium, Page } from "playwright";
import * as readline from "readline";

const WAIT_FOR_SELECTOR_IN_MS = 5000;
const WAIT_FOR_ACTION_IN_MS = 3000;
const EMAIL = process.env.SCRAPER_EMAIL ?? "";
const PASSWORD = process.env.SCRAPER_PASSWORD ?? "";

export default async function run({ subject, sender }: { subject: string; sender: string }) {
  const browser = await chromium.launchPersistentContext("./user-data", { headless: false, locale: "es-ES" });

  const mainPage = await browser.newPage();
  await mainPage.setViewportSize({ width: 1440, height: 800 });
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

  console.log("Verificando estado de sesión...");

  // Detectar si hay una sesión abierta o es la vista de login
  await signIn(mainPage);

  // Esperar a que la página rediriga al inbox o nuevamente a la página de login
  // await inboxPage.waitForSelector(`:has-text("${EMAIL}")`, { timeout: 30000 });
  // await inboxPage.locator(`[data-test-id="${EMAIL}"]`).click();

  await mainPage.waitForSelector('[data-app-section="MessageList"]', { timeout: 30000 });
  console.log("📨 Bandeja de entrada cargada correctamente.");

  // Buscar mensaje por el asunto
  let subjectToFind = subject;
  // Recordanto el subject a 28 caracteres por si hay recorte en la vista previa
  subjectToFind = subjectToFind.slice(0, 28);
  const senderToFind = sender;
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
  await mainPage.waitForSelector(emailSelector, { timeout: 0 });

  // Solo hacer click en el primer resultado que coincida
  await mainPage.locator(emailSelector).first().click();
  console.log(`🔍 Mensaje con asunto "${subjectToFind}" encontrado y abierto.`);

  // Limpiar el cuadro de búsqueda
  await mainPage.fill(searchBoxSelector, "");
  await mainPage.keyboard.press("Enter");

  // Sector para extraer el contenido del email
  const emailContentSelector = 'div[id="UniqueMessageBody_1"]';
  await mainPage.waitForSelector(emailContentSelector, { timeout: 30000 });
  // Extrae el contenido HTML del email incluyendo el div con el selector
  const emailContent = await mainPage.locator(emailContentSelector).evaluate((el) => el.outerHTML);
  console.log("📧 Contenido del mensaje extraído:");

  // Abre una pestaña en blanco con medidas 768 de ancho para mostrar el contenido del email
  const contentPage = await browser.newPage();
  await contentPage.setViewportSize({ width: 768, height: 1024 });
  await contentPage.setContent(emailContent);
  await contentPage.addStyleTag({ content: `body { margin: 0; } ::-webkit-scrollbar { display: none; }` });

  // Esperar a que el contenido se renderice completamente con un pequeño retraso
  await contentPage.waitForTimeout(3000);

  await mkdir("./tmp", { recursive: true });

  const screenshotPath = resolve("./tmp", `screenshot_${Date.now().toString()}.png`);

  // Debe tomar una captura de pantalla del contenido del email
  await contentPage.screenshot({ path: screenshotPath, fullPage: true, omitBackground: true });
  console.log(`📸 Captura de pantalla del contenido del mensaje guardada como ${screenshotPath}`);
  // cerrar el navegador
  await browser.close();
  console.log("✅ Proceso completado.");
  return screenshotPath;
}

async function requestTwoFactorCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code: string = await new Promise((resolve) => {
    rl.question("Ingresa el código 2FA: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  return code;
}

async function signIn(page: Page) {
  let isSignedIn = false;
  while (!isSignedIn) {
    await signInSteps(page);
    // Esperar un momento para que la página procese el paso
    await page.waitForTimeout(2000);

    const url = new URL(page.url());
    const path = url.pathname;

    if (path.includes("/mail/0")) {
      isSignedIn = true;
      console.log("✅ Inicio de sesión completado.");
    }
  }
}

/**
 * Esta función tiene un switch de pasos para manejar diferentes partes del flujo de autenticación.
 * Esta función se llama repetidamente hasta que se completa el proceso de inicio de sesión.
 * @param page La página de Playwright donde se realiza el inicio de sesión.
 * @return void
 * @example
 * await signInSteps(page); // Llama a la función para manejar los pasos de inicio de sesión
 */
async function signInSteps(page: Page) {
  const errorBlock = page.locator('div[id="debugDetailsBanner"]');
  if (await errorBlock.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("❌ Error en el inicio de sesión. Reiniciando el proceso...");
    await goToHomePage(page);
    return;
  }

  const loginButton = page.locator('a[id="c-shellmenu_custom_outline_signin_bhvr100_right"]:has-text("Iniciar sesión")');
  if (await loginButton.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Abriendo página de inicio de sesión");
    await loginButton.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }

  const accountSelector = page.getByText("Selección de la cuenta");
  if (await accountSelector.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Cuenta guardada");
    const emailAccountButton = page.locator(`[data-test-id="${EMAIL}"]`);
    await emailAccountButton.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }

  const emailStep = page.locator('input[type="email"]');
  if (await emailStep.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Email");
    await emailStep.fill(EMAIL);
    const nextButton = page.locator('input[type="submit"][value="Siguiente"]');
    await nextButton.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }

  const passwordStep = page.locator('input[type="password"][name="passwd"][placeholder="Contraseña"]');
  if (await passwordStep.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Contraseña");
    await passwordStep.fill(PASSWORD);
    const signInButton = page.locator('input[type="submit"][value="Iniciar sesión"]');
    await signInButton.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }

  const otpAlertTimeout = page.locator('div[class*="alert-error"]');
  if (await otpAlertTimeout.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Código 2FA incorrecto o expirado. Intentar de nuevo.");
    await goToHomePage(page);
    return;
  }

  const otcStep = page.locator('input[name="otc"]');
  if (await otcStep.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("OTP");
    const initCount = Date.now();
    const code = await requestTwoFactorCode();
    const finishCount = Date.now();
    const elapsedSeconds = (finishCount - initCount) / 1000;
    if (elapsedSeconds > 120) {
      console.log("El código 2FA ha expirado. Intentar de nuevo.");
      await goToHomePage(page);
      return;
    }
    await otcStep.fill(code, { timeout: WAIT_FOR_ACTION_IN_MS });
    const verifyButton = page.locator('input[type="submit"][value="Comprobar"]');
    await verifyButton.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }

  const staySignedInStep = page.locator('input[type="submit"][data-report-event="Signin_Submit"][value="Sí"]');
  if (await staySignedInStep.isVisible({ timeout: WAIT_FOR_SELECTOR_IN_MS })) {
    console.log("Mantener sesión iniciada");
    await staySignedInStep.click({ timeout: WAIT_FOR_ACTION_IN_MS });
    return;
  }
}

async function goToHomePage(page: Page) {
  console.log("Navegando a la página principal...");
  await page.goto("https://outlook.live.com/mail/", { waitUntil: "domcontentloaded" });
}

// if (process.argv[1] === import.meta.filename) {
//   run({}).catch((err: unknown) => {
//     console.error("❌ Error:", err);
//     process.exit(1);
//   });
// }

// run({ sender: "novedades@scotiabank.com.pe", subject: "TEST MAIL CASHBACK" }).catch((err: unknown) => {
//   console.error("❌ Error:", err);
//   process.exit(1);
// });
