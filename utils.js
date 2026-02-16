const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
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
  if (data.length < 2) return "";

  const MAX_LEN = 20;
  const points = data.slice(-MAX_LEN);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const lines = ["⎽", "⎼", "─", "⎻", "⎺"];
  let line = "";

  for (let i = 0; i < points.length; i++) {
    const n = points[i];
    const idx = Math.min(
      lines.length - 1,
      Math.floor(((n - min) / range) * lines.length)
    );

    const char = lines[idx];

    if (i === 0) {
      line += char;
      continue;
    }

    const delta = n - points[i - 1];

    if (delta > 0) line += `\x1b[32m${char}\x1b[0m`;
    else if (delta < 0) line += `\x1b[31m${char}\x1b[0m`;
    else line += char;
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];

  if (last > prev) return `${line} \x1b[32m▲\x1b[0m`;
  if (last < prev) return `${line} \x1b[31m▼\x1b[0m`;

  return `${line} ▶`;
};

module.exports = {
  money,
  gbp,
  number,
  toNumber,
  colorize,
  sparkline
};