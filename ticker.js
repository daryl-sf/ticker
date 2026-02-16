const fs = require("fs");

const stockSymbol = (process.argv[2] || "EQPT").toUpperCase();
const shares = Number(process.argv[3]);
const strikePrice = Number(process.argv[4]);
const refreshMs = Number(process.argv[5]) || 5000;

if (isNaN(shares) || isNaN(strikePrice)) {
  console.log("Usage: node ticker.js [stockSymbol] <numberOfShares> <strikePrice> [refreshMs]");
  process.exit(1);
}

const HISTORY_FILE = `./price-history-${stockSymbol}.json`;
const MAX_POINTS = 30;

let firstRun = true;
let priceHistory = [];

// Load persisted history
if (fs.existsSync(HISTORY_FILE)) {
  try {
    priceHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    priceHistory = [];
  }
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const number = new Intl.NumberFormat("en-US");

const toNumber = (value) =>
  typeof value === "string"
    ? Number(value.replace(/[^0-9.-]+/g, ""))
    : Number(value);

const colorize = (value, formatted) => {
  if (value > 0) return `\x1b[32m${formatted}\x1b[0m`;
  if (value < 0) return `\x1b[31m${formatted}\x1b[0m`;
  return formatted;
};

const sparkline = (data) => {
  if (data.length < 2) return "\n";

  const MAX_LEN = 50;
  const points = data.slice(-MAX_LEN);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // Normalize to 0-7 (8 height levels across 2 rows)
  const normalized = points.map((p) =>
    Math.min(7, Math.floor(((p - min) / range) * 8))
  );

  // Line characters (bottom to top within each cell)
  const lineChars = ["⎽", "⎼", "⎻", "⎺"];

  let topLine = "";
  let bottomLine = "";

  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i];

    let topChar = " ";
    let bottomChar = " ";

    if (h >= 4) {
      topChar = lineChars[h - 4];
    } else {
      bottomChar = lineChars[h];
    }

    // Color based on trend
    if (i > 0) {
      const delta = points[i] - points[i - 1];
      if (delta > 0) {
        if (topChar !== " ") topChar = `\x1b[32m${topChar}\x1b[0m`;
        if (bottomChar !== " ") bottomChar = `\x1b[32m${bottomChar}\x1b[0m`;
      } else if (delta < 0) {
        if (topChar !== " ") topChar = `\x1b[31m${topChar}\x1b[0m`;
        if (bottomChar !== " ") bottomChar = `\x1b[31m${bottomChar}\x1b[0m`;
      }
    }

    topLine += topChar;
    bottomLine += bottomChar;
  }

  // Trend indicator
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  let trend = " ▶";
  if (last > prev) trend = " \x1b[32m▲\x1b[0m";
  else if (last < prev) trend = " \x1b[31m▼\x1b[0m";

  return `${topLine}${trend}\n${bottomLine}`;
};

setInterval(async () => {
  try {
    const response = await fetch(
      `https://api.nasdaq.com/api/quote/${stockSymbol}/info?assetclass=stocks`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();
    const { symbol, primaryData } = data.data;

    const salePrice = toNumber(primaryData.lastSalePrice);
    const netChangePerShare = toNumber(primaryData.netChange);

    priceHistory.push(salePrice);
    if (priceHistory.length > MAX_POINTS) {
      priceHistory.shift();
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(priceHistory));

    const positionValue = salePrice * shares;
    const costBasis = strikePrice * shares;

    const unrealizedPL = positionValue - costBasis;
    const unrealizedPLPct = (unrealizedPL / costBasis) * 100;

    const dailyDollarChange = netChangePerShare * shares;

    if (!firstRun) {
      process.stdout.write("\x1b[19A\x1b[J");
    }
    firstRun = false;

    process.stdout.write("\n📊 EquipmentShare Stock Info (EQPT)\n\n");

    process.stdout.write("— Market ————————————————————————\n");
    process.stdout.write(`Symbol:             ${symbol}\n`);
    process.stdout.write(`Last Sale Price:    ${money.format(salePrice)}\n`);
    process.stdout.write(
      `Net Change:         ${primaryData.netChange || "N/A"}\n`
    );
    process.stdout.write(
      `Percent Change:     ${primaryData.percentageChange || "N/A"}\n`
    );
    process.stdout.write(
      `Price Trend:\n`
    );
    process.stdout.write(sparkline(priceHistory));

    process.stdout.write("\n\n— Your Position ———————————————————\n");
    process.stdout.write(`Shares:             ${number.format(shares)}\n`);
    process.stdout.write(`Strike Price:       ${money.format(strikePrice)}\n`);
    process.stdout.write(`Position Value:     ${money.format(positionValue)}\n`);
    process.stdout.write(
      `Unrealized P/L:     ${colorize(
        unrealizedPL,
        money.format(unrealizedPL)
      )} (${colorize(
        unrealizedPL,
        unrealizedPLPct.toFixed(2) + "%"
      )})\n`
    );

    process.stdout.write("\n— Today ———————————————————————————\n");
    process.stdout.write(
      `Today's $ Change:   ${colorize(
        dailyDollarChange,
        money.format(dailyDollarChange)
      )}\n`
    );
  } catch (err) {
    console.error("Error fetching data:", err.message);
  }
}, refreshMs);

