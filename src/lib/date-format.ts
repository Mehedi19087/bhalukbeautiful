/**
 * Bangladesh Standard Time (Asia/Dhaka) formatting utilities.
 */

/**
 * Format date in Bangladesh Standard Time (Asia/Dhaka).
 * Output example: "১১/১০/২০২৬"
 */
export function formatBdDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka" });
}

/**
 * Format time in Bangladesh Standard Time (Asia/Dhaka).
 * Output example: "০৪:২১ PM"
 */
export function formatBdTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("bn-BD", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date and time together in Bangladesh Standard Time (Asia/Dhaka).
 * Output example: "১১/১০/২০২৬, ০৪:২১ PM"
 */
export function formatBdDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatBdDate(d);
  const time = formatBdTime(d);
  return time ? `${date}, ${time}` : date;
}
