
const PrintPreview = ({
  imageBase64 = null,
  onNext,
  onSave,
  printList = null,
  reset,
}) => {

  const downloadBase64Pdf = () => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${imageBase64}`;
    link.download = `scan-document.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  Your browser does not support iframes. You can
                  <a
                    href={`data:application/pdf;base64,${imageBase64}`}
                    download="your_document.pdf"
                  >
                    download the PDF
                  </a>
                  instead.
                </p>
              </iframe>
            </div>
            <div
              className="flex justify-center items-center"
              style={{ height: "10vh" }}
            >
              <button
                className="bg-blue-600 px-4  h-8 rounded-lg mr-2"
                onClick={() => onNext(imageBase64)}
              >
                Next Page Scan
              </button>
              {printList && printList.length && (
                <button
                  className="bg-blue-600 px-4  h-8 rounded-lg mr-2"
                  onClick={onSave}
                >
                  Save
                </button>
              )}
              <button
                className="bg-red-600 px-4  h-8 rounded-lg mr-2"
                onClick={() => reset(false)}
              >
                Cancel
              </button>

              <button
                className=" px-4  h-8 rounded-md flex bg-gray-600"
                onClick={() => downloadBase64Pdf()}
              >
                <svg
                className="mt-1"
                  fill="WHITE"
                  width="20px"
                  height="20px"
                  viewBox="0 0 1920 1920"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M533.333 560v160H240l.008 453.33 209.066 213.34H1470.93l209.06-213.34L1680 720h-293.33V560h352c55.96 0 101.33 45.368 101.33 101.333v511.997h16c35.35 0 64 28.66 64 64V1856c0 35.35-28.65 64-64 64H64c-35.346 0-64-28.65-64-64v-618.67c0-35.34 28.654-64 64-64h16V661.333C80 605.368 125.369 560 181.333 560h352ZM1040 0v958.86l183.43-183.429 113.14 113.138L960 1265.14 583.431 888.569l113.138-113.138L880 958.86V0h160Z" />
                </svg>
                <span className="ml-2 mt-1"> Export</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full border border-gray-300 flex flex-col justify-center items-center bg-gray-100">
            <h6 className="text-gray-500 text-center">
              This section displays a live preview of the scanned document.
            </h6>
            <div
              className="flex justify-center items-center"
              style={{ height: "10vh" }}
            >
              <button
                className="bg-blue-600 px-4  h-8 rounded-lg mr-2"
                onClick={() => onNext(imageBase64)}
              >
                Scan Again
              </button>
              {/* <button
                className="bg-blue-600 px-4  h-8 rounded-lg mr-2"
                onClick={backToHamePage}
              >
                Home Page
              </button> */}
              {printList && printList.length && (
                <button
                  className="bg-blue-600 px-4  h-8 rounded-lg"
                  onClick={onSave}
                >
                  Save
                </button>
              )}
              <button
                className="bg-red-600 px-4  h-8 rounded-lg"
                onClick={() => reset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PrintPreview;
