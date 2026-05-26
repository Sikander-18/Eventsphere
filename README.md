# EventSphere

End-to-end event management and ticketing platform for DevFusion PS #3.

## Run Locally

```bash
cd eventsphere
npm run install:all
copy server\.env.example server\.env
copy client\.env.example client\.env
npm run dev:server
npm run dev:client
```

## Required Environment Variables

Server:

- `MONGO_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `CLIENT_URL`

Client:

- `VITE_API_URL`
- `VITE_RAZORPAY_KEY_ID`

Important MongoDB note: if the Atlas password has special characters, URL-encode them in `MONGO_URI`. For example, `@` becomes `%40`.

## Deployment

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `node index.js`
- Health check path: `/health`
- Add all server env vars from `server/.env.example`
- Set `CLIENT_URL` to the Vercel frontend URL

### Frontend on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` as the Render backend URL, without `/api`
- Add `VITE_RAZORPAY_KEY_ID`

`client/vercel.json` is included so React Router refreshes do not show 404 pages.

## Hosting Safety

- `/health` returns `{ "status": "ok" }`.
- Missing Razorpay keys use mock paid checkout locally, while real keys activate Razorpay.
- Free tickets bypass Razorpay and issue QR tickets directly.
- Missing Groq, Cloudinary, or Gmail config returns clean errors or skips optional work instead of crashing the server.
- Socket.IO uses the same CORS origin as Express.

