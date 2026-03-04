import { PDFDocument } from "pdf-lib";

const MiniPrintPreview = ({ printList = null, onPreview }) => {
  const download = async () => {
    const mergedPdf = await PDFDocument.create();

    for (const base64 of printList) {
      // Convert Base64 → Uint8Array
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const pdf = await PDFDocument.load(bytes);

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedBytes = await mergedPdf.save();

    // Download
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "scan-documents.pdf";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="mini-preview-content">
      {printList && printList.length > 0 ? (
        <>
          <div
            style={{ width: "200px", height: "100vh", overflow: "auto" }}
            className="pt-4 px-4 scroll-auto"
          >
            {printList.map((v, index) => (
              <>
                <div className="relative">
                  <iframe
                    src={`data:application/pdf;base64,${v}#toolbar=0`}
                    title="preview of pdf"
                    style={{ height: "220px", width: "100%" }}
                  >
                    <p>
                      Your browser does not support iframes. You can{" "}
                      <a
                        href={`data:application/pdf;base64,${v}`}
                        download="your_document.pdf"
                      >
                        download the PDF
                      </a>{" "}
                      instead.
                    </p>
                  </iframe>
                  <div
                    onClick={() => onPreview(v)}
                    style={{
                      height: "220px",
                      width: "100%",
                      position: "absolute",
                      top: "0",
                      right: "0",
                      overflow: "hidden",
                    }}
                  ></div>
                  <p className="text-white text-center pb-2">{index + 1}</p>
                </div>
              </>
            ))}
          </div>
        </>
      ) : (
        ""
      )}
      <div className="button-content">
        <button
          className="bg-gray-600 px-4  h-8  mr-2"
          onClick={() => download()}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};
export default MiniPrintPreview;
