export const formatCurrency = (amount: string | number, currency: string) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(amount)
  );
};

export const formatExchangeRate = (rate: number) => {
  return rate.toFixed(6);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

export const formatDateToMonthDay = (d: Date, separator = " ") => {
  const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
  const mo = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

  const tm = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const date = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const shortDate = `${da} ${mo} ${ye.slice(-2)}`;

  return {
    t: tm,
    y: ye,
    m: mo,
    d: da,
    shortDate,
    date,
    datetime: `${shortDate} ${tm}`,
    text: `${mo}${separator}${da}`,
  };
};
