# 🔌 Concrete ERP External API Integration Guide

This guide is for developers building the Windows Desktop App, Android App, and iOS App. The backend is already configured to support stateless, cross-platform connectivity.

---

## 1. Authentication (JWT)

Apps should use the token-exchange endpoint to get a Bearer token. This token should be stored securely (e.g., KeyChain on iOS, EncryptedSharedPreferences on Android).

### **Auth Endpoint**

`POST /api/auth/token`

**Payload:**

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "username": "ahmed@elite",
      "name": "Ahmed Admin",
      "role": "COMPANY_ADMIN",
      "company": { "id": 1, "name": "Elite Concrete", "slug": "elite" }
    },
    "expiresIn": 2592000
  }
}
```

---

## 2. Global Headers

All subsequent requests must include the following headers:

| Header          | Description                                                         | Required |
| :-------------- | :------------------------------------------------------------------ | :------- |
| `Authorization` | `Bearer <your_token>`                                               | Yes      |
| `Content-Type`  | `application/json`                                                  | Yes      |
| `X-Company-Id`  | The ID of the company being accessed (optional, default from token) | No       |

---

## 3. Standard Response Format

All API responses follow this consistent structure:

### **Success**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-01T15:00:00Z"
}
```

### **Error**

```json
{
  "success": false,
  "error": {
    "message": "Human readable error",
    "code": "ERROR_CODE"
  },
  "timestamp": "2026-04-01T15:00:00Z"
}
```

---

## 4. PWA Support (Mobile Browser App)

The system is already a Progressive Web App. To "install" it on mobile:

1.  Open the site in Safari (iOS) or Chrome (Android).
2.  Tap **Share** (iOS) or **Menu** (Android).
3.  Select **"Add to Home Screen"**.

The app will launch in **Standalone Mode** without browser bars, providing a native-like experience.

---

## 5. Desktop Connectivity (CORS)

Cross-Origin Resource Sharing (CORS) is enabled for all origins (`*`).
Desktop apps (WPF, WinForms, Cocoa) can perform `fetch` or `HttpClient` requests directly to the system URL without restriction.
