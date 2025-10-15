import React, { useState, useEffect } from "react";
import searchImage from "../src/assets/searching.gif";
import scanImage from "../src/assets/scan.gif";
import DialogBox from "../src/components/DialogBox";
import axios from "axios";
import windowsIcon from "./assets/windows-icon.webp";
import LinuxIcon from "./assets/linux-icon.png";
import macIcon from "./assets/mac-icon.png";

// setup File
import windowsFile from "./setup/naps2-service-win.exe";
import linuxFile from "./setup/naps2-service-linux";
import macFile from "./setup/naps2-service-macos";

const axioInstance = axios.create({
  baseURL: "http://localhost:5000",
});

export default function ScannerApp() {
  const platform = window?.navigator?.platform?.split(" ")[0];
  const platform2 = window?.navigator?.userAgentData?.platform;
  console.log(platform, platform2);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [count, setCount] = useState(0);
  const [loader, setLoader] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Fetch scanner devices from backend

  useEffect(() => {
    getSdkInformation();
  }, []);

  const onClickHandler = (val = false) => {
    console.log(window.navigator);

    console.log(platform);
    if (platform === "Linux") {
      downloadFile(
        "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-linux-x64.deb",
        "naps2-8.2.0-linux-x64.deb"
      );
    } else if (platform === "Win32" || platform2 === "Windows") {
      downloadFile(
        "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-win-x64.exe",
        "naps2-8.2.0-win-x64.exe"
      );
    } else if (platform === "Macs") {
      downloadFile(
        "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-mac-univ.pkg",
        "naps2-8.2.0-mac-univ.pkg"
      );
    }
    setIsInstalled(val);
  };

  const windowSetupDownload = () => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-win-x64.exe",
      "naps2-8.2.0-win-x64.exe"
    );
    downloadFile(windowsFile, "naps2-service.exe");
  };
  const linuxSetupDownload = () => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-linux-x64.deb",
      "naps2-8.2.0-linux-x64.deb"
    );
    downloadFile(linuxFile, "naps2-service");
  };
  const macSetupDownload = () => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-mac-univ.pkg",
      "naps2-8.2.0-mac-univ.pkg"
    );
    downloadFile(macFile, "naps2-service");
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSdkInformation = async () => {
    try {
      await axioInstance
        .post(`/api/getDeviceInformation`, { os: platform2 || platform })
        .then((res) => {
          if (res.data.installed) {
            setIsInstalled(false);
          } else {
            console.log("Here");
            setIsInstalled(true);
          }
        });
    } catch (err) {
      console.error(err);
    }
  };

  const getDeviceList = async () => {
    setLoader(true);
    try {
      await axioInstance
        .post(`/api/devices`, { os: platform2 || platform })
        .then((res) => {
          setDevices(res.data);
          setLoader(false);
        });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error);
      setDevices([]);
      setLoader(false);
    }
  };

  const startScan = async () => {
    setImageBase64(null);
    if (!selectedDevice) return alert("Select a device first!");
    setLoader(true);
    let timer = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 1000);
    try {
      const res = await axioInstance.post(`/api/scan`, {
        device: selectedDevice.trim(),
        os: platform2 || platform,
      });
      if (res.status !== 200) {
        alert("Something went wrong. Please try again later!");
        setImageBase64(null);
        return;
      }
      const data = res.data;
      setLoader(false);
      setCount(0);
      clearInterval(timer);

      setImageBase64(data.imageBase64);
    } catch (err) {
      console.log(err);
      setLoader(false);
      setCount(0);
      clearInterval(timer);
      setImageBase64(null);
      console.log(err);
      if (err.status === 500) {
        alert("Please scan again.");
      }
    }
  };

  return (
    <>
      {isInstalled ? (
        <DialogBox open={isInstalled} onClickHandler={onClickHandler} />
      ) : (
        ""
      )}

      {loader ? (
        <div
          style={{
            background: "white",
            height: "100vh",
            width: "100vw",
            position: "fixed",
            opacity: "0.98",
            top: "0",
          }}
        >
          <div
            className="text-center flex justify-center items-center"
            style={{
              height: "100vh",
              width: "100vw",
            }}
          >
            <div>
              {devices && devices.length === 0 ? (
                <>
                  <div>
                    <img src={searchImage} />
                  </div>
                  <h3 className="text-stone-600 mt-4">getting devices...</h3>
                </>
              ) : (
                ""
              )}
              {selectedDevice ? (
                <>
                  <div>
                    <img src={scanImage} />
                  </div>
                  <h3 className="text-stone-600 mt-4">Scanning...</h3>
                </>
              ) : (
                ""
              )}
            </div>
            <div></div>
          </div>
        </div>
      ) : (
        ""
      )}

      <>
        <div className="flex h-screen w-screen">
          <div className="w-full p-6 bg-white shadow-md flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Scan PDF</h1>

            {devices && devices.length === 0 ? (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                onClick={getDeviceList}
              >
                Start
              </button>
            ) : (
              ""
            )}

            {devices && devices.length ? (
              <>
                <div>
                  <select
                    style={{ minWidth: "340px" }}
                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                    onChange={(e) => setSelectedDevice(e.target.value)}
                  >
                    <option value="">Select Device</option>
                    {devices.map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="bg-blue-600 px-5  h-10 rounded-2xl mt-6"
                  onClick={startScan}
                >
                  Scan Now
                </button>
              </>
            ) : (
              ""
            )}

            <div className="text-center mt-10">
              <p className="text-gray-600">
                ❗<b>Important : </b> For scanning, you’ll need the NAPS2
                application and the naps2-service file. <br/> You can download both
                files from the links provided below.
              </p>

              <div className="flex justify-center space-x-4 my-4">
                <img
                  src={windowsIcon}
                  alt="Windows Icon"
                  className="h-10 w-10 object-contain"
                  title="Windows"
                  onClick={windowSetupDownload}
                />
                <img
                  src={LinuxIcon}
                  alt="Linux Icon"
                  className="h-10 w-10 object-contain mx-8"
                  title="Linux"
                  onClick={linuxSetupDownload}
                />

                <img
                  src={macIcon}
                  alt="Mac Icon"
                  className="h-10 w-10 object-contain"
                  title="Mac"
                  onClick={macSetupDownload}
                />
              </div>
            </div>
          </div>
        </div>
      </>

      {imageBase64 ? (
        <div className="w-full h-screen p-6 bg-gray-100 shadow-md">
          {imageBase64 ? (
            <div className="mt-6 p-4">
              <iframe
                src={`data:application/pdf;base64,${imageBase64}`}
                width="100vw"
                title="preview of pdf"
                height="100vh"
              >
                <p>
                  Your browser does not support iframes. You can{" "}
                  <a
                    href={`data:application/pdf;base64,${imageBase64}`}
                    download="your_document.pdf"
                  >
                    download the PDF
                  </a>{" "}
                  instead.
                </p>
              </iframe>
            </div>
          ) : (
            <div className="w-full h-full border border-gray-300 flex justify-center items-center bg-gray-100">
              <h6 className="text-gray-950">
                <b>
                  This section displays a live preview of the scanned document.
                </b>
              </h6>
            </div>
          )}
        </div>
      ) : (
        ""
      )}
    </>
  );
}
