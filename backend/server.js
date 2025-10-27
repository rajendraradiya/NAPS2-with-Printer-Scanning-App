const express = require("express");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const notifier = require("node-notifier");
const operatingSystem = require("os"); 

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

// Show installed successfully notification (cross-platform)
function showSuccessNotification() {
  if (process.platform === "win32") {
    // Windows: run VBScript popup
    // const vbsPath = path.join(__dirname, 'success.vbs');
    // // Create success.vbs if not exists
    // if (!fs.existsSync(vbsPath)) {
    //   fs.writeFileSync(vbsPath, 'MsgBox "Installed successfully!", vbInformation, "Setup"');
    // }
    // exec(`cscript //nologo "${vbsPath}"`, (err) => {
    //   if (err) console.error("Failed to show popup:", err);
    // });
  } else {
    // Linux / macOS: log to console
    notifier.notify({
      title: "Setup",
      message: "Installed successfully!",
      sound: true,
    });
  }
}

// Example: call this at startup
showSuccessNotification();

// app.get("/", (req, res) => {
//   res.sendFile(path.resolve("index.html"));
// });

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
app.post("/api/scan", (req, res) => {
  const { device, os } = req.body;

  const scanFolder = path.join(operatingSystem.tmpdir(), "scans");
  fs.mkdirSync(scanFolder, { recursive: true });
  const outputFile = path.join(scanFolder, `scan_${Date.now()}.pdf`);

  let responded = false;

  try {
    let child = null;
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
      ]);
    } else if (os === "Windows" || os === "Win32") {
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
        ],
        { shell: true } // helps with Windows path/args parsing
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
      ]);
    }

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    const timer = setTimeout(() => {
      if (!responded) {
        responded = true;
        child.kill("SIGKILL"); // force kill
        return res
          .status(500)
          .json({ success: false, error: "Scan timed out" });
      }
    }, 60000);

    child.on("close", (code) => {
      if (responded) return;
      responded = true;
      clearTimeout(timer);

      if (code !== 0) {
        return res
          .status(500)
          .json({ success: false, status: 500, error: "Scan failed" });
      }

      fs.readFile(outputFile, (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, status: 500, error: err.message });
        }

        const base64Image = data.toString("base64");
        res.json({ success: true, imageBase64: base64Image });

        fs.unlink(outputFile, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting scan file:", unlinkErr);
        });
      });
    });
  } catch (err) {
    if (!responded) {
      responded = true;
      return res.status(500).json({
        success: false,
        status: 500,
        error: err.message || "Unexpected error",
      });
    }
  }
});

app.listen(5000, () => console.log(`Backend running on port 5000`));
