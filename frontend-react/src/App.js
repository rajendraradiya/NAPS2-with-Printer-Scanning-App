import React, { useState, useEffect } from "react";
import searchImage from "../src/assets/searching.gif";
import scanImage from "../src/assets/scan.gif";
import DialogBox from "../src/components/DialogBox";
import axios from "axios";

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
    console.log(platform2 || platform);
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
      <div style={{ width: "100vw" }} className="flex justify-center">
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
                    <h3 className="text-stone-600 mt-4">Scanning...{count}</h3>
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
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 ">NAPS2 SCANNER</h1>
          <table className="border-1">
            <thead>
              <tr>
                <td>Windows</td>
                <td>Linux</td>
                <td>Mac</td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <a href="https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-win-x64.exe">
                    <i className="fa fa-download fa-fw"></i>Download
                  </a>
                </td>
                <td>
                  <a href="https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-linux-x64.deb">
                    <i className="fa fa-download fa-fw"></i>Download
                  </a>
                </td>
                <td>
                  <a href="https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-mac-univ.pkg">
                    <i className="fa fa-download fa-fw"></i>Download
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          {devices && devices.length === 0 ? (
            <button
              className="bg-blue-500 w-50 h-10 rounded-2xl"
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
                className="bg-blue-600 w-50 h-10 rounded-2xl mt-6"
                onClick={startScan}
              >
                Scan Now
              </button>
            </>
          ) : (
            ""
          )}

          {imageBase64 && (
            <div className="mt-6 p-4">
              <iframe
                src={`data:application/pdf;base64,${imageBase64}`}
                width="100%"
                height="600px"
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
          )}
        </div>
      </div>
    </>
  );
}
