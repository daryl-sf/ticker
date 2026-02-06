# ticker

A lightweight terminal stock ticker that shows real-time price data, position performance, and a sparkline chart directly in your shell.

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
  * Unrealized P/L (dollars and percent)
  * Today’s dollar change
* Green / red coloring for gains and losses

---

## Requirements

* Node.js 18 or newer (for built-in `fetch`)
* Internet connection

No external npm dependencies are required.

---

## Installation

Clone or copy the script locally:

```bash
git clone <repo>
cd ticker
```

Or just drop `ticker.js` anywhere and run it with Node.

---

## Usage

```bash
node ticker [symbol] <shares> <strikePrice> [refreshMs]
```

### Arguments

| Argument      | Description                      | Required | Default |
| ------------- | -------------------------------- | -------- | ------- |
| `symbol`      | Stock ticker symbol              | No       | `EQPT`  |
| `shares`      | Number of shares you own         | Yes      | —       |
| `strikePrice` | Your cost basis per share        | Yes      | —       |
| `refreshMs`   | Refresh interval in milliseconds | No       | `5000`  |

### Examples

```bash
node ticker EQPT 100 12.50
node ticker AAPL 50 175 2000
node ticker TSLA 10 220
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

* Shares owned
* Strike price
* Current position value
* Unrealized profit / loss

  * Dollar amount
  * Percentage

Values are color-coded:

* Green for gains
* Red for losses

---

### Today

* Dollar change for the day across your entire position

---

## Price History Persistence

`ticker` saves recent prices to disk so your sparkline survives restarts.

History files are stored as JSON in the current directory:

```
price-history-<SYMBOL>.json
```

Each symbol maintains its own independent history.

---

## Notes

* Data is sourced from the public Nasdaq quote API
* Quotes update as frequently as the refresh interval allows
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

