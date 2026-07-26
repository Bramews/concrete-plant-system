import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export type JWTPayload = {
  userId: number;
  role: string;
  companyId: number | null; // null for SYSTEM_OWNER only
  impersonatedBy?: number; // System Owner ID
};

/**
 * Returns the secret key for JWT signing.
 * Throws a clear error if JWT_SECRET is not configured.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "[SECURITY] JWT_SECRET environment variable is not set. " +
        "The application cannot operate securely without it. " +
        "Please add JWT_SECRET to your .env file.",
    );
  }
  return new TextEncoder().encode(secret);
}

// --- Public API ---

export async function signJWT(
  payload: JWTPayload,
  expiresIn: number = ACCESS_TOKEN_EXPIRY,
): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setTokens(
  userId: number,
  role: string,
  companyId: number | null,
  impersonatedBy?: number,
) {
  const accessToken = await signJWT(
    { userId, role, companyId, impersonatedBy },
    ACCESS_TOKEN_EXPIRY,
  );
  const refreshToken = await signJWT(
    { userId, role, companyId, impersonatedBy },
    REFRESH_TOKEN_EXPIRY,
  );

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("auth_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
}

export async function refreshTokens() {
  const cookieStore = await cookies();
  const oldRefreshToken = cookieStore.get("refresh_token")?.value;
  if (!oldRefreshToken) return null;

  const payload = await verifyJWT(oldRefreshToken);
  if (!payload) return null;

  // Verify in DB and Rotate
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });

  if (!storedToken) return null;

  // Revoke old token
  await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });

  // Issue new tokens
  await setTokens(
    payload.userId,
    payload.role,
    payload.companyId,
    payload.impersonatedBy,
  );
  return true;
}

export async function getJWTPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function clearTokens() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (refreshToken) {
    try {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
    } catch {
      // Ignore if already deleted
    }
  }
  cookieStore.delete("auth_token");
  cookieStore.delete("refresh_token");
}
