import assert from "node:assert/strict";
import { env } from "../src/config/env.js";
import { pool } from "../src/config/db.js";

const origin = `http://127.0.0.1:${env.PORT}`;
const timestamp = Date.now();
const testEmail = `visual-check-${timestamp}@test.local`;
const testDocument = `VISUAL-${timestamp}`;
const pages = [
  ["/", 200],
  ["/login", 200],
  ["/register", 200],
  ["/dashboard", 302],
  ["/clients", 302],
  ["/users", 302],
  ["/requests", 302],
  ["/portal", 302],
  ["/visual-check-not-found", 404],
];
const allHtml = [];

class BrowserSession {
  cookie = "";

  async request(path, method = "GET", data = {}) {
    const headers = this.cookie ? { cookie: this.cookie } : {};
    let body;
    if (method === "POST") {
      headers["content-type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(data).toString();
    }
    const response = await fetch(new URL(path, origin), {
      method,
      headers,
      body,
      redirect: "manual",
    });
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length) this.cookie = cookies.at(-1).split(";")[0];
    return response;
  }

  async token(path) {
    const response = await this.request(path);
    const html = await response.text();
    assert.equal(response.status, 200, `GET ${path} must return 200 to collect CSRF`);
    const token = html.match(/name="_csrf" value="([^"]+)"/)?.[1];
    assert.ok(token, `${path} must contain a CSRF token`);
    return token;
  }
}

async function checkPages(label, browser, expected, authenticatedRole = null) {
  for (const [path, status] of pages) {
    const response = await browser.request(path);
    const actualStatus = response.status;
    assert.equal(response.status, expected[path] ?? status, `${label} ${path}`);
    const html = await response.text();
    allHtml.push(html);
    if (path === "/") {
      assert.match(html, /class="hero-section"/);
      assert.match(html, /id="productTabs"/);
    }
    if (path === "/login" && actualStatus === 200) assert.match(html, /name="password"/);
    if (path === "/register" && actualStatus === 200 && label === "visitor") {
      assert.match(html, /name="password_confirmation"/);
    }
    if (path === "/visual-check-not-found") assert.match(html, /friendly-error/);
    if (authenticatedRole === "CLIENT" && path === "/portal") {
      assert.match(html, /class="app-sidebar"/);
      assert.match(html, /Portal/);
      assert.doesNotMatch(html, />Clientes</);
      assert.doesNotMatch(html, />Utilizadores</);
    }
    if (authenticatedRole === "ADMIN" && path === "/dashboard") {
      assert.match(html, /class="app-sidebar"/);
      assert.match(html, /Verificações pendentes/);
    }
  }
}

async function checkAssets(htmlPages) {
  const assetUrls = new Set();
  for (const html of htmlPages) {
    for (const match of html.matchAll(/<(?:link|script|img)\b[^>]*(?:href|src)="([^"]+)"[^>]*>/g)) {
      const url = new URL(match[1], origin);
      if (url.origin === origin && /\.(?:css|js|svg)$/.test(url.pathname)) assetUrls.add(url.href);
    }
  }

  const checked = new Set();
  const check = async (url) => {
    if (checked.has(url)) return;
    checked.add(url);
    const response = await fetch(url);
    assert.equal(response.status, 200, `static asset ${url}`);
    if (url.endsWith(".css")) {
      const css = await response.text();
      for (const match of css.matchAll(/url\((?:'|")?([^)'"]+)(?:'|")?\)/g)) {
        const target = new URL(match[1], url);
        if (target.origin === origin) await check(target.href);
      }
    }
  };
  await Promise.all([...assetUrls].map(check));
  console.log(`Static assets verified: ${checked.size} CSS, JS, SVG, font and icon URLs returned HTTP 200.`);
}

let registeredUserId;
try {
  const visitor = new BrowserSession();
  const visitorExpected = Object.fromEntries(pages.map(([path, status]) => [path, status]));
  await checkPages("visitor", visitor, visitorExpected);

  const staff = new BrowserSession();
  let token = await staff.token("/login");
  let response = await staff.request("/login", "POST", {
    _csrf: token,
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });
  assert.equal(response.status, 302, "admin login");
  const staffExpected = {
    "/": 302,
    "/login": 302,
    "/register": 200,
    "/dashboard": 200,
    "/clients": 200,
    "/users": 200,
    "/requests": 200,
    "/portal": 403,
    "/visual-check-not-found": 404,
  };
  await checkPages("admin", staff, staffExpected, "ADMIN");

  const client = new BrowserSession();
  token = await client.token("/register");
  response = await client.request("/register", "POST", {
    _csrf: token,
    full_name: "Verificação visual temporária",
    email: testEmail,
    phone: "",
    document_type: "TESTE",
    document_number: testDocument,
    address: "",
    occupation: "",
    monthly_income: "",
    password: "VisualCheckPass123",
    password_confirmation: "VisualCheckPass123",
  });
  assert.equal(response.status, 302, "temporary client registration");
  const clientExpected = {
    "/": 302,
    "/login": 302,
    "/register": 200,
    "/dashboard": 403,
    "/clients": 403,
    "/users": 403,
    "/requests": 403,
    "/portal": 200,
    "/visual-check-not-found": 404,
  };
  await checkPages("client", client, clientExpected, "CLIENT");

  await checkAssets(allHtml);
  console.log("Visitor, ADMIN and CLIENT page status checks passed for home, login, register, dashboard, clients, users, requests, portal and 404.");
} finally {
  const [rows] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [testEmail]);
  registeredUserId = rows[0]?.id;
  if (registeredUserId) {
    await pool.execute("DELETE FROM clients WHERE user_id = ?", [registeredUserId]);
    await pool.execute("UPDATE users SET is_active = FALSE WHERE id = ?", [registeredUserId]);
  }
  await pool.end();
}
