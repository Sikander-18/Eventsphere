# EventSphere

EventSphere is a complete, premium, end-to-end event management and ticketing platform designed for **DevFusion PS #3**. It empowers organizers to manage ticket tiers and discount codes with strict date constraints, while providing attendees with interactive event exploration, real-time ticket purchasing, and automated check-ins.

---

## 🚀 Key Features

* **Advanced Ticket Tiers & Capacity limits**: Establish Free, Paid, VIP, and General Admission tiers with custom seat availability.
* **Early Bird & Sales Expiry Dates**: Enforce strict timeline controls. Ticket tiers automatically lock and become unavailable to purchase once their configured expiry date has passed.
* **Discount Code Expiries & Limits**: Custom promotional codes (e.g., `EARLYBIRD20`) support custom off-rates, usage caps, and precise expiration dates.
* **Seamless Payments (Razorpay & Mock Sandboxes)**: Real Razorpay support with an automatic, graceful mock payment fallback for seamless local sandboxing.
* **QR Ticket Generation**: Generates high-fidelity QR codes and secure check-in passes for each bought ticket.
* **Organiser Dashboard**: Instantly tracks revenues, total registrations, and live check-in percentages, with single-click attendee list downloads in `.csv` format.
* **Real-time Synchronization & Performance**: Socket.IO updates, loading state bar feedback, and full asynchronous workflows.

---

## 📂 Project Architecture

```
devfusion/
├── client/                 # Vite + React Frontend
│   ├── src/                # Components, Context, and Pages
│   └── package.json        # Frontend scripts and bundler configs
│
├── server/                 # Express + Node.js Backend
│   ├── config/             # DB & Cloudinary configs
│   ├── controllers/        # Express handlers (Orders, Events, Auth, Check-ins, etc.)
│   ├── models/             # Mongoose schemas (Event, Order, Ticket, TicketType, User, Review)
│   ├── services/           # Services (Razorpay, QR Codes, Groq AI, Nodemailer)
│   └── package.json        # Backend scripts and dependencies
│
├── README.md               # User guide & documentation
├── render.yaml             # Render deployment configuration for Web Service hosting
└── package.json            # Monorepo runner scripts (orchestrates client & server tasks)
```

---

## ⚙️ Run Locally

The workspace is organized as a monorepo. You can easily bootstrap the client and server together from the root directory:

```bash
# 1. Install dependencies for the root, server, and client directories
npm run install:all

# 2. Configure environment variables (refer to variable details below)
# - Copy server/.env.example to server/.env
# - Copy client/.env.example to client/.env

# 3. Spin up both the frontend client and backend server simultaneously
npm run dev
```

---

## 🔑 Required Environment Variables

### Server (`server/.env`):

* `PORT` (e.g. `5001` or `5000`)
* `MONGO_URI` (MongoDB Atlas or Local Connection URI)
* `JWT_SECRET` (For user sessions and tokens)
* `JWT_EXPIRES_IN` (e.g., `7d`)
* `GROQ_API_KEY` (Optional, activates Groq AI event generator)
* `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (Activates live payments; mock sandbox is used if blank)
* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Optional image upload service)
* `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Optional event confirmation mailing service)
* `CLIENT_URL` (URL of your frontend client, e.g. `http://localhost:5173`)

### Client (`client/.env`):

* `VITE_API_URL` (Express backend URL, e.g. `http://localhost:5001`)
* `VITE_RAZORPAY_KEY_ID` (Razorpay public key for frontend widget triggers)

*Note: If your MongoDB Atlas password contains special characters, ensure you URL-encode them inside `MONGO_URI` (e.g., `@` becomes `%40`).*

---

## ☁️ Deployment Reference

### Backend (Hosted on Render)
* **Root Directory**: `server`
* **Build Command**: `npm install`
* **Start Command**: `node index.js`
* **Health Check Path**: `/health`
* Ensure all environment variables from `server/.env` are specified in Render's Env Settings.

### Frontend (Hosted on Vercel)
* **Root Directory**: `client`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Configuration**: `client/vercel.json` is pre-configured to ensure single-page React Router routing refreshes cleanly.
