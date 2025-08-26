# NAPS2 + Printer Scanning App

A modern, browser-based scanning solution inspired by **NAPS2**.  
This app provides an easy-to-use **React + Tailwind** frontend with an **Express** backend that integrates directly with scanner hardware. Documents are captured, processed, and returned as **Base64-encoded PDFs**, which are displayed seamlessly inside an `<iframe>` for preview or printing.

---

## ✨ Features

- **Frontend (React + Tailwind)**

  - Clean, responsive UI with TailwindCSS
  - Document preview in an `<iframe>` (Base64 PDF rendering)
  - Option to download or print scanned PDFs
  - SDK download and setup instructions for running locally

- **Backend (Express + Hardware Integration)**
  - Communicates with scanner devices via system drivers (TWAIN/WIA on Windows, SANE on Linux, etc.)
  - Captures scans, runs optional OCR, and converts output to PDF
  - Returns Base64-encoded PDF back to frontend
  - Supports multi-page scanning and merging

---

## 📂 Project Structure

## ⚡ Getting Started

### 1. Clone repo

```bash
git clone https://github.com/rajendraradiya/NAPS2-with-Printer-Scanning-App.git
```

This will run the React frontend at http://localhost:3000.

### 2. Setup Frontend

```bash
cd fronted
npm install
npm run dev
```

### 2. Setup Backend

```bash
cd backend
npm install
npm start
```

The backend will start on http://localhost:5000.

---

🔌 API Endpoints

<ul>

<li>      GET  /devices →  it's return all connected device likes printer.</li>

<li> POST /scan → Triggers scanner hardware, returns Base64-encoded PDF.. </li>

</ul>
