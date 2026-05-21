#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createFakeElement(selector, options = {}) {
  const classes = new Set();

  return {
    selector,
    attributes: {},
    dataset: options.dataset || {},
    disabled: false,
    files: [],
    innerHTML: "",
    listeners: {},
    style: {},
    textContent: "",
    value: "",
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      toggle(name, force) {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    append() {},
    click() {
      this.listeners.click?.({ target: this });
    },
    remove() {},
    select() {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
  };
}

function loadPageScript() {
  const htmlPath = path.join(__dirname, "..", "docs", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const cssHref = html.match(/<link\s+rel="stylesheet"\s+href="\.\/styles\.css"\s*\/?>/);
  const scriptSrc = html.match(/<script\s+src="\.\/app\.js"><\/script>/);

  assert.ok(cssHref, "expected docs/index.html to reference ./styles.css");
  assert.ok(scriptSrc, "expected docs/index.html to reference ./app.js");

  const scriptPath = path.join(__dirname, "..", "docs", "app.js");
  const script = fs.readFileSync(scriptPath, "utf8");

  const elements = new Map();
  const formatButtons = ["sub2api", "cpa", "cpa2sub2api"].map((format) =>
    createFakeElement(`[data-format="${format}"]`, { dataset: { format } })
  );

  const document = {
    body: createFakeElement("body"),
    createElement(selector) {
      return createFakeElement(selector);
    },
    execCommand() {
      return true;
    },
    querySelector(selector) {
      if (!elements.has(selector)) {
        elements.set(selector, createFakeElement(selector));
      }
      return elements.get(selector);
    },
    querySelectorAll(selector) {
      return selector === "[data-format]" ? formatButtons : [];
    },
  };

  const context = {
    TextDecoder,
    TextEncoder,
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    atob,
    btoa,
    clearTimeout,
    console,
    document,
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
    setTimeout,
  };

  vm.runInNewContext(script, context, { filename: "docs/app.js" });

  return { elements, formatButtons };
}

function dispatch(element, type) {
  assert.equal(typeof element.listeners[type], "function", `missing ${type} listener on ${element.selector}`);
  element.listeners[type]({ target: element });
}

function testSyntheticIdTokenHasCodexParseableJwtFormat() {
  const { elements, formatButtons } = loadPageScript();
  const cpaButton = formatButtons.find((button) => button.dataset.format === "cpa");
  const input = elements.get("#session-input");
  const output = elements.get("#output");

  dispatch(cpaButton, "click");
  input.value = JSON.stringify({
    user: {
      id: "user-test",
      email: "mark@example.com",
    },
    expires: "2026-08-06T14:29:36.155Z",
    account: {
      id: "00000000-0000-4000-9000-000000000000",
      planType: "plus",
    },
    accessToken: "access-token",
    sessionToken: "session-token",
  });
  dispatch(input, "input");

  const cpa = JSON.parse(output.value);
  const parts = cpa.id_token.split(".");

  assert.equal(cpa.id_token_synthetic, true);
  assert.equal(parts.length, 3);
  assert.ok(
    parts.every((part) => part.length > 0),
    "synthetic id_token must use non-empty header, payload, and signature segments"
  );

  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  assert.equal(payload.email, "mark@example.com");
  assert.equal(payload["https://api.openai.com/auth"].chatgpt_account_id, "00000000-0000-4000-9000-000000000000");
}

/*
function testAxonHubAuthJsonUsesPlaceholderRefreshTokenWhenMissing() {
  const { elements, formatButtons } = loadPageScript();
  const axonHubButton = formatButtons.find((button) => button.dataset.format === "axonhub");
  const input = elements.get("#session-input");
  const output = elements.get("#output");

  dispatch(axonHubButton, "click");
  input.value = JSON.stringify({
    user: {
      id: "user-test",
      email: "mark@example.com",
    },
    expires: "2026-08-06T14:29:36.155Z",
    account: {
      id: "00000000-0000-4000-9000-000000000000",
      planType: "plus",
    },
    accessToken: "access-token",
    sessionToken: "session-token",
  });
  dispatch(input, "input");

  const authJson = JSON.parse(output.value);

  assert.equal(authJson.auth_mode, "chatgpt");
  assert.equal(authJson.tokens.access_token, "access-token");
  assert.equal(authJson.tokens.refresh_token, "__missing_refresh_token__");
  assert.equal(authJson.tokens.id_token.split(".").length, 3);
  assert.equal(authJson.last_refresh, "2026-08-06T13:29:36.155Z");
  assert.equal(authJson.axonhub_refresh_token_placeholder, true);
  assert.equal(authJson.axonhub_note, "refresh_token is a placeholder; access_token works only until it expires.");
}

function testAxonHubAuthJsonPreservesRealRefreshToken() {
  const { elements, formatButtons } = loadPageScript();
  const axonHubButton = formatButtons.find((button) => button.dataset.format === "axonhub");
  const input = elements.get("#session-input");
  const output = elements.get("#output");

  dispatch(axonHubButton, "click");
  input.value = JSON.stringify({
    user: {
      email: "mark@example.com",
    },
    expires: "2026-08-06T14:29:36.155Z",
    account: {
      id: "00000000-0000-4000-9000-000000000000",
      planType: "plus",
    },
    accessToken: "access-token",
    refreshToken: "real-refresh-token",
    idToken: "real.header.signature",
  });
  dispatch(input, "input");

  const authJson = JSON.parse(output.value);

  assert.equal(authJson.tokens.refresh_token, "real-refresh-token");
  assert.equal(authJson.tokens.id_token, "real.header.signature");
  assert.equal(authJson.axonhub_refresh_token_placeholder, undefined);
  assert.equal(authJson.axonhub_note, undefined);
}
*/

function testCpaToSub2apiConvertsSingleCpaRecord() {
  const { elements, formatButtons } = loadPageScript();
  const modeButton = formatButtons.find((button) => button.dataset.format === "cpa2sub2api");
  const input = elements.get("#session-input");
  const output = elements.get("#output");
  const subtitle = elements.get("#output-subtitle");

  dispatch(modeButton, "click");
  input.value = JSON.stringify({
    type: "codex",
    account_id: "00000000-0000-4000-9000-000000000000",
    email: "mark@example.com",
    plan_type: "plus",
    access_token: "cpa-access-token",
    refresh_token: "",
    session_token: "session-token",
    last_refresh: "2026-05-21T08:00:00.000Z",
    expired: "2026-08-06T14:29:36.155Z",
  });
  dispatch(input, "input");

  const converted = JSON.parse(output.value);

  assert.equal(subtitle.textContent, "当前输出为 CPA 转 sub2api 导入 JSON。");
  assert.equal(Array.isArray(converted.accounts), true);
  assert.equal(converted.accounts.length, 1);
  assert.equal(converted.accounts[0].platform, "openai");
  assert.equal(converted.accounts[0].type, "oauth");
  assert.equal(converted.accounts[0].credentials.access_token, "cpa-access-token");
  assert.equal(converted.accounts[0].credentials.chatgpt_account_id, "00000000-0000-4000-9000-000000000000");
  assert.equal(converted.accounts[0].credentials.email, "mark@example.com");
  assert.equal(converted.accounts[0].credentials.plan_type, "plus");
  assert.equal(converted.accounts[0].credentials.expires_at, "2026-08-06T14:29:36.155Z");
  assert.equal(converted.accounts[0].extra.last_refresh, "2026-05-21T08:00:00.000Z");
}

function testCpaToSub2apiSkipsInvalidRecords() {
  const { elements, formatButtons } = loadPageScript();
  const modeButton = formatButtons.find((button) => button.dataset.format === "cpa2sub2api");
  const input = elements.get("#session-input");
  const output = elements.get("#output");
  const issues = elements.get("#issues");
  const inputStatus = elements.get("#input-status");

  dispatch(modeButton, "click");
  input.value = JSON.stringify([
    {
      account_id: "00000000-0000-4000-9000-000000000000",
      email: "valid@example.com",
      access_token: "valid-access-token",
      expired: "2026-08-06T14:29:36.155Z",
    },
    {
      account_id: "11111111-1111-4111-9111-111111111111",
      email: "invalid@example.com",
    },
  ]);
  dispatch(input, "input");

  const converted = JSON.parse(output.value);

  assert.equal(converted.accounts.length, 1);
  assert.match(issues.innerHTML, /缺少 access_token/);
  assert.match(inputStatus.textContent, /跳过 1 项/);
}

testSyntheticIdTokenHasCodexParseableJwtFormat();
// testAxonHubAuthJsonUsesPlaceholderRefreshTokenWhenMissing();
// testAxonHubAuthJsonPreservesRealRefreshToken();
testCpaToSub2apiConvertsSingleCpaRecord();
testCpaToSub2apiSkipsInvalidRecords();
console.log("convert-session tests passed");
