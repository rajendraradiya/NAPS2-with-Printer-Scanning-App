import express from "express";
import { exec, spawn } from "child_process";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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
    res.json(devices);
  });
});

// 2. Scan document
app.post("/scan", (req, res) => {
  const { device } = req.body;
  console.log(device);
  const outputFile = "scan.pdf";
  let responded = false;
  // const command = `naps2 console -o  ${outputFile} --noprofile --driver sane --device '${device}'`;
  // // const command = `naps2 console -o scan.pdf --noprofile --driver sane --device ${device}`;

  // exec(command, (err, stdout, stderr) => {
  //   console.log({ err, stdout, stderr });
  //   if (err)
  //     return res.status(500).json({
  //       status: 500,
  //       err: err,
  //     });

  //   fs.access(outputFile, fs.constants.F_OK, (accessError) => {
  //     if (accessError) {
  //       return res.status(500).json({
  //         status: 500,
  //         error: "Scan file was not created.",
  //       });
  //     }
  //     fs.readFile(outputFile, (error, data) => {
  //       console.log("Error", error, data);
  //       if (error) return res.status(500).send(error.message);
  //       const base64Image = data.toString("base64");
  //       res.json({ imageBase64: base64Image });
  //       fs.unlink(outputFile, (errorFile) => {
  //         if (errorFile) console.error("Error deleting scan file:", errorFile);
  //       });
  //     });
  //   });

  //   console.log(fs);
  // });

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

  child.stdout.on("data", (data) => console.log(`stdout: ${data}`));
  child.stderr.on("data", (data) => console.error(`stderr: ${data}`));

  const timer = setTimeout(() => {
    if (!responded) {
      responded = true;
      child.kill("SIGKILL"); // stop scanner process
      return res.status(500).json({ status: 500, error: "Scan timed out" });
    }
  }, 60000);

  child.on("close", (code) => {
    if (responded) return;
    clearTimeout(timer); // cancel timeout
    responded = true;

    if (code !== 0) {
      return res.status(500).send("Scan failed");
    }

    fs.readFile(outputFile, (error, data) => {
      if (error) return res.status(500).send(error.message);

      const base64Image = data.toString("base64");
      res.json({ imageBase64: base64Image });
      fs.unlink(outputFile, () => {});

      fs.unlink(outputFile, (errorFile) => {
        if (errorFile) console.error("Error deleting scan file:", errorFile);
      });
    });
  });
});

app.listen(5000, () => console.log("Backend running on port 5000"));
