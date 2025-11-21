const PrintPreview = ({
  imageBase64 = null,
  onNext,
  onSave,
  isNewScanCopy = false,
}) => {
  return (
    <>
      <div
        className="w-full flex flex-col h-screen shadow-md"
        style={{ backgroundColor: "#2c2929" }}
      >
        {imageBase64 ? (
          <>
            <div className="px-4 pt-4">
              <iframe
                src={`data:application/pdf;base64,${imageBase64}#toolbar=0`}
                width="100%"
                title="preview of pdf"
                height="100%"
                style={{ height: "90vh" }}
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
            <div
              className="flex justify-center items-center"
              style={{ height: "10vh" }}
            >
              {/* <button
                className={`${
                  !isNewScanCopy ? "bg-gray-600" : "bg-blue-600"
                } px-4  h-8 rounded-lg mr-2`}
                onClick={() => onSave(imageBase64)}
                disabled={!isNewScanCopy}
              >
                Save Page
              </button> */}
              <button
                className="bg-blue-600 px-4  h-8 rounded-lg"
                onClick={() => onNext(imageBase64)}
                disabled={!isNewScanCopy}
              >
                Next Page Scan
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full border border-gray-300 flex justify-center items-center bg-gray-100">
            <h6 className="text-gray-500 text-center">
              This section displays a live preview of the scanned document.
            </h6>
          </div>
        )}
      </div>
    </>
  );
};

export default PrintPreview;
