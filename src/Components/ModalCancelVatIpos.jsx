import React, { useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import {
  parseTranIdsFromJson,
  cancelVatIposByJson,
} from "../utils/cancelVatIpos";

export default function ModalCancelVatIpos(props) {
  const { isModalCancelVatIpos, setIsModalCancelVatIpos } = props;
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const toggleModal = () => {
    if (isProcessing) return;
    setIsModalCancelVatIpos(false);
    setJsonInput("");
    setProgress({ done: 0, total: 0 });
    setIsProcessing(false);
  };

  if (isModalCancelVatIpos) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const handlePreview = () => {
    const { tranIds, error } = parseTranIdsFromJson(jsonInput.trim());
    if (error) {
      toast.error(
        <ToastNotify status={-1} message={error} />,
        { style: styleError }
      );
      return;
    }
    if (tranIds.length === 0) {
      toast.warning(
        <ToastNotify status={0} message="Không tìm thấy tran_id nào trong JSON." />,
        { style: styleError }
      );
      return;
    }
    toast.info(
      <ToastNotify
        status={0}
        message={`Đã trích ${tranIds.length} tran_id. Nhấn "Huỷ hóa đơn" để thực hiện.`}
      />,
      { autoClose: 3000 }
    );
    console.log("[CancelVatIpos] Danh sách tran_id:", tranIds);
  };

  const handleCancelInvoices = () => {
    if (isProcessing) return;
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng dán JSON chứa danh sách hóa đơn cần huỷ." />,
        { style: styleError }
      );
      return;
    }

    const { tranIds, error } = parseTranIdsFromJson(trimmed);
    if (error) {
      toast.error(
        <ToastNotify status={-1} message={error} />,
        { style: styleError }
      );
      return;
    }
    if (tranIds.length === 0) {
      toast.warning(
        <ToastNotify status={0} message="Không tìm thấy tran_id nào trong JSON." />,
        { style: styleError }
      );
      return;
    }

    setIsProcessing(true);
    setProgress({ done: 0, total: tranIds.length });
    toast.info(
      <ToastNotify
        status={0}
        message={`Đang huỷ ${tranIds.length} hóa đơn VAT IPOS...`}
      />,
      { autoClose: false }
    );

    cancelVatIposByJson(trimmed, {
      delayMs: 200,
      onProgress: (done, total) => setProgress({ done, total }),
    })
      .then(({ success, failed, tranIds: ids }) => {
        toast.dismiss();
        const msg =
          failed === 0
            ? `Đã huỷ thành công ${success} hóa đơn.`
            : `Xong: thành công ${success}, thất bại ${failed} / ${ids.length} hóa đơn.`;
        toast.success(
          <ToastNotify status={1} message={msg} />,
          { style: styleSuccess }
        );
        if (failed === 0) {
          setIsModalCancelVatIpos(false);
          setJsonInput("");
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(
          <ToastNotify status={-1} message={`Lỗi: ${err.message}`} />,
          { style: styleError }
        );
      })
      .finally(() => {
        setIsProcessing(false);
        setProgress({ done: 0, total: 0 });
      });
  };

  return (
    <>
      {isModalCancelVatIpos && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content-change">
            <div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Huỷ hóa đơn VAT IPOS
                </span>
                <div className="close-modal" onClick={toggleModal}>
                  <i
                    className="fa-solid fa-xmark"
                    style={{ fontSize: "16px", color: "#AAAA" }}
                  ></i>
                </div>
              </div>

              <form className="form-customer">
                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <label className="block lbl-txt">JSON danh sách hóa đơn cần huỷ</label>
                    <textarea
                      className="input-customer"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='Dán JSON có cấu trúc { "data": [ { "tran_id": "..." }, ... ] }'
                      disabled={isProcessing}
                      rows={12}
                      style={{
                        width: "100%",
                        minHeight: "200px",
                        resize: "vertical",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    />
                    <small style={{ color: "#888" }}>
                      JSON chứa mảng &quot;data&quot;, mỗi phần tử có &quot;tran_id&quot;. Hệ thống sẽ trích danh sách tran_id và gọi API DELETE cho từng mã.
                    </small>
                  </div>
                </div>

                {isProcessing && progress.total > 0 && (
                  <div className="row" style={{ marginBottom: "8px" }}>
                    <div className="block col" style={{ flex: 1 }}>
                      <span style={{ color: "#666" }}>
                        Đang xử lý: {progress.done} / {progress.total}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="row"
                  style={{
                    justifyContent: "flex-end",
                    margin: "0 10px",
                    marginTop: "5px",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="btn-template col"
                    onClick={handlePreview}
                    style={{
                      opacity: isProcessing ? 0.5 : 1,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      pointerEvents: isProcessing ? "none" : "auto",
                    }}
                  >
                    <span
                      className="fa-solid fa-list"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">Xem danh sách tran_id</span>
                  </div>
                  <div
                    className="btn-get col"
                    style={{
                      margin: "10px",
                      opacity: isProcessing ? 0.5 : 1,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      pointerEvents: isProcessing ? "none" : "auto",
                    }}
                    onClick={handleCancelInvoices}
                  >
                    <span
                      className="fa-solid fa-trash"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">
                      {isProcessing ? "Đang huỷ..." : "Huỷ hóa đơn"}
                    </span>
                  </div>
                  <div
                    role="none"
                    className="btn-close col"
                    onClick={toggleModal}
                    style={{
                      opacity: isProcessing ? 0.5 : 1,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      pointerEvents: isProcessing ? "none" : "auto",
                    }}
                  >
                    <span
                      className="fa-solid fa-xmark"
                      style={{ paddingRight: "5px", color: "#6c757d" }}
                    ></span>
                    <span color="#6c757d" className="p-component">
                      Đóng
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
