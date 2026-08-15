# MERN Stack Projects Setup Guide

This repository contains three independent Node.js/MERN projects.

## Repository Structure

```text
                MERN_Stack/
                         00_Quizo/
                         01_FarmConnect/
                         02_CarbonCalc/
                         .gitignore
                         README.md
```

Each project has its own `package.json`, dependencies, `.env`, and startup command.

---

# 1. Quizo

## `.env` Configuration

Create:

```text
00_Quizo/.env
```

Paste:

```env
PORT=8080
ATLAS_DB_URL=mongodb+srv://your_username:your_password@cluster.mongodb.net/quizo_db
SESSION_SECRET=your_quizo_session_secret
JWT_SECRET=your_quizo_jwt_secret
```

Replace the dummy MongoDB connection string and secret values with your own credentials.

## Install and Run

From the repository root:

```bash
cd 00_Quizo
npm install
npm run dev
```

Open:

```text
http://localhost:8080
```

---

# 2. FarmConnect

## `.env` Configuration

Create:

```text
01_FarmConnect/.env
```

Paste:

```env
PORT=8888
ATLAS_DB_URL=mongodb+srv://your_username:your_password@cluster.mongodb.net/farmconnect_db
SESSION_SECRET=your_farmconnect_session_secret
JWT_SECRET=your_farmconnect_jwt_secret

Cloud_Name=your_cloudinary_cloud_name
Cloud_Api=your_cloudinary_api_key
Cloud_Secret=your_cloudinary_api_secret
```

Replace the dummy MongoDB and Cloudinary values with your own credentials.

## Install and Run

From the repository root:

```bash
cd 01_FarmConnect
npm install
npm run dev
```

If `npm run dev` is not available in your local copy:

```bash
node app.js
```

Open:

```text
http://localhost:8888
```

---

# 3. CarbonCalc

## `.env` Configuration

Create:

```text
02_CarbonCalc/.env
```

Paste:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/carboncalc_db
SESSION_SECRET=your_carboncalc_session_secret
JWT_SECRET=your_carboncalc_jwt_secret
```

Replace the dummy MongoDB connection string and secret values with your own credentials.

## Install and Run

From the repository root:

```bash
cd 02_CarbonCalc
npm install
npm run dev
```

Open:

```text
http://localhost:5000
```

---

# Fork and Clone

1. Open the GitHub repository.
2. Click **Fork**.
3. Open a terminal.
4. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/MERN_Stack.git
cd MERN_Stack
```

---

# Install Dependencies

Dependencies are installed separately for each project.

```bash
cd 00_Quizo
npm install

cd ../01_FarmConnect
npm install

cd ../02_CarbonCalc
npm install
```

---

# Run All Three Projects

Open three terminals.

### Terminal 1 — Quizo

```bash
cd MERN_Stack/00_Quizo
npm run dev
```

`http://localhost:8080`

### Terminal 2 — FarmConnect

```bash
cd MERN_Stack/01_FarmConnect
npm run dev
```

`http://localhost:8888`

### Terminal 3 — CarbonCalc

```bash
cd MERN_Stack/02_CarbonCalc
npm run dev
```

`http://localhost:5000`

---

# Environment Variables Summary

| Project | Variable | Purpose |
|---|---|---|
| Quizo | `PORT` | Application port |
| Quizo | `ATLAS_DB_URL` | MongoDB Atlas connection |
| Quizo | `SESSION_SECRET` | Session security |
| Quizo | `JWT_SECRET` | JWT security |
| FarmConnect | `PORT` | Application port |
| FarmConnect | `ATLAS_DB_URL` | MongoDB Atlas connection |
| FarmConnect | `SESSION_SECRET` | Session security |
| FarmConnect | `JWT_SECRET` | JWT security |
| FarmConnect | `Cloud_Name` | Cloudinary cloud name |
| FarmConnect | `Cloud_Api` | Cloudinary API key |
| FarmConnect | `Cloud_Secret` | Cloudinary API secret |
| CarbonCalc | `PORT` | Application port |
| CarbonCalc | `MONGODB_URI` | MongoDB Atlas connection |
| CarbonCalc | `SESSION_SECRET` | Session security |
| CarbonCalc | `JWT_SECRET` | JWT security |

---

# Security

Never commit real credentials.

Add this to `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
```

Use dummy values in documentation and real credentials only in your local `.env` files.
