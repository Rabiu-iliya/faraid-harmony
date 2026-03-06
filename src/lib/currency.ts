const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", NGN: "₦", SAR: "﷼", AED: "د.إ",
  MYR: "RM", IDR: "Rp", TRY: "₺", PKR: "₨", BDT: "৳", INR: "₹",
  JPY: "¥", CNY: "¥", KRW: "₩",
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export function formatCurrency(value: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
  });
  return `${symbol}${formatted}`;
}

export function parseNumericValue(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}
