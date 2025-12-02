import React, { useEffect, useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import ExcelJS from "exceljs";
import axios from "axios";

import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";

import { createDCExcel } from "../utils/createDCExcel";

export default function ModalChooseFile_DC(props) {
  const { isModalChooseFile_DC, setIsModalChooseFile_DC, getCustomer } = props;
  const [selectedFile, setSelectedFile] = useState(null);
  const [taxCode, setTaxCode] = useState("");
  const [invoiceSeriesOverride, setInvoiceSeriesOverride] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExternalSystem, setIsExternalSystem] = useState(false);

  const toggleModal = () => {
    if (isProcessing) return;
    setIsModalChooseFile_DC(false);
    setSelectedFile(null);
    setTaxCode("");
    setInvoiceSeriesOverride("");
    setIsExternalSystem(false);
    setIsProcessing(false);
  };

  if (isModalChooseFile_DC) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    console.log(file);
  };

  const handleImportExcel = () => {
    if (isProcessing) return;
    if (!taxCode.trim()) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng nhập mã số thuế!" />,
        { style: styleError }
      );
      return;
    }

    if (!selectedFile) {
      toast.error(
        <ToastNotify status={-1} message="Bạn chưa chọn file excel!" />,
        { style: styleError }
      );
      return;
    }

    setIsProcessing(true);
    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      workbook.xlsx
        .load(data)
        .then(() => {
          const worksheet = workbook.getWorksheet(1);
          const importedData = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) {
              const rowData = row.values.slice(1);
              importedData.push(rowData);
            }
          });
          console.log("Dữ liệu từ file Excel:", importedData);

          // Sau khi đã lấy được mảng từ Excel, gọi hàm processUserArray
          if (importedData.length > 0) {
            // Gọi hàm createDCExcel với mảng importedData
            createDCExcel(
              taxCode,
              importedData,
              invoiceSeriesOverride.trim(),
              isExternalSystem
            )
              .then(() => {
                // Hiển thị toast thành công khi import xong
                toast.success(
                  <ToastNotify
                    status={1}
                    message="Dữ liệu đã được cập nhật !"
                  />,
                  { style: styleSuccess }
                );

                // Đóng modal sau khi thành công
                setIsModalChooseFile_DC(false);
              })
              .catch((error) => {
                toast.error(
                  <ToastNotify
                    status={-1}
                    message="Lỗi trong quá trình import!"
                  />,
                  { style: styleError }
                );
              })
              .finally(() => {
                setIsProcessing(false);
              });
          } else {
            toast.error(
              <ToastNotify status={-1} message="Không có dữ liệu để xử lý!" />,
              { style: styleError }
            );
            setIsProcessing(false);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi đọc file Excel:", error);
          toast.error(
            <ToastNotify
              status={-1}
              message="Không thể đọc file Excel. Vui lòng thử lại!"
            />,
            { style: styleError }
          );
          setIsProcessing(false);
        });
    };

    reader.onerror = () => {
      toast.error(
        <ToastNotify
          status={-1}
          message="Không thể đọc file. Vui lòng thử lại với file khác!"
        />,
        { style: styleError }
      );
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExportCustomer = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("users");

    // Thêm tiêu đề cột
    const columns = [
      "Ký hiệu (*)",
      "Số hoá đơn gốc",
      "Ngày hoá đơn (*)",
      "STT",
      "Mã hàng",
      "Tên hàng",
      "Đơn vị tính",
      "Số lượng",
      "Đơn giá",
      "Tiền chiết khấu",
      "Tiền trước thuế",
      "Thuế suất",
      "Tiền thuế",
      "Tổng tiền",
      "Tính chất",
      "Tên người mua (*)",
      "Địa chỉ",
      "Mã số thuế",
      "Tên đơn vị",
    ];
    worksheet.addRow(columns);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_DC.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {isModalChooseFile_DC && (
        <div className="modal">
          {/* <ToastNotify
            autoClose={2000}
            hideProgressBar
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          /> */}
          <div
            onClick={!isProcessing ? toggleModal : undefined}
            className="overlay"
            style={isProcessing ? { cursor: "not-allowed" } : {}}
          ></div>
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
                  Excel điều chỉnh hàng loạt
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
                    <label className="block lbl-txt" htmlFor="">
                      Mã số thuế (*)
                    </label>
                    <input
                      type="text"
                      className="input-customer"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="Nhập mã số thuế..."
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <label className="block lbl-txt" htmlFor="">
                      Ký hiệu để lấy hoá đơn gốc (tuỳ chọn)
                    </label>
                    <input
                      type="text"
                      className="input-customer"
                      value={invoiceSeriesOverride}
                      onChange={(e) => setInvoiceSeriesOverride(e.target.value)}
                      placeholder="Nhập ký hiệu thực tế của hóa đơn gốc nếu khác trong file..."
                      disabled={isProcessing}
                    />
                    <small style={{ color: "#888" }}>
                      Ký hiệu này chỉ dùng để tìm hóa đơn gốc. Ký hiệu tạo hóa
                      đơn điều chỉnh vẫn lấy từ file Excel.
                    </small>
                  </div>
                </div>
                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <label className="block lbl-txt" htmlFor="">
                      Tuỳ chọn nguồn dữ liệu
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="external-system-toggle"
                        checked={isExternalSystem}
                        onChange={(e) => setIsExternalSystem(e.target.checked)}
                        disabled={isProcessing}
                      />
                      <label
                        htmlFor="external-system-toggle"
                        style={{ margin: 0, cursor: "pointer" }}
                      >
                        Điều chỉnh từ hệ thống khác (đã có ID hoá đơn)
                      </label>
                    </div>
                    <small style={{ color: "#888" }}>
                      Khi bật, hệ thống bỏ qua bước gọi API lấy ID và dùng dữ
                      liệu sẵn có từ file Excel.
                    </small>
                  </div>
                </div>
                <div className="row">
                  <div className="block col" style={{ flex: 1 }}>
                    <label className="block lbl-txt" htmlFor="">
                      Chọn file
                    </label>
                    <input
                      type="file"
                      accept=".xlsx"
                      className="input-customer"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

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
                    onClick={!isProcessing ? handleExportCustomer : undefined}
                    style={
                      isProcessing
                        ? {
                            opacity: 0.6,
                            pointerEvents: "none",
                            cursor: "not-allowed",
                          }
                        : {}
                    }
                  >
                    <span
                      className="fa-regular fa-file-excel"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">Tải file mẫu</span>
                  </div>
                  <div
                    className="btn-get col"
                    style={{
                      margin: "10px ",
                      opacity: isProcessing ? 0.7 : 1,
                      pointerEvents: isProcessing ? "none" : "auto",
                      cursor: isProcessing ? "not-allowed" : "pointer",
                    }}
                    onClick={handleImportExcel}
                  >
                    <span
                      className="fa-solid fa-upload"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">
                      {isProcessing ? "Đang xử lý..." : "Nhận file"}
                    </span>
                  </div>
                  <div
                    role="none"
                    className="btn-close col"
                    onClick={toggleModal}
                    style={
                      isProcessing
                        ? {
                            opacity: 0.6,
                            pointerEvents: "none",
                            cursor: "not-allowed",
                          }
                        : {}
                    }
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
