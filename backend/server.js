import express from "express";
import { exec, spawn } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

app.get("/", (req, res) => {
  res.send("<H1>BACKEND IS RUNNING...</H1>");
});

// 1. List devices
app.get("/getDeviceInformation", (req, res) => {
  exec("which naps2", (err, stdout) => {
    if (err || !stdout) return res.json({ installed: false });
    res.json({ installed: true, path: stdout.trim() });
  });
});

app.get("/devices", (req, res) => {
  exec("naps2 console --listdevices --driver sane", (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr || err.message);
    const devices = stdout.split("\n").filter(Boolean);
    if (devices.length === 0) {
      return res.status(404).json({ success: false, error: "No scanners detected. Please check printer configuration." });
    }
    res.json(devices);
  });
});

// 2. Scan document
app.post("/scan", (req, res) => {
  const { device } = req.body;
  const outputFile = "scan.pdf";
  let responded = false;

  try {
    const child = spawn("naps2", [
      "console",
      "-o",
      outputFile,
      "--noprofile",
      "--driver",
      "sane",
      "--device",
      device,
    ]);

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
      return res
        .status(500)
        .json({
          success: false,
          status: 500,
          error: err.message || "Unexpected error",
        });
    }
  }
});

app.listen(process.env.BASE_URL_PORT, () =>
  console.log(`Backend running on port ${process.env.BASE_URL_PORT}`)
);
