const fs = require("fs");
const {
  money,
  gbp,
  number,
  toNumber,
  colorize,
  sparkline
} = require("./utils");

const { calculateUkPayeOnExercise } = require("./tax");

const stockSymbol = (process.argv[2] || "EQPT").toUpperCase();
const shares = Number(process.argv[3]);
const strikePrice = Number(process.argv[4]);
const refreshMs = Number(process.argv[5]) || 5000;

if (isNaN(shares) || isNaN(strikePrice)) {
  console.log("Usage: node ticker.js [symbol] <shares> <strikePrice> [refreshMs]");
  process.exit(1);
}

const CONFIG_FILE = "./config.json";
let config = null;

if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    config = null;
  }
}

const HISTORY_FILE = `./price-history-${stockSymbol}.json`;
const MAX_POINTS = 30;

let firstRun = true;
let priceHistory = [];

if (fs.existsSync(HISTORY_FILE)) {
  try {
    priceHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    priceHistory = [];
  }
}

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

    const grossPL = positionValue - costBasis;
    const grossPLPct = (grossPL / costBasis) * 100;

    const dailyDollarChange = netChangePerShare * shares;

    let estimatedTax = 0;
    let estimatedNI = 0;
    let netAfterTax = grossPL;
    let netAfterTaxGbp = null;

    if (config?.ukTax && grossPL > 0) {
      const usdToGbp = Number(config.ukTax.usdToGbp);
      const salaryGbp = Number(config.ukTax.annualSalary);
      if (Number.isFinite(usdToGbp) && usdToGbp > 0) {
        const grossPLGbp = grossPL * usdToGbp;
        const result = calculateUkPayeOnExercise(salaryGbp, grossPLGbp);
        const gbpToUsd = 1 / usdToGbp;
        estimatedTax = result.tax * gbpToUsd;
        estimatedNI = result.ni * gbpToUsd;
        netAfterTax = result.afterTaxGain * gbpToUsd;
        netAfterTaxGbp = result.afterTaxGain;
      }
    }

    if (!firstRun) {
      process.stdout.write("\x1b[23A\x1b[J");
    }
    firstRun = false;

    process.stdout.write(`\n📊 ${symbol} Option Dashboard\n\n`);

    process.stdout.write("— Market ———————————————\n");
    process.stdout.write(`Symbol:             ${symbol}\n`);
    process.stdout.write(`Last Sale Price:    ${money.format(salePrice)}\n`);
    process.stdout.write(`Net Change:         ${primaryData.netChange}\n`);
    process.stdout.write(`Percent Change:     ${primaryData.percentageChange}\n`);
    process.stdout.write(`Price Trend:        ${sparkline(priceHistory)}\n`);

    process.stdout.write("\n— Your Position —————————\n");
    process.stdout.write(`Shares:             ${number.format(shares)}\n`);
    process.stdout.write(`Strike Price:       ${money.format(strikePrice)}\n`);
    process.stdout.write(`Position Value:     ${money.format(positionValue)}\n`);

    process.stdout.write(
      `Gross P/L:          ${colorize(
        grossPL,
        money.format(grossPL)
      )} (${colorize(grossPL, grossPLPct.toFixed(2) + "%")})\n`
    );

    if (config?.ukTax && grossPL > 0) {
      const effectiveRate =
        ((estimatedTax + estimatedNI) / grossPL) * 100;

      process.stdout.write(
        `Income Tax (PAYE):  \x1b[90m${money.format(-estimatedTax)}\x1b[0m\n`
      );

      process.stdout.write(
        `Employee NI:        \x1b[90m${money.format(-estimatedNI)}\x1b[0m\n`
      );

      process.stdout.write(
        `Net After Tax:      ${colorize(
          netAfterTax,
          money.format(netAfterTax)
        )}\n`
      );

      process.stdout.write(
        `Net After Tax (GBP): ${colorize(
          netAfterTaxGbp,
          gbp.format(netAfterTaxGbp)
        )}\n`
      );

      process.stdout.write(
        `Effective Tax Rate: ${effectiveRate.toFixed(2)}%\n`
      );
    }

    process.stdout.write("\n— Today ————————————————\n");
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