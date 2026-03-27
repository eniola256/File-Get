# FileGet API (Backend)
Express + MongoDB (Mongoose) API with JWT auth and Cloudinary uploads.

## Requirements
- Node.js 18+ (you have Node 22)

## Setup
1. Install dependencies:
   - PowerShell: `npm.cmd install`
2. Create your env file:
   - `Copy-Item .env.example .env`
3. Configure MongoDB Atlas in `.env`:
   - `MONGO_URI="mongodb+srv://USER:PASSWORD@.../fileget?retryWrites=true&w=majority&appName=fileget-api"`
   - (`MONGODB_URI` is also supported)
4. Configure JWT in `.env`:
   - `JWT_SECRET=...` (generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `JWT_EXPIRES_IN=7d` (optional)
5. Configure Cloudinary in `.env`:
    - `CLOUDINARY_CLOUD_NAME=...`
    - `CLOUDINARY_API_KEY=...`
    - `CLOUDINARY_API_SECRET=...`
6. (Optional) Configure SMTP email in `.env` (request notifications):
    - `SMTP_HOST=...`, `SMTP_PORT=...`, `SMTP_USER=...`, `SMTP_PASS=...`
    - If not set, emails are skipped (API still works).
7. Start the server:
    - Dev: `npm.cmd run dev`
    - Prod: `npm.cmd start`

## Endpoints
- `GET /health` -> `{ ok: true, db: { state } }`

Auth:
- `POST /api/auth/register` -> `{ token, user }`
- `POST /api/auth/login` -> `{ token, user }`
- `GET /api/auth/me` (Bearer token) -> `{ user }`

Files (Cloudinary):
- `GET /api/files` (Bearer token) -> `{ files }`
- `GET /api/files/my` (rep only, Bearer token) -> `{ files }`
- `POST /api/files` (rep only, Bearer token, multipart field name: `file`, plus `title` and `price`) -> `{ file }`
- `DELETE /api/files/:id` (rep owns file or admin, Bearer token) -> `{ success }`

Admin (admin only):
- `GET /api/admin/users` -> `{ users }`
- `POST /api/admin/users/:id/approve`
- `POST /api/admin/users/:id/suspend`
- `POST /api/admin/users/:id/reject`
- `DELETE /api/admin/users/:id`

Requests (student only):
- `POST /api/requests` (Bearer token, `multipart/form-data`):
  - file field: `receipt` (jpg/png/webp)
  - body fields: `fileId`, `payerName`, `relationship` (`self` | `parent` | `guardian`)
- `GET /api/requests/my` (Bearer token) -> `{ requests }`

Example auth response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<userId>",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student",
    "suspended": false
  }
}
```
