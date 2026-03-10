import { useState } from "react";
import { DIMENSION_UNIT } from "../constants";

export default function CustomPageDialog({
  open = false,
  onCloseDialogBox,
  sendDataDimension,
}) {
  const [label, setLabel] = useState(null);
  const [dimensionWidth, setDimensionWidth] = useState(null);
  const [dimensionHeight, setDimensionHeight] = useState(null);
  const [dimensionUnit, setDimensionUnit] = useState("mm");

  const onsubmit = () => {
    if (!label?.trim()) {
      alert("Label is required");
      return;
    }

    if (!dimensionWidth || dimensionWidth <= 0) {
      alert("Width is required");
      return;
    }

    if (!dimensionHeight || dimensionHeight <= 0) {
      alert("Height is required");
      return;
    }

    if (!dimensionUnit) {
      alert("Unit is required");
      return;
    }
    sendDataDimension({
      label: label,
      dimensionWidth: dimensionWidth,
      dimensionHeight: dimensionHeight,
      dimensionUnit: dimensionUnit,
    });
  };

  return (
    <div className="fixed h-screen items-center justify-center z-Index">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800">
              Custom Page Size
            </h2>

            <div className="grid mt-3">
              <div className="col-span-12 ">
                <h6 className="scanner-title">Label</h6>
                <input
                  onChange={(e) => setLabel(e.target.value)}
                  type="text"
                  placeholder="Enter name"
                  class="block bg-slate-100 text-black w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="col-span-12 mt-2">
                <h6 className="scanner-title">Dimensions</h6>
              </div>
              <div className="col-span-5 pr-3 ">
                <input
                  min={1}
                  value={dimensionWidth}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow empty (so user can edit)
                    if (value === "") {
                      setDimensionWidth("");
                      return;
                    }

                    const num = Number(value);

                    if (!isNaN(num) && num >= 1) {
                      setDimensionWidth(num);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Block -, +, e, E
                    if (["-", "+", "e", "E"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    // Auto-fix if empty or invalid
                    if (!dimensionWidth || dimensionWidth < 1) {
                      setDimensionWidth(1);
                    }
                  }}
                  type="number"
                  placeholder="0"
                  class="block bg-slate-100 text-black  w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="col-span-5 ">
                <input
                  min={1}
                  value={dimensionHeight}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow empty (so user can edit)
                    if (value === "") {
                      setDimensionHeight("");
                      return;
                    }

                    const num = Number(value);

                    if (!isNaN(num) && num >= 1) {
                      setDimensionHeight(num);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Block -, +, e, E
                    if (["-", "+", "e", "E"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    // Auto-fix if empty or invalid
                    if (!dimensionHeight || dimensionHeight < 1) {
                      setDimensionHeight(1);
                    }
                  }}
                  type="number"
                  placeholder="0"
                  class="block bg-slate-100 text-black w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="col-span-2 ">
                <select
                  value={dimensionUnit}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4  rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  onChange={(e) => setDimensionUnit(e.target.value)}
                >
                  {DIMENSION_UNIT.map((type, i) => (
                    <option key={i} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 mr-2"
                onClick={() => onsubmit()}
              >
                Save
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={onCloseDialogBox}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
