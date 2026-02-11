# Backend Service Configuration

This repository contains a **Node.js + Express** backend service packaged as a standalone executable for multiple operating systems.



## Tech Stack

* Node.js
* Express.js

## Project Structure

  ```
  backend/
  └── distribution/
  ├   ├── linux/
  ├    ├── windows/
  ├    └── macos/
  └─ server.js
  ```

* **server.js** All backend APIs are implemented in a single file:
* The `distribution` directory contains OS-specific build setup and generated files.

## Prerequisites

* Node.js installed on your system
* npm (comes with Node.js)

Install dependencies before building:

```bash
npm install
```


## ⚙️ Windows

To generate the Windows executable, run:

```bash
npm run windows
```

### Build Output

The command generates the executable:

  ```
  mpn-core-win.exe
  ```







## ⚙️ Linux

1. Open a terminal
2. Navigate to the `backend` folder
3. Run the following command:

```bash
npm run linux
```

### Build Output

This command generates the following files:

* `mpn-software.deb`
* `mpn-software-linux.run`

### Installation

* The `.run` file is used to install the software on Linux systems
* The `.deb` file can be installed using Debian-based package managers

Example installation using the `.run` file:

```bash
chmod +x mpn-software-linux.run
./mpn-software-linux.run
```

> ⚠️ You may need `sudo` privileges to install the software.

## Notes

* Ensure no other service is using the same port before starting the server
* Linux and macOS builds are located in their respective folders under `distribution`



## License

Add your license information here.
