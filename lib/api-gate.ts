import { NextResponse } from "next/server";

/**
 * Standard API Response Wrapper
 */
export const apiResponse = {
  success: (data: any, status = 200) => {
    return NextResponse.json(
      {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      },
      {
        status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  },

  error: (message: string, status = 400, code = "API_ERROR") => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  },

  unauthorized: () => {
    return apiResponse.error(
      "Unauthorized access. Token missing or invalid.",
      401,
      "UNAUTHORIZED",
    );
  },

  forbidden: (reason = "Access denied.") => {
    return apiResponse.error(reason, 403, "FORBIDDEN");
  },
};
