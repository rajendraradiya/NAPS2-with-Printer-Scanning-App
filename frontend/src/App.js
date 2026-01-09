import { useState, useEffect, useRef } from "react";
import DialogBox from "./components/DialogBox";
import axios from "axios";
import windowsIcon from "./assets/windows-icon.png";
import LinuxIcon from "./assets/linux-icon.png";
import MacIcon from "./assets/macos-icon.jpg";
import DeviceLoader from "./components/DeviceLoader";
import ScannerLoader from "./components/ScannerLoader";
import InformationCard from "./components/InformationCard";
import PrintPreview from "./components/PrintPreview";
import MiniPrintPreview from "./components/MiniPrintPreview";
import MpnDownloadGuide from "./components/MpnDownloadGuide";
import { PDFDocument } from "pdf-lib";

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
  const [openGuidelineDialogBox, setOpenGuidelineDialogBox] = useState(false);
  const [isNAPS2ServiceRunning, setIsNAPS2ServiceRunning] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [printList, setPrintList] = useState([]);
  const [isNewScanCopy, setIsNewScanCopy] = useState(false);
  const [isLoadedPage, setIsLoadedPage] = useState(false);

  const windowSetupDownload = () => {
    downloadFile("./mpn-software-win.EXE", "mpn-software-win.EXE", false);
  };
  const linuxSetupDownload = () => {
    downloadFile("./mpn-core-linux.run", "mpn-core-linux.run", false);
  };
  const macSetupDownload = () => {
    downloadFile("./mpn-core-mac.pkg", "mpn-core-mac.pkg", false);
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

  function uint8ToBase64(uint8Array) {
    let binary = "";
    const chunkSize = 0x8000; // 32KB chunks

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
    }

    return btoa(binary);
  }

  async function mergeMultipleBase64Pdfs(base64Pdfs) {
    const mergedPdf = await PDFDocument.create();

    for (const base64 of base64Pdfs) {
      const cleaned = base64.replace(/^data:application\/pdf;base64,/, "");
      const pdfBytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    // ✅ SAFE conversion
    return uint8ToBase64(mergedBytes);
  }

  const getSdkInformation = async () => {
    setIsFirstTime(true);
    try {
      await axioInstance
        .post(`/api/getDeviceInformation`, { os: platform2 || platform })
        .then((res) => {
          setIsFirstTime(false);
          setIsLoadedPage(true);
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
      setIsLoadedPage(true);
      setIsNAPS2ServiceRunning(false);
      setOpenDialogBox(true);
    }
  };

  const getDeviceList = async () => {
    const savedDevice = localStorage.getItem("selectedDevice");
    if (savedDevice) {
      setSelectedDevice(savedDevice);
      setDevices([savedDevice]);
    } else {
      setDeviceLoader(true);
    }

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
      localStorage.setItem("selectedDevice", selectedDevice.trim());
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

      setImageBase64(data.imageBase64);
      setIsNewScanCopy(true);
      setPrintList((prev) => [...prev, data.imageBase64]);
    } catch (err) {
      console.log(err);
      setLoader(false);
      setCount(0);
      clearInterval(timer);
      if (printList && printList.length > 1) {
        setImageBase64(printList[printList.length - 1]);
      } else {
        setImageBase64(null);
      }
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

  const scanNexPage = (base64File = null) => {
    // if (!base64File || !isNewScanCopy) return;
    // setIsNewScanCopy(false);
    startScan();
  };

  const onPreview = (base64File = null) => {
    if (!base64File) return;
    setImageBase64(base64File);
  };

  const onSendToBackend = async () => {
    const mergedBase64Pdf = await mergeMultipleBase64Pdfs(printList);
    let message = {
      status: "success",
      data: mergedBase64Pdf,
    };
    window.parent.postMessage(message, "*");
  };

  const resetForScan = () => {};

  return (
    <>
      <DialogBox
        open={openDialogBox}
        onCloseDialogBox={() => setOpenDialogBox(false)}
      />
      {isLoadedPage && (
        <InformationCard
          isInstalled={isInstalled}
          isNAPS2ServiceRunning={isNAPS2ServiceRunning}
        />
      )}

      <ScannerLoader loader={loader} selectedDevice={selectedDevice} />

      <MpnDownloadGuide
        open={openGuidelineDialogBox}
        onCloseDialogBox={() => setOpenGuidelineDialogBox(false)}
      />
      <>
        <div className="h-screen w-screen flex flex-row">
          {printList && printList.length === 0 ? (
            <>
              <div
                className="w-full p-6 bg-white shadow-md flex flex-col items-center justify-center"
                style={{ width: "100%" }}
              >
                <DeviceLoader deviceLoader={deviceLoader} devices={devices} />

                {devices && devices.length ? (
                  <>
                    <div>
                      <select
                        value={selectedDevice}
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
                    <div>
                      <button
                        className="bg-blue-600 px-5  h-10 rounded-2xl mt-6 mr-4"
                        onClick={startScan}
                      >
                        Scan Now
                      </button>
                    </div>
                  </>
                ) : (
                  <></>
                )}

                {isFirstTime ? (
                  <>
                    <button
                      className="bg-blue-600 px-5  h-10 rounded-2xl mt-6"
                      onClick={onRefreshHandler}
                    >
                      Refresh
                    </button>
                  </>
                ) : (
                  <></>
                )}

                <div className="text-center mt-10">
                  <p className="text-gray-600">
                    ❗<b>Important : </b> To enable scanning, please download &
                    install the ECLIPSE EHR Cloud Scanning Utility using the
                    appropriate link (e.g. Windows) below. <br /> For more
                    detailed instructions, please{" "}
                    <b
                      onClick={() => setOpenGuidelineDialogBox(true)}
                      className="text-blue-500"
                    >
                      click here.
                    </b>
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
                        src={MacIcon}
                        alt="Mac Icon"
                        className="h-10 w-10 object-contain"
                        title="Mac Icon"
                      />
                      <span className="mt-1"> Mac</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}

          {printList && printList.length >= 1 && (
            <>
              <MiniPrintPreview printList={printList} onPreview={onPreview} />
              <div
                className="w-full bg-white shadow-md flex flex-col items-center justify-center col-4"
                style={{
                  width: "100%",
                }}
              >
                <PrintPreview
                  printList={printList}
                  imageBase64={imageBase64}
                  onNext={scanNexPage}
                  onSave={onSendToBackend}
                  isNewScanCopy={isNewScanCopy}
                  backToHamePage={resetForScan}
                />
              </div>
            </>
          )}
        </div>
      </>
    </>
  );
}
