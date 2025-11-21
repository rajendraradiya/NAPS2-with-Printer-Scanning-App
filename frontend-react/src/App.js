import { useState, useEffect, useRef } from "react";
import DialogBox from "../src/components/DialogBox";
import axios from "axios";
import windowsIcon from "./assets/windows-icon.png";
import LinuxIcon from "./assets/linux-icon.png";
import macIcon from "./assets/mac-icon.png";

// import winFIle from "/setup/mpn-core-win.EXE";
// import linuxFile from "/setup/mpn-core-linux.run";
// import macFile from "/setup/mpn-core-mac.pkg";
import DeviceLoader from "./components/DeviceLoader";
import ScannerLoader from "./components/ScannerLoader";
import InformationCard from "./components/InformationCard";
import PrintPreview from "./components/PrintPreview";
import { file } from "./components/temp";
import MiniPrintPreview from "./components/MiniPrintPreview";

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
  const [printList, setPrintList] = useState([]);
  const [isNewScanCopy, setIsNewScanCopy] = useState(false);

  const windowSetupDownload = () => {
    downloadFile("/setup/mpn-core-win.EXE", "mpn-core-win.EXE", false);
  };
  const linuxSetupDownload = () => {
    downloadFile("/setup/mpn-core.run", "mpn-core.run", false);
  };
  const macSetupDownload = () => {
    downloadFile("/setup/mpn-core-mac.pkg", "mpn-core-mac.pkg", false);
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
          setIsInstalled(true);
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

      // let message = {
      //   status: "success",
      //   data: `data:application/pdf;base64,${data.imageBase64}`,
      // };
      setImageBase64(data.imageBase64);
      setIsNewScanCopy(true);
      // window.parent.postMessage(message, "*");
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

  const onRefreshHandler = () => {
    getDeviceList();
    getSdkInformation();
  };

  const onSave = (base64File = null) => {
    console.log("calling", base64File);
    if (!base64File || !isNewScanCopy) return;
    setIsNewScanCopy(false);
    setPrintList((prev) => [...prev, base64File]);
  };

  const onPreview = (base64File = null) => {
    if (!base64File) return;
    setImageBase64(base64File);
  };
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
        <div className="h-screen w-screen flex flex-row">
          <div
            className="w-full p-6 bg-white shadow-md flex flex-col items-center justify-center"
            style={{ width: "80%" }}
          >
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
              <button
                className="bg-blue-600 px-5  h-10 rounded-2xl mt-6"
                onClick={onRefreshHandler}
              >
                Refresh
              </button>
            )}

            <div className="text-center mt-10">
              <p className="text-gray-600">
                ❗<b>Important : </b> For scanning, you’ll need the NAPS2
                application and the mpn core file. <br /> You can download both
                files from the links provided below.
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

          <MiniPrintPreview printList={printList} onPreview={onPreview} />

          <div
            className="w-full bg-white shadow-md flex flex-col items-center justify-center col-4"
            style={{ width: "50%" }}
          >
            <PrintPreview
              imageBase64={imageBase64}
              onSave={onSave}
              isNewScanCopy={isNewScanCopy}
              onNext={startScan}
            />
          </div>
        </div>
      </>
    </>
  );
}
