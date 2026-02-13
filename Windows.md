# 🐧 MPN Software

Comprehensive Linux Build, Installation, and Uninstallation Guide

## 📌 Overview

MPN Software is distributed for Linux systems using a self-contained `.run` installer and optionally a `.deb` package for Debian-based distributions.


This document provides complete instructions for:

* Building the Linux installer
* Installing the software
* Uninstalling the software
* Cleaning up remaining dependencies




# Backend Service Configuration

This repository contains a **Node.js + Express** backend service packaged as a standalone executable for multiple operating systems.

## Tech Stack

- Node.js
- Express.js



## 🔎 Verify Node.js and npm Installation

Run the following commands:

node -v
npm -v

If not installed, install Node.js from your distribution package manager or official website.

---

## 📁 Project Structure

Ensure your project structure is organized as follows:

```
backend/
└── distribution/
├   ├── linux/
├    ├── windows/
├    └── macos/
└─ server.js
```

All build commands must be executed inside the `backend` directory.

---

- **server.js** All backend APIs are implemented in a single file:
- The `distribution` directory contains OS-specific build setup and generated files.

## ⚡ Prerequisites

- Node.js installed on your system
- npm (comes with Node.js)

Install dependencies before building:

```bash
npm install
```

## ⚙️ Windows

To generate the Windows executable, run:

### Build

```bash
npm run windows
```

### Output

The command generates the executable:

```
mpn-core-win.exe
```



## 🖥️ Linux

Before proceeding, ensure your system meets the following requirements:

* Linux operating system (64-bit recommended)
* Node.js (LTS version recommended)
* npm (comes with Node.js)
* sudo (administrator) privileges
* Internet connection (for dependency installation during build)

---


# 🏗️ Building the Linux Installer

Follow these steps carefully.

## Step 1: Open Terminal

Open your system terminal.

## Step 2: Navigate to Backend Directory

cd backend

## Step 3: Run Linux Build Command

```
npm run linux
```

This command will:

* Build the backend
* Package the application
* Generate the Linux installer file

---

## 📦 Build Output

After successful completion, the following file will be generated:

```
mpn-software-linux.run
```

Depending on configuration, you may also see:

mpn-software.deb

If the build fails, ensure:

* Node.js is installed correctly
* All npm dependencies are installed
* You are inside the `backend` folder

---

# 🚀 Installation Guide

You can install the software using one of the following methods.

## ✅ Method 1: Install Using `.run` File (Recommended for All Linux Systems)

#### Step 1: Make the Installer Executable
```base
sudo chmod +x mpn-software-linux.run
```
#### Step 2: Run the Installer
```base
sudo ./mpn-software-linux.run
```
Follow the on-screen installation instructions.

This method works on most Linux distributions.



## ❌ Uninstallation Guide

To completely remove MPN Software and related components, run:

sudo dpkg --purge mpn-software
sudo dpkg --purge naps2

Verify removal:

```base
dpkg -l | grep -E 'mpn-software|naps2'
```
Remove installer directory if it exists:
```base
sudo dpkg --purge mpn-software
sudo dpkg --purge naps2
dpkg -l | grep -E 'mpn-software|naps2'
sudo rm -rf /opt/dual-installer
sudo apt-get remove  mpn-software naps2
```

# 📄 License

Add your license information here.

---

# 👨‍💻 Maintainer

MPN Software Team
[support@yourcompany.com](mailto:support@yourcompany.com)
