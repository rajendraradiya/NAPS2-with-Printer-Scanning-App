const MiniPrintPreview = ({ printList = null, onPreview }) => {
  return (
    <>
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
                    style={{ height: "180px", width: "100%" }}
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
                      height: "160px",
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
    </>
  );
};
export default MiniPrintPreview;
