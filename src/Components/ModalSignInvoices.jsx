import React, { useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import getInvoicesPendingSign from "../utils/getInvoicesPendingSign";
import signInvoices from "../utils/signInvoices";

const DEFAULT_CCTBAO_ID = "769e48c3-9ab7-46c5-ba68-c7b5642d44a5";
const PAGE_SIZE = 250;

export default function ModalSignInvoices(props) {
  const { isModalSignInvoices, setIsModalSignInvoices, taxCode } = props;
  const [cctbaoId, setCctbaoId] = useState(DEFAULT_CCTBAO_ID);
  const [pendingList, setPendingList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [progressAll, setProgressAll] = useState({ signed: 0, total: 0 }); // khi chạy "ký đến hết"

  const toggleModal = () => {
    if (isLoading || isSigning) return;
    setIsModalSignInvoices(false);
    setPendingList([]);
    setTotalCount(0);
    setProgressAll({ signed: 0, total: 0 });
  };

  if (isModalSignInvoices) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const handleFetchPending = async () => {
    if (isLoading || isSigning) return;
    const t = (taxCode || "").trim();
    if (!t) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng đăng nhập (có mã số thuế)." />,
        { style: styleError }
      );
      return;
    }
    if (!cctbaoId.trim()) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng nhập cctbao_id." />,
        { style: styleError }
      );
      return;
    }

    setIsLoading(true);
    toast.info(
      <ToastNotify status={0} message="Đang lấy danh sách hóa đơn chờ ký (250 bản ghi)..." />,
      { autoClose: false }
    );

    try {
      const res = await getInvoicesPendingSign(t, cctbaoId.trim(), 0, PAGE_SIZE);
      toast.dismiss();
      if (res.error) {
        toast.error(
          <ToastNotify status={-1} message={res.error} />,
          { style: styleError }
        );
        return;
      }
      setPendingList(res.list || []);
      setTotalCount(res.total_count ?? 0);
      const count = (res.list || []).length;
      toast.success(
        <ToastNotify
          status={1}
          message={`Đã lấy ${count} hóa đơn chờ ký. Tổng: ${res.total_count ?? 0}`}
        />,
        { style: styleSuccess }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (isLoading || isSigning) return;
    const t = (taxCode || "").trim();
    if (!t) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng đăng nhập (có mã số thuế)." />,
        { style: styleError }
      );
      return;
    }
    if (pendingList.length === 0) {
      toast.warning(
        <ToastNotify status={0} message="Chưa có danh sách hóa đơn. Hãy nhấn 'Lấy 250 hóa đơn chờ ký' trước." />,
        { style: styleError }
      );
      return;
    }

    setIsSigning(true);
    toast.info(
      <ToastNotify status={0} message={`Đang ký ${pendingList.length} hóa đơn...`} />,
      { autoClose: false }
    );

    const hoadonIds = pendingList.map((item) => item.hoadon68_id || item.id).filter(Boolean);

    try {
      const res = await signInvoices(t, { hoadonIds });
      toast.dismiss();
      if (res.success) {
        toast.success(
          <ToastNotify status={1} message="Ký hóa đơn thành công." />,
          { style: styleSuccess }
        );
        setPendingList([]);
        setTotalCount(0);
      } else {
        toast.error(
          <ToastNotify status={-1} message={res.error || "Ký thất bại."} />,
          { style: styleError }
        );
      }
    } catch (err) {
      toast.dismiss();
      toast.error(
        <ToastNotify status={-1} message={`Lỗi: ${err.message}`} />,
        { style: styleError }
      );
    } finally {
      setIsSigning(false);
    }
  };

  /** Lấy 250 → ký → lấy tiếp... đến khi hết theo total_count hoặc API trả 0 bản ghi */
  const handleFetchAndSignAll = async () => {
    if (isLoading || isSigning) return;
    const t = (taxCode || "").trim();
    if (!t) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng đăng nhập (có mã số thuế)." />,
        { style: styleError }
      );
      return;
    }
    if (!cctbaoId.trim()) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng nhập cctbao_id." />,
        { style: styleError }
      );
      return;
    }

    setIsSigning(true);
    setProgressAll({ signed: 0, total: 0 });
    let start = 0;
    let totalToProcess = 0;
    let totalSigned = 0;
    let hasError = false;

    toast.info(
      <ToastNotify status={0} message="Đang lấy danh sách đầu tiên..." />,
      { autoClose: false }
    );

    while (true) {
      const res = await getInvoicesPendingSign(t, cctbaoId.trim(), start, PAGE_SIZE);
      if (res.error) {
        toast.dismiss();
        toast.error(<ToastNotify status={-1} message={res.error} />, { style: styleError });
        hasError = true;
        break;
      }
      const list = res.list || [];
      if (totalToProcess === 0) totalToProcess = res.total_count ?? 0;
      setProgressAll((p) => ({ ...p, total: totalToProcess }));

      if (list.length === 0) {
        toast.dismiss();
        toast.success(
          <ToastNotify status={1} message={`Đã xử lý hết. Tổng đã ký: ${totalSigned} hóa đơn.`} />,
          { style: styleSuccess }
        );
        break;
      }

      toast.dismiss();
      toast.info(
        <ToastNotify status={0} message={`Đang ký lô ${Math.floor(start / PAGE_SIZE) + 1} (${list.length} hóa đơn)...`} />,
        { autoClose: false }
      );

      const hoadonIds = list.map((item) => item.hoadon68_id || item.id).filter(Boolean);
      const signRes = await signInvoices(t, { hoadonIds });

      if (!signRes.success) {
        toast.dismiss();
        toast.error(
          <ToastNotify status={-1} message={signRes.error || "Ký thất bại."} />,
          { style: styleError }
        );
        hasError = true;
        break;
      }

      totalSigned += list.length;
      setProgressAll((p) => ({ ...p, signed: totalSigned }));
      start += list.length;

      if (list.length < PAGE_SIZE || (totalToProcess > 0 && start >= totalToProcess)) {
        toast.dismiss();
        toast.success(
          <ToastNotify status={1} message={`Hoàn tất. Đã ký ${totalSigned} hóa đơn (tổng chờ ký: ${totalToProcess}).`} />,
          { style: styleSuccess }
        );
        break;
      }
    }

    setIsSigning(false);
    setProgressAll({ signed: 0, total: 0 });
    if (!hasError) {
      setPendingList([]);
      setTotalCount(0);
    }
  };

  return (
    <>
      {isModalSignInvoices && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay" />
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
                  Ký hóa đơn (tự động – 250 bản ghi/lần)
                </span>
                <div className="close-modal" onClick={toggleModal}>
                  <i
                    className="fa-solid fa-xmark"
                    style={{ fontSize: "16px", color: "#AAAA" }}
                  />
                </div>
              </div>

              <form className="form-customer">
                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <label className="block lbl-txt">cctbao_id</label>
                    <input
                      type="text"
                      className="input-customer"
                      value={cctbaoId}
                      onChange={(e) => setCctbaoId(e.target.value)}
                      placeholder="769e48c3-9ab7-46c5-ba68-c7b5642d44a5"
                      disabled={isLoading || isSigning}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <span style={{ color: "#666", marginRight: "8px" }}>
                      Đã lấy: {pendingList.length} hóa đơn. Tổng chờ ký: {totalCount}
                    </span>
                    <button
                      type="button"
                      className="btn-get"
                      style={{
                        marginLeft: "8px",
                        opacity: isLoading || isSigning ? 0.5 : 1,
                        cursor: isLoading || isSigning ? "not-allowed" : "pointer",
                        pointerEvents: isLoading || isSigning ? "none" : "auto",
                      }}
                      onClick={handleFetchPending}
                    >
                      {isLoading ? "Đang lấy..." : "Lấy 250 hóa đơn chờ ký"}
                    </button>
                    <button
                      type="button"
                      className="btn-get"
                      style={{
                        marginLeft: "8px",
                        opacity: isLoading || isSigning ? 0.5 : 1,
                        cursor: isLoading || isSigning ? "not-allowed" : "pointer",
                        pointerEvents: isLoading || isSigning ? "none" : "auto",
                      }}
                      onClick={handleFetchAndSignAll}
                    >
                      {isSigning && progressAll.total > 0
                        ? `Đang ký... ${progressAll.signed} / ${progressAll.total}`
                        : isSigning
                          ? "Đang xử lý..."
                          : "Lấy & ký đến hết (theo total_count)"}
                    </button>
                  </div>
                </div>

                {progressAll.total > 0 && isSigning && (
                  <div className="row" style={{ marginBottom: "8px" }}>
                    <div className="block col" style={{ flex: 1 }}>
                      <span style={{ color: "#666" }}>
                        Tiến độ: đã ký {progressAll.signed} / {progressAll.total} hóa đơn
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="row"
                  style={{
                    justifyContent: "flex-end",
                    margin: "0 10px",
                    marginTop: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    role="button"
                    className="btn-get col"
                    style={{
                      marginRight: "10px",
                      opacity: isSigning || pendingList.length === 0 ? 0.5 : 1,
                      cursor: isSigning || pendingList.length === 0 ? "not-allowed" : "pointer",
                      pointerEvents: isSigning || pendingList.length === 0 ? "none" : "auto",
                    }}
                    onClick={handleSign}
                  >
                    <span className="fa-solid fa-pen-fancy" style={{ paddingRight: "5px" }} />
                    <span className="p-component">
                      {isSigning ? "Đang ký..." : `Ký ${pendingList.length} hóa đơn`}
                    </span>
                  </div>
                  <div
                    role="button"
                    className="btn-close col"
                    onClick={toggleModal}
                    style={{
                      opacity: isLoading || isSigning ? 0.5 : 1,
                      cursor: isLoading || isSigning ? "not-allowed" : "pointer",
                      pointerEvents: isLoading || isSigning ? "none" : "auto",
                    }}
                  >
                    <span className="fa-solid fa-xmark" style={{ paddingRight: "5px", color: "#6c757d" }} />
                    <span className="p-component" style={{ color: "#6c757d" }}>Đóng</span>
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
