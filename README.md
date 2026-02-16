# ticker

A lightweight terminal stock ticker that shows real-time price data, position performance, and a sparkline chart directly in your shell. Optionally estimates UK PAYE tax and NI on exercise gains.

`ticker` is designed to be fast, dependency-free, and pleasant to leave running all day.

---

## Features

* Real-time stock quotes from Nasdaq
* Configurable stock symbol
* Configurable refresh rate
* Persistent price history per symbol
* ASCII sparkline with:

  * Direction arrow (▲ ▼ ▶)
  * High / Low markers (H / L)
  * Color-coded trend
* Position tracking

  * Position value
  * Gross P/L (dollars and percent)
  * Today’s dollar change
* **Optional UK tax estimation** (when `config.json` is set):

  * Estimated Income Tax (PAYE) and Employee NI on exercise gain
  * Net after tax and effective tax rate
* Green / red coloring for gains and losses

---

## Requirements

* Node.js 18 or newer (for built-in `fetch`)
* Internet connection

No external npm dependencies are required.

---

## Installation

Clone or copy the project (you need `ticker.js`, `utils.js`, and `tax.js` in the same directory):

```bash
git clone <repo>
cd ticker
```

**Optional: UK tax estimates**

To see estimated UK PAYE tax and NI on your option exercise gain:

1. Copy the example config and add your salary:

   ```bash
   cp config.json.example config.json
   ```

2. Edit `config.json` and set **salary in GBP** and **USD→GBP rate**:

   ```json
   {
     "ukTax": {
       "taxCode": "1257L",
       "annualSalary": 45000,
       "usdToGbp": 0.79
     }
   }
   ```

   * **`annualSalary`** — your gross UK salary in **GBP** (used with UK tax bands).
   * **`usdToGbp`** — exchange rate: 1 USD = this many GBP (e.g. `0.79`). Your position and gain are in USD; this converts the gain to GBP for the tax calculation. Tax/NI are then converted back to USD for display.

   If you omit `config.json`, or leave `annualSalary` at `0`, or omit/invalid `usdToGbp`, the dashboard shows only gross P/L (no tax section).

`config.json` is gitignored so your salary is never committed.

---

## Usage

```bash
node ticker.js [symbol] <shares> <strikePrice> [refreshMs]
```

### Arguments

| Argument      | Description                      | Required | Default |
| ------------- | -------------------------------- | -------- | ------- |
| `symbol`      | Stock ticker symbol              | No       | `EQPT`  |
| `shares`      | Number of shares (or options)     | Yes      | —       |
| `strikePrice` | Your cost basis per share ($)    | Yes      | —       |
| `refreshMs`   | Refresh interval in milliseconds | No       | `5000`  |

All of `ticker.js`, `utils.js`, and `tax.js` must be in the same directory when you run `node ticker.js`.

### Examples

```bash
node ticker.js EQPT 100 12.50
node ticker.js AAPL 50 175 2000
node ticker.js TSLA 10 220
```

---

## Output Overview

### Market Section

* Symbol
* Last sale price
* Net change
* Percent change
* Price trend sparkline

Example:

```
Price Trend:  ▂▄▅H▆▇█▆▅▄L▃ ▲
```

* ▲ price ticking up
* ▼ price ticking down
* ▶ no change
* H marks the highest price in the window
* L marks the lowest price in the window

---

### Your Position

* Shares (or options) and strike price
* Current position value
* **Gross P/L** — dollar amount and percentage (before tax)

Values are color-coded: green for gains, red for losses.

---

### UK tax (optional)

Share prices and P/L are in **USD**. UK tax is calculated in **GBP** (salary and tax bands). The dashboard converts the exercise gain to GBP for the calculation, then shows tax/NI/net in **USD** so everything is comparable.

When `config.json` has `ukTax.annualSalary` (GBP) and `ukTax.usdToGbp` set and gross P/L is positive, the dashboard also shows:

* **Income Tax (PAYE)** — estimated tax on the exercise gain (displayed in USD)
* **Employee NI** — estimated National Insurance (displayed in USD)
* **Net After Tax** — gain after tax and NI (USD)
* **Effective Tax Rate** — (tax + NI) as a percentage of the gain

Rates and bands use UK rules in GBP (personal allowance, basic/higher/additional rate, NI thresholds). This is an estimate only; consult a tax adviser for your situation.

---

### Today

* Dollar change for the day across your entire position

---

## Files

| File                   | Purpose |
| ---------------------- | ------- |
| `ticker.js`            | Main script; run with `node ticker.js` |
| `utils.js`             | Formatting and sparkline (required) |
| `tax.js`               | UK PAYE/NI estimation (required) |
| `config.json.example` | Example config; copy to `config.json` and edit |
| `config.json`          | Your config (optional): `ukTax.annualSalary` in GBP, `ukTax.usdToGbp` for USD→GBP; gitignored |
| `price-history-<SYMBOL>.json` | Cached prices per symbol; gitignored |

Price history is saved so the sparkline survives restarts. Each symbol has its own file.

---

## Notes

* Data is sourced from the public Nasdaq quote API
* Quotes update as frequently as the refresh interval allows
* UK tax figures are estimates (income tax bands and NI thresholds); not a substitute for professional advice
* This is intended for informational use, not trading automation

---

## Customization Ideas

If you want to extend it further:

* Session-based high / low instead of rolling window
* Color only the last sparkline block
* Flash arrow on direction change
* Add volume or VWAP
* Multiple symbols in one view

---

## License

MIT

Do whatever you want. Just don’t blame the script for bad trades.

