import scanImage from "../assets/scan.gif";

const ScannerLoader = ({ loader, selectedDevice }) => {
  return (
    <>
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
              {selectedDevice ? (
                <>
                  <div>
                    <img src={scanImage} alt="scanner loader" />
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
    </>
  );
};

export default ScannerLoader;
