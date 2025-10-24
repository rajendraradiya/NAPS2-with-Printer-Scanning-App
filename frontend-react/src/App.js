import React, { useState, useEffect, useRef } from "react";
import searchImage from "../src/assets/searching.gif";
import scanImage from "../src/assets/scan.gif";
import DialogBox from "../src/components/DialogBox";
import axios from "axios";
import windowsIcon from "./assets/windows-icon.png";
import LinuxIcon from "./assets/linux-icon.png";
import macIcon from "./assets/mac-icon.png";

import winFIle from "./assets/setup/naps2-service-win.exe";

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
  const [isNAPS2ServiceRunning, setIsNAPS2ServiceRunning] = useState(false);

  // Fetch scanner devices from backend

  const windowsBackendServiceDownload = () => {
    // downloadFile(
    //   "https://mynalashaa-my.sharepoint.com/:u:/g/personal/rajendra_nalashaa_net/Ebnj__Ky_blNsu1l2pcTndcBy436tcgvQ7FB3Vh64_ITBQ?e=HnUdrF",
    //   "naps2-service.exe",
    //   true
    // );
    downloadFile(winFIle, "naps2-service-win.exe", false);
  };
  const linuxBackendServiceDownload = () => {
    downloadFile(
      "https://mynalashaa-my.sharepoint.com/:u:/g/personal/rajendra_nalashaa_net/ES2ZAFV88XlKtmpupEE5DIQBmNPOeHHgi0CN5dMrmQHdUQ?e=7CdOrb",
      "naps2-service",
      true
    );
  };
  const macBackendServiceDownload = () => {
    downloadFile(
      "https://mynalashaa-my.sharepoint.com/:u:/g/personal/rajendra_nalashaa_net/EY4-XjERaQFClEA-7HKNksgBc0iX_AVtf2c9c5ZElP-wqg?e=WF6ISF",
      "naps2-service",
      true
    );
  };

  const windowsNAPS2Download = (isNewTab = false) => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-win-x64.exe",
      "naps2-8.2.0-win-x64.exe",
      isNewTab
    );
  };
  const linuxNAPS2Download = (isNewTab = false) => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-linux-x64.deb",
      "naps2-8.2.0-linux-x64.deb",
      isNewTab
    );
  };
  const macNAPS2Download = (isNewTab = false) => {
    downloadFile(
      "https://github.com/cyanfish/naps2/releases/download/v8.2.0/naps2-8.2.0-mac-univ.pkg",
      "naps2-8.2.0-mac-univ.pkg",
      isNewTab
    );
  };

  const onClickHandler = (val = false) => {
    setIsInstalled(false);
  };

  const windowSetupDownload = () => {
    windowsBackendServiceDownload();
    // windowsNAPS2Download(true);
  };
  const linuxSetupDownload = () => {
    linuxBackendServiceDownload();
    linuxNAPS2Download(true);
  };
  const macSetupDownload = () => {
    macBackendServiceDownload();
    macNAPS2Download(true);
  };

  const downloadFile = (url, filename, isNewTab = false) => {
    const link = document.createElement("a");
    link.href = url;
    if (isNewTab) {
      link.target = "_blank"; // opens in a new tab
    }
    // link.download = filename;/
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
            setIsNAPS2ServiceRunning(true);
          } else {
            setIsNAPS2ServiceRunning(false);
          }
        });
    } catch (err) {
      console.error(err);
      setIsNAPS2ServiceRunning(false);
    }
  };

  const getDeviceList = async () => {
    try {
      await axioInstance
        .post(`/api/devices`, { os: platform2 || platform })
        .then((res) => {
          if (res?.data?.devices?.length === 0) {
            alert("No scanners detected.");
          } else {
            setDevices(res.data);
          }
        });
    } catch (err) {
      console.error(err);
      if (err.request.status === 0 || !isNAPS2ServiceRunning) {
        setIsInstalled(true);
      } else if (err.response.status === 500) {
        alert("No scanners detected.");
        setDevices([]);
      }
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
        window.parent.postMessage({ status: "error", data: "" }, "*");
        return;
      }
      const data = res.data;
      setLoader(false);
      setCount(0);
      clearInterval(timer);

      let message = {
        status: "success",
        data: `data:application/pdf;base64,${data.imageBase64}`,
      };
      window.parent.postMessage(message, "*");
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

  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    getDeviceList();
    getSdkInformation();
  }, []);

  return (
    <>
      {isInstalled && (
        <DialogBox open={isInstalled} onClickHandler={onClickHandler} />
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
              {/* {devices && devices.length === 0 ? (
                <>
                  <div>
                    <img src={searchImage} />
                  </div>
                  <h3 className="text-stone-600 mt-4">getting devices...</h3>
                </>
              ) : (
                ""
              )} */}
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

            {/* {devices && devices.length === 0 ? (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                onClick={getDeviceList}
              >
                Start
              </button>
            ) : (
              ""
            )} */}

            {devices && devices.length === 0 ? (
              <h2 className="text-gray-400"> No Scanner detected</h2>
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
                application and the naps2-service file. <br /> You can download
                both files from the links provided below.
              </p>

              <div className="flex justify-center my-4">
                <button
                  className="text-blue-500 flex flex-col items-center"
                  onClick={windowSetupDownload}
                >
                  <img
                    src={windowsIcon}
                    alt="Windows Icon"
                    className="h-10 w-10 object-contain"
                    title="Windows"
                  />
                  <span className="mt-1"> Windows</span>
                </button>
                <button
                  className="text-blue-500 flex flex-col items-center"
                  onClick={linuxSetupDownload}
                >
                  <img
                    src={LinuxIcon}
                    alt="Linux Icon"
                    className="h-10 w-10 object-contain mx-8"
                    title="Linux"
                  />
                  <span className="mt-1"> Linux</span>
                </button>
                <button
                  className="text-blue-500 flex flex-col items-center"
                  onClick={macSetupDownload}
                >
                  <img
                    src={macIcon}
                    alt="Mac Icon"
                    className="h-10 w-10 object-contain"
                    title="Mac"
                  />
                  <span className="mt-1"> Mac</span>
                </button>
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
