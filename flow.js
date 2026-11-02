import fs from "fs";
import puppeteer from "puppeteer";
import { startFlow } from "lighthouse";

const BASE_URL = "https://www.wikipedia.org";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());
  page.setDefaultTimeout(15000);

  const flow = await startFlow(page, {
    name: "Wikipedia Audit Example",
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle0" });
  await flow.snapshot({ stepName: "Page loaded" });

  await page.waitForSelector("#searchInput");
  await page.click("#searchInput");
  await page.keyboard.type("Hello world program", { delay: 40 });
  await flow.snapshot({ stepName: "Typed query" });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.keyboard.press("Enter"),
  ]);
  await flow.snapshot({ stepName: "Search results or article loaded" });

  await page.evaluate(() => {
    window.scrollBy(0, Math.floor(window.innerHeight * 1.5));
  });
  await sleep(800);
  await page.evaluate(() => {
    window.scrollBy(0, Math.floor(window.innerHeight * 1.5));
  });
  await sleep(800);
  await flow.snapshot({ stepName: "Scrolled page" });

  const reportHtml = await flow.generateReport();
  fs.writeFileSync("flow.report.html", reportHtml);
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
