import React, { useState } from "react";

export default function MpnDownloadGuide({
  open = false,
  onCloseDialogBox,
  onWindows,
  onLinux,
  onMac,
  downloadName,
}) {
  const [tab, setTab] = useState("windows");
  const [copied, setCopied] = useState("");

  const steps = {
    windows: [
      {
        title: `Download ${downloadName}-Windows.exe`,
        desc: `Click the download button to save ${downloadName}-Windows.exe to your Downloads folder.`,
        btnText: `Download ${downloadName}-Windows.exe`,
        type: "windows",
      },
      {
        title: "Go to folder of download",
        desc: `Open File Explorer and navigate to the folder where you saved ${downloadName}-Windows.exe (usually Downloads).`,
      },
      {
        title: "Run as administrator",
        desc: `Right‑click ${downloadName}-Windows.exe and choose ‘Run as administrator’ to allow installer permissions.`,
      },
      {
        title: "Allow local network access",
        desc: "When Windows Security prompts you, allow “Local network access” and click Allow to continue.",
        image: "step-four.gif",
      },
      {
        title: "Scan now",
        desc: "After installation finishes, open the EHR portal, navigate to the Documents section, and click ‘Scan now’ to restart the scan.",
      },
    ],
    linux: [
      {
        title: `Download ${downloadName}-Linux.run`,
        desc: `Save ${downloadName}-Linux.run to a folder (usually Downloads).`,
        btnText: `Download ${downloadName}-Linux.run`,
        type: "linux",
      },
      {
        title: "Make it executable",
        desc: "Run the chmod command so the file can be executed.",
        cmd: `sudo chmod +x ${downloadName}-Linux.run`,
      },
      {
        title: "Run the installer",
        desc: "Execute the file with sudo to perform the install.",
        cmd: `sudo ./${downloadName}-Linux.run`,
      },

      {
        title: "Scan now",
        desc: "After installation finishes, open the EHR portal, navigate to the Documents section, and click ‘Scan now’ to restart the scan.",
      },
    ],
    macos: [
      {
        title: `Download ${downloadName}-MacOS.pkg`,
        desc: `Save ${downloadName}-MacOS.pkg to a folder (usually Downloads).`,
        btnText: `Download ${downloadName}-MacOS.pkg`,
        type: "macos",
      },
      {
        title: "Install the application",
        desc: "Double-click the downloaded file and follow the installation steps.",
      },
      {
        title: "Installation completed",
        desc: "The application has been successfully installed on your Mac.",
      },
      {
        title: "Scan now",
        desc: "After installation finishes, open the EHR portal, navigate to the Documents section, and click ‘Scan now’ to restart the scan.",
      },
    ],
  };

  function handleCopy(text, key) {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(key);
        setTimeout(() => setCopied(""), 2000);
      })
      .catch(() => {
        setCopied("");
      });
  }

  return (
    <div className="fixed h-screen items-center justify-center ">
      {open && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className=" flex items-start justify-center">
              <div className="w-[60vw] w-full bg-white rounded-2xl shadow-lg p-6 md:p-10 ">
                <header className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl text-gray-500 md:text-3xl font-semibold">
                      Instruction
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Step-by-step instructions for Windows and Linux users
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg bg-gray-100 p-1">
                      <button
                        onClick={() => setTab("windows")}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          tab === "windows"
                            ? "bg-white text-blue-300 shadow"
                            : "text-gray-600"
                        }`}
                      >
                        Windows
                      </button>
                      <button
                        onClick={() => setTab("linux")}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          tab === "linux"
                            ? "bg-white text-blue-300  shadow"
                            : "text-gray-600"
                        }`}
                      >
                        Linux
                      </button>
                      <button
                        onClick={() => setTab("macos")}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          tab === "macos"
                            ? "bg-white text-blue-300  shadow"
                            : "text-gray-600"
                        }`}
                      >
                        Mac
                      </button>
                    </div>
                  </div>
                </header>

                <main className="h-[60vh] overflow-y-auto custom-scrollbar">
                  <ol className="space-y-4">
                    {steps[tab].map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100"
                      >
                        <div className="flex-none">
                          <div className="w-10 h-10 rounded-full bg-blue-300  border flex items-center justify-center text-sm font-semibold">
                            {i + 1}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="w-[100%]">
                              <h3 className="text-lg text-blue-300 font-semibold">
                                {s.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">
                                {s.desc}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 w-[280px]">
                              {s.type === "windows" && (
                                <h4
                                  href="#"
                                  onClick={onWindows}
                                  className="inline-flex items-center bg-blue-500 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-500"
                                >
                                  {s.btnText || "Download"}
                                </h4>
                              )}
                              {s.type === "linux" && (
                                <h4
                                  href="#"
                                  onClick={onLinux}
                                  className="inline-flex items-center bg-blue-500 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-500"
                                >
                                  {s.btnText || "Download"}
                                </h4>
                              )}
                              {s.type === "macos" && (
                                <h4
                                  href="#"
                                  onClick={onMac}
                                  className="inline-flex items-center bg-blue-500 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-500"
                                >
                                  {s.btnText || "Download"}
                                </h4>
                              )}
                            </div>
                          </div>

                          {s.cmd && (
                            <div className="mt-3 flex items-center gap-3">
                              <pre className="flex-1 rounded-md p-3 bg-black/85 text-white text-sm overflow-auto">
                                {s.cmd}
                              </pre>
                              <button
                                onClick={() => handleCopy(s.cmd, `${tab}-${i}`)}
                                className="px-3 py-2 bg-white border rounded-md text-sm hover:bg-gray-50"
                              >
                                {copied === `${tab}-${i}` ? "Copied" : "Copy"}
                              </button>
                            </div>
                          )}
                          {s.image && (
                            <div className="mt-3">
                              <img src={s.image} alt={s.title} />
                            </div>
                          )}

                          {/* Helpful tips */}
                          {tab === "windows" && i === 2 && (
                            <>
                              {/* <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                                Tip: If UAC prompts appear, accept them to
                                allow // installation as administrator.
                              </p> */}
                            </>
                          )}

                          {tab === "linux" && i === 1 && (
                            <p className="mt-3 text-sm text-gray-600">
                              You may need to enter your password after running
                              the sudo command.
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </main>
                <footer>
                  <div className="mt-6 flex justify-end gap-3">
                    {/* <button
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                      onClick={() => window.open("chrome://downloads")}
                    >
                      Open download folder
                    </button> */}
                    <button
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                      onClick={onCloseDialogBox}
                    >
                      Ok
                    </button>
                    {/* <button
                      onClick={() =>
                        alert(
                          'When installed, open MPN Core and click "Scan now"'
                        )
                      }
                      className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50"
                    >
                      What next?
                    </button> */}
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
