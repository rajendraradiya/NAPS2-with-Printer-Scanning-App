const express = require("express");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Authorization",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// 1. List devices
app.post("/api/getDeviceInformation", (req, res) => {
  const { os } = req.body;
  const softwareName = "naps2";

  let command = "";
  if (os === "Linux") {
    command = `which ${softwareName}`;
  } else if (os === "Windows" || os === "Win32") {
    const softwareName = "NAPS2";
    command = `powershell -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object {$_.DisplayName -like '*${softwareName}*'} | Select-Object DisplayName, InstallLocation"`;
  } else if (os === "macOS") {
    command = `mdfind "kMDItemKind == 'Application'" | grep -i "${softwareName}.app"`;
  }
  if (command == "") {
    res.json({ installed: false, message: "Your are using different OS." });
  }

  exec(command, (err, stdout) => {
    if (err || !stdout) return res.json({ installed: false });
    res.json({ installed: true, path: stdout.trim() });
  });
});

app.post("/api/devices", (req, res) => {
  const { os } = req.body;
  let command = "";
  if (os === "Linux") {
    command = "naps2 console --listdevices --driver sane";
  } else if (os === "Windows" || os === "Win32") {
    command = `"C:\\Program Files\\NAPS2\\NAPS2.Console.exe" --listdevices --driver wia`;
  } else if (os === "macOS") {
    command =
      "/Applications/NAPS2.app/Contents/MacOS/NAPS2 console --listdevices --driver apple";
  }

  exec(command, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr || err.message);
    const devices = stdout.split("\n").filter(Boolean);
    if (devices.length === 0) {
      console.log("inside");
      return res.status(200).json({
        success: false,
        devices: [],
        error: "No scanners detected. Please check printer configuration.",
      });
    }

    res.json(devices);
  });
});

// 2. Scan document
app.post("/api/scan", async (req, res) => {
  const { device, os, type } = req.body;

  const scanFolder = path.join(process.cwd(), "scans");
  fs.mkdirSync(scanFolder, { recursive: true });

  const outputFile = path.join(scanFolder, `scan_${Date.now()}.pdf`);
  const logFile = path.join(scanFolder, "scan.log");

  const INACTIVITY_LIMIT = 300000; // 5 minutes

  function writeLog(message) {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${message}\n`);
  }

  async function runScan(attempt = 1) {
    return new Promise((resolve, reject) => {
      let child;
      let inactivityTimer;
      let stdoutData = "";
      let stderrData = "";

      writeLog(`\n=== Scan Attempt ${attempt} Started ===`);
      console.log(`\n=== Scan Attempt ${attempt} Started ===`);
      writeLog(`Device: ${device}`);
      console.log(`Device: ${device}`);
      writeLog(`OS: ${os}`);
      console.log(`OS: ${os}`);
      writeLog(`Source: ${type}`);
      console.log(`Source: ${type}`);
      writeLog(`Output: ${outputFile}`);
      console.log(`Output: ${outputFile}`);

      function cleanupTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
      }

      function resetTimer() {
        cleanupTimer();
        inactivityTimer = setTimeout(() => {
          writeLog("Scan timed out due to inactivity.");
          console.log("Scan timed out due to inactivity.");
          child.kill("SIGTERM");
          setTimeout(() => child.kill("SIGKILL"), 5000);
          reject(new Error("Scan timed out (inactivity)"));
        }, INACTIVITY_LIMIT);
      }

      // Spawn based on OS
      if (os === "Linux") {
        child = spawn("naps2", [
          "console",
          "-o",
          outputFile,
          "--noprofile",
          "--driver",
          "sane",
          "--device",
          device,
          "--source",
          type,
        ]);
      } else if (os === "Windows") {
        child = spawn(
          `"C:\\Program Files\\NAPS2\\NAPS2.Console.exe"`, // full path to exe
          [
            "-o",
            outputFile,
            "--noprofile",
            "--driver",
            "wia", // use "wia" or "twain" on Windows, not "sane"
            "--device",
            device,
            "--source",
            `${type}`,
          ],
          { shell: true }, // helps with Windows path/args parsing
        );
      } else if (os === "macOS") {
        child = spawn("/Applications/NAPS2.app/Contents/MacOS/NAPS2", [
          "console",
          "-o",
          outputFile,
          "--noprofile",
          "--driver",
          "apple",
          "--device",
          device,
          "--source",
          `${type}`,
        ]);
      } else {
        return reject(new Error("Unsupported OS"));
      }

      resetTimer();

      child.stdout.on("data", (data) => {
        const msg = data.toString();
        stdoutData += msg;
        writeLog(`STDOUT: ${msg.trim()}`);
        console.log(`STDOUT: ${msg.trim()}`);
        resetTimer();
      });

      child.stderr.on("data", (data) => {
        const msg = data.toString();
        stderrData += msg;
        writeLog(`STDERR: ${msg.trim()}`);
        console.log(`STDERR: ${msg.trim()}`);
        resetTimer();
      });

      child.on("error", (err) => {
        cleanupTimer();
        writeLog(`Process error: ${err.message}`);
        console.log(`Process error: ${err.message}`);
        reject(err);
      });

      child.on("close", (code) => {
        cleanupTimer();
        writeLog(`Process exited with code: ${code}`);
        console.log(`Process exited with code: ${code}`);

        if (
          code !== 0 ||
          stderrData.includes("libpng error") ||
          stdoutData.includes("No scanned pages") ||
          stdoutData.includes(
            "Communication with the scanning device was interrupted",
          )
        ) {
          writeLog("Scan failed due to detected error.");
          console.log("Scan failed due to detected error.");
          return reject(new Error("Scan failed"));
        }

        writeLog("Scan completed successfully.");
        console.log("Scan completed successfully.");
        resolve();
      });
    });
  }

  // Retry logic (important for Wi-Fi scanners)
  const MAX_RETRIES = 3;

  try {
    for (let i = 1; i <= MAX_RETRIES; i++) {
      try {
        await runScan(i);
        break;
      } catch (err) {
        writeLog(`Attempt ${i} failed: ${err.message}`);
        console.log(`Attempt ${i} failed: ${err.message}`);
        if (i === MAX_RETRIES) throw err;
      }
    }

    const data = fs.readFileSync(outputFile);
    const base64Image = data.toString("base64");

    writeLog("Sending response to client.");
    console.log("Sending response to client.");
    res.json({
      success: true,
      imageBase64: base64Image,
    });

    fs.unlinkSync(outputFile);
  } catch (err) {
    writeLog(`Final failure: ${err.message}`);
    console.log(`Final failure: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(52345, () => console.log(`Backend running on port 52345`));
