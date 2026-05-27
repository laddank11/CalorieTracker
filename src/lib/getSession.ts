import { NextRequest } from "next/server";
import { COOKIE_NAME } from "./auth";
import { validateSession } from "./session";

export async function getSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSession(token);
}
