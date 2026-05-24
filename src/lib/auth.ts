export const COOKIE_NAME = "nutritrack_session";
export const COOKIE_MAX_AGE = 30 * 24 * 3600; // 30 days

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};
