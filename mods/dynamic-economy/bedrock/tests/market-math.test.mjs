import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
const CONFIG = Object.freeze({
  growthFactor: 1.01,
  scoreChangePerItem: 1,
  minimumPriceCents: 1,
  maximumSafeCents: Number.MAX_SAFE_INTEGER,
  salesTaxRate: 0.10
});
const TAX_REMAINDER_DENOMINATOR = 10000;

function extract(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing source function: ${startMarker}`);
  assert.notEqual(end, -1, `Missing end marker after ${startMarker}`);
  return source.slice(start, end);
}

// Execute the production math functions directly with only their Bedrock-world
// dependency (the tax remainder getter) supplied by this small test harness.
const safeInteger = value => Number.isSafeInteger(value) && Math.abs(value) <= CONFIG.maximumSafeCents;
const unitPriceCents = new Function(
  "CONFIG",
  "safeInteger",
  extract("function unitPriceCents(", "function itemType") + "\nreturn unitPriceCents;"
)(CONFIG, safeInteger);
const totalBuyCost = new Function(
  "CONFIG",
  "safeInteger",
  "unitPriceCents",
  extract("function totalBuyCost(", "function totalSaleProceeds") + "\nreturn totalBuyCost;"
)(CONFIG, safeInteger, unitPriceCents);
const taxRateUnits = new Function(
  "CONFIG",
  "TAX_REMAINDER_DENOMINATOR",
  extract("function taxRateUnits()", "function taxPercentLabel") + "\nreturn taxRateUnits;"
)(CONFIG, TAX_REMAINDER_DENOMINATOR);
const totalSaleProceeds = new Function(
  "CONFIG",
  "safeInteger",
  "unitPriceCents",
  "getTaxRemainder",
  "taxRateUnits",
  "TAX_REMAINDER_DENOMINATOR",
  extract("function totalSaleProceeds(", "function parseQuantity") + "\nreturn totalSaleProceeds;"
)(
  CONFIG,
  safeInteger,
  unitPriceCents,
  () => 0,
  taxRateUnits,
  TAX_REMAINDER_DENOMINATOR
);

test("a sale uses the post-sale score and buying uses the pre-purchase score", () => {
  assert.equal(unitPriceCents(0), 100);
  assert.equal(totalBuyCost(0, 2), 201);
  const sale = totalSaleProceeds(1, 1, 0);
  assert.equal(sale.gross, 100);
  assert.equal(sale.tax, 10);
  assert.equal(sale.net, 90);
});

test("splitting a sale preserves its gross, tax, net, and final rounding remainder", () => {
  const startingScore = 12;
  const whole = totalSaleProceeds(startingScore, 64, 0);
  let score = startingScore;
  let remainder = 0;
  let gross = 0;
  let tax = 0;
  let net = 0;

  for (const quantity of [1, 7, 2, 15, 39]) {
    const part = totalSaleProceeds(score, quantity, remainder);
    gross += part.gross;
    tax += part.tax;
    net += part.net;
    remainder = part.taxRemainderAfter;
    score -= quantity * CONFIG.scoreChangePerItem;
  }

  assert.equal(gross, whole.gross);
  assert.equal(tax, whole.tax);
  assert.equal(net, whole.net);
  assert.equal(remainder, whole.taxRemainderAfter);
});

test("fractional tax does not disappear when items remain at the one-cent price floor", () => {
  const whole = totalSaleProceeds(-2000, 64, 0);
  let remainder = 0;
  let tax = 0;
  for (let i = 0; i < 64; i++) {
    const part = totalSaleProceeds(-2000 - i, 1, remainder);
    tax += part.tax;
    remainder = part.taxRemainderAfter;
  }
  assert.equal(whole.gross, 64);
  assert.equal(tax, whole.tax);
  assert.equal(remainder, whole.taxRemainderAfter);
});
