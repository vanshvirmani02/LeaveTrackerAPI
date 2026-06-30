const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

export const isAllowedOrigin = (requestOrigin) => {
  const allowedOrigins = (process.env.ALLOWED_WEBSITE ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

  if (!requestOrigin || allowedOrigins.length === 0) {
    return false;
  }

  return allowedOrigins.includes(normalizeOrigin(requestOrigin));
};