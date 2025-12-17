export default function MessageDialog({ open = false, onCloseDialogBox }) {
  return (
    <div className="fixed h-screen items-center justify-center">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800">
              Please complete one-time setup
            </h2>
            <p className="mt-2 text-gray-600">
              For this scanning process, MPN Core service is
              required. Please download and install.
            </p>

            <div className="mt-4 flex justify-end space-x-2">
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
