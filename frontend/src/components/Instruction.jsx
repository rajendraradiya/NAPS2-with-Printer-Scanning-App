import windowsIcon from "../assets/windows-icon.png";
import LinuxIcon from "../assets/linux-icon.png";
import MacIcon from "../assets/macos-icon.jpg";

export default function InstructionComponent({
  openGuidelineDialog,
  onWindows,
  onLinux,
  onMac,
}) {
  return (
    <>
      <div className="text-center mt-10">
        <p className="text-gray-600">
          ❗<b>Important : </b> To enable scanning, please download & install
          the ECLIPSE EHR Cloud Scanning Utility using the appropriate link
          (e.g. Windows) below. <br /> For more detailed instructions, please{" "}
          <b onClick={() => openGuidelineDialog()} className="text-blue-500">
            click here.
          </b>
        </p>

        <div className="flex justify-center my-4">
          <button
            className="text-blue-500 flex flex-col items-center"
            onClick={onWindows}
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
            onClick={onLinux}
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
            onClick={onMac}
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
    </>
  );
}
