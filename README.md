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

### 2. Download SDK for interaction with hardware.

[https://www.naps2.com/](https://www.naps2.com/)

### 3. Setup Frontend

```bash
cd fronted
npm install
npm run dev
```

### 4. Setup Backend

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

---

# Generate MAC book .pkg file to run this command

Go to backend folder

```
npm run mac
```

it generate "mpn-core-installer.pkg" file
pkg

you Must be added the developer id installer certificate to this .pkg file "mpn-core-installer.pkg"

```
productsign \
 --sign "Developer ID Installer: Your Name (TEAMID)" \
 mpn-core-combine.pkg \
 mpn-core-combine-signed.pkg
```

#### 1. Install this app http://s.sudre.free.fr/Software/Packages/about.html

#### 2. Combine the file to add this file and generate the final file

- mpn-core-installer-signed.pkg
- naps2-8.2.1-mac-univ.pkg.pkg
- postinstall

### 3. Final Notarize

1.  Apple Account
2. generate App-specific Passwords

Example :
```
htth-ncpv-hngs-qweg
```
Now notarize Request

```
xcrun altool --notarize-app --primary-bundle-id "com.ccextensions.alce3" --username "YourAppleID@mail.com" --password "cvbs-epfg-sizx-olwd" --file "mpn-core-combine-signed.pkg"
```

```
 xcrun notarytool submit MyApp.pkg \
  --apple-id your@email.com \
  --team-id ABCDE12345 \
  --password abcd-efgh-ijkl-mnop \
  --wait

```
For tutorial 
https://www.davidebarranca.com/2019/04/notarizing-installers-for-macos-catalina/

Finally Done you .pkg to distribution

# Generate the final file for the Linux system by running this command:

```
npm run linux
```

# Generate the final file for the window system by running this command:

```
npm run window
```
- it generate "mpn-core-win.exe" file
- you must be add  code signature certificate

