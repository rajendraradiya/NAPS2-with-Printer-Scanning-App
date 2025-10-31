import correctIcon from "../assets/correct-icon.png";
import closeIcon from "../assets/close-icon.png";

const InformationCard = ({ isInstalled, isNAPS2ServiceRunning }) => {
  return (
    <>
      {!isInstalled || !isNAPS2ServiceRunning ? (
        <div
          style={{
            background: "white",
            position: "fixed",
            opacity: "0.98",
            width: "220px",
            top: "0",
            right: "10px",
          }}
          className="px-4 pt-2 pb-4 mt-2 border border-cyan-400"
        >
          <h4 className="text-blue-800 mb-2 pb-1 mt-0 border-b border-cyan-200">
            Information
          </h4>
          {!isInstalled && (
            <div className="flex items-center">
              <img
                style={{ height: "20px" }}
                src={isInstalled ? correctIcon : closeIcon}
                className="mr-6"
                alt="naps2-icon"
              ></img>
              <h2 className="text-blue-950">NAPS2</h2>
            </div>
          )}
          {!isNAPS2ServiceRunning && (
            <div className="flex items-center pt-2">
              <img
                style={{ height: "20px" }}
                src={isNAPS2ServiceRunning ? correctIcon : closeIcon}
                className="mr-6"
                alt="naps2-icon"
              ></img>
              <h2 className="text-blue-950">MPN Core Service</h2>
            </div>
          )}
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default InformationCard;
