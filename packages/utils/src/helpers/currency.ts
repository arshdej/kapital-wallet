import { Currency } from "./types/currency";

// Helper function to get currency symbols
export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: { [key in Currency]: string } = {
    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    ZAR: "R",
    MAD: "د.م.",
    EGP: "E£",
    USD: "$",
    EUR: "€",
    CAD: "C$",
    GBP: "£",
    JPY: "¥",
    USDC: "USDC",
    BTC: "₿",
    AUD: "A$",
    MXN: "$",
  };
  return symbols[currency] || "?";
};
