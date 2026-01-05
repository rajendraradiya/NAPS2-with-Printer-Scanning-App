export default function MessageDialog({ open = false, onCloseDialogBox }) {
  const isWindows =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("windows");

  const steps = [
    {
      text: "Download and install MPN Core to enable scanning.",
    },
    ...(isWindows
      ? [
          {
            text: "When prompted by Windows Security, allow Local Network Access.",
            showGif: true,
          },
        ]
      : []),
    {
      text: "Close this window once installation is complete.",
    },
    {
      text: "Open the scan again to continue.",
    },
  ];

  return (
    <div className="fixed h-screen items-center justify-center">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800">
              One-time setup required
            </h2>

            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  {step.showGif ? (
                    <div>
                      <div style={{ display: "flex" }}>
                        <span
                          style={{ width: "38px" }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white"
                        >
                          {index + 1}
                        </span>
                        <p className="text-gray-600 pl-4">{step.text}</p>
                      </div>

                      <div>
                        <img
                          src="mini-instruction.gif"
                          alt="Allow Local Network Access"
                          className="mt-3 w-full rounded-lg border"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                        {index + 1}
                      </span>
                      <p className="text-gray-600">{step.text}</p>
                    </>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 flex justify-end">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={onCloseDialogBox}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
