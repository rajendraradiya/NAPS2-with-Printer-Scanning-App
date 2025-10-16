import { useState } from "react";

export default function TailwindDialog({
  open,
  onClickHandler,
  isServiceRunning,
}) {
  return (
    <div className="flex h-screen items-center justify-center">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800">
              Please complete one-time setup
            </h2>
            <p className="mt-2 text-gray-600">
              {!isServiceRunning
                ? "It looks like the NAPS2 service isn’t running. You can download it from the link below."
                : "For this scanning process, NAPS2 SDK and naps2-service is required. Please download and install."}
            </p>

            {/* Actions */}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => onClickHandler(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => onClickHandler(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
