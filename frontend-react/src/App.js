import { useState, useEffect, useRef } from "react";
import DialogBox from "../src/components/DialogBox";
import axios from "axios";
import windowsIcon from "./assets/windows-icon.png";
import LinuxIcon from "./assets/linux-icon.png";
import macIcon from "./assets/mac-icon.png";

// import winFIle from "/setup/mpn-core-win.EXE";
// import linuxFile from "/setup/mpn-core-linux.deb";
// import macFile from "/setup/mpn-core-mac.pkg";
import DeviceLoader from "./components/DeviceLoader";
import ScannerLoader from "./components/ScannerLoader";
import InformationCard from "./components/InformationCard";

const axioInstance = axios.create({
  baseURL: "http://localhost:52345",
});

export default function ScannerApp() {
  const platform = window?.navigator?.platform?.split(" ")[0];
  const platform2 = window?.navigator?.userAgentData?.platform;
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [count, setCount] = useState(0);
  const [loader, setLoader] = useState(false);
  const [deviceLoader, setDeviceLoader] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [openDialogBox, setOpenDialogBox] = useState(false);
  const [isNAPS2ServiceRunning, setIsNAPS2ServiceRunning] = useState(false);

  // Fetch scanner devices from backend

  const windowsBackendServiceDownload = () => {
    downloadFile('setup/mpn-core-win.EXE', "naps2-service-win.exe", false);
  };
  const linuxBackendServiceDownload = () => {
    downloadFile("setup/mpn-core-linux.deb", "mpn-core-linux.deb", false);
  };
  const macBackendServiceDownload = () => {
    downloadFile('setup/mpn-core-mac.pkg', "mpn-core-mac.pkg", false);
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

  const windowSetupDownload = () => {
    windowsBackendServiceDownload();
    windowsNAPS2Download(true);
    // openDirectory();
  };
  const linuxSetupDownload = () => {
    linuxBackendServiceDownload();
    linuxNAPS2Download(true);
    // openDirectory();
  };
  const macSetupDownload = () => {
    macBackendServiceDownload();
    macNAPS2Download(true);
    // openDirectory();
  };

  const downloadFile = (url, filename, isNewTab = false) => {
    const link = document.createElement("a");
    link.href = url;
    if (isNewTab) {
      link.target = "_blank"; // opens in a new tab
    }
    link.download = filename; // this controls the saved filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDirectory = async () => {
    try {
      await axioInstance.post(`/api/location`).then((res) => {});
    } catch (err) {
      console.error(err);
    }
  };

  const getSdkInformation = async () => {
    try {
      await axioInstance
        .post(`/api/getDeviceInformation`, { os: platform2 || platform })
        .then((res) => {
          if (res.data.installed) {
            setIsInstalled(true);
          } else {
            setIsInstalled(false);
            setOpenDialogBox(true);
          }
          setIsNAPS2ServiceRunning(true);
        });
    } catch (err) {
      console.error(err);
      setIsNAPS2ServiceRunning(false);
      setOpenDialogBox(true);
    }
  };

  const getDeviceList = async () => {
    setDeviceLoader(true);
    try {
      await axioInstance
        .post(`/api/devices`, { os: platform2 || platform })
        .then((res) => {
          if (res?.data?.devices?.length === 0) {
            alert("No scanners detected.");
          } else {
            setDevices(res.data);
          }
          setDeviceLoader(false);
        });
    } catch (err) {
      console.error(err);
      setDeviceLoader(false);
      if (err.request.status === 0 || !isNAPS2ServiceRunning) {
        setIsInstalled(false);
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
      // setImageBase64(data.imageBase64);
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
      <DialogBox
        open={openDialogBox}
        onCloseDialogBox={() => setOpenDialogBox(false)}
      />
      <InformationCard
        isInstalled={isInstalled}
        isNAPS2ServiceRunning={isNAPS2ServiceRunning}
      />
      <ScannerLoader loader={loader} selectedDevice={selectedDevice} />

      <>
        <div className="flex h-screen w-screen">
          <div className="w-full p-6 bg-white shadow-md flex flex-col items-center justify-center">
            {/* <h1 className="text-2xl font-bold text-gray-800 mb-4">Scan PDF</h1> */}

            <DeviceLoader deviceLoader={deviceLoader} devices={devices} />

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
                width="100%"
                title="preview of pdf"
                height="100%"
                style={{ height: "100vh" }}
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
