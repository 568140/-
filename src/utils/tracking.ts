export const getBrowserInfo = (ua: string) => {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Browser";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Trident")) return "Internet Explorer";
  if (ua.includes("Edge") || ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
};

export const getOSInfo = (ua: string) => {
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("like Mac")) return "iOS";
  return "Unknown";
};
