import React, { useEffect, useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import ExcelJS from "exceljs";
import axios from "axios";

import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import { createTTExcel } from "../utils/createUserExcel";

export default function ModalChooseFile_TT(props) {
  const { isModalChooseFile_TT, setIsModalChooseFile_TT, getCustomer } = props;
  const [selectedFile, setSelectedFile] = useState(null);
  const [taxCode, setTaxCode] = useState("");
  // Thêm state để theo dõi trạng thái đang xử lý
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleModal = () => {
    // Chỉ cho phép đóng modal khi không đang xử lý
    if (isProcessing) return;

    setIsModalChooseFile_TT(false);
    setSelectedFile(null);
    setTaxCode("");
    setIsProcessing(false); // Reset trạng thái xử lý
  };

  if (isModalChooseFile_TT) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const handleFileChange = (e) => {
    // Không cho phép thay đổi file khi đang xử lý
    if (isProcessing) return;

    const file = e.target.files[0];
    setSelectedFile(file);
    console.log(file);
  };

  const handleImportExcel = () => {
    // Ngăn chặn gọi API nhiều lần
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

    // Bắt đầu xử lý
    setIsProcessing(true);

    // Hiển thị thông báo đang xử lý
    toast.info(
      <ToastNotify status={0} message="Đang xử lý dữ liệu, vui lòng chờ..." />,
      { autoClose: false }
    );

    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      workbook.xlsx.load(data).then(() => {
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
          // Gọi hàm createUserExcel với mảng importedData

          createTTExcel(taxCode, importedData)
            .then(() => {
              toast.dismiss(); // Đóng toast đang xử lý
              // Hiển thị toast thành công khi import xong
              toast.success(
                <ToastNotify status={1} message="Dữ liệu đã được cập nhật !" />,
                { style: styleSuccess }
              );

              // Đóng modal sau khi thành công
              setIsModalChooseFile_TT(false);
            })
            .catch((error) => {
              toast.dismiss(); // Đóng toast đang xử lý
              toast.error(
                <ToastNotify status={-1} message={`Lỗi: ${error.message}`} />,
                { style: styleError }
              );
            })
            .finally(() => {
              // Kết thúc xử lý
              setIsProcessing(false);
            });
        } else {
          toast.dismiss();
          toast.error(
            <ToastNotify status={-1} message="Không có dữ liệu để xử lý!" />,
            { style: styleError }
          );
          // Kết thúc xử lý
          setIsProcessing(false);
        }
      });
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExportCustomer = () => {
    // Không cho phép export khi đang xử lý
    if (isProcessing) return;

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
      "Tiền trước thuế",
      "Thuế suất",
      "Tiền thuế",
      "Tổng tiền",
      "Tính chất",
      "Tên đơn vị",
      "Tên người mua",
      "Địa chỉ",
      "Mã số thuế",
    ];
    worksheet.addRow(columns);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_thay_the.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {isModalChooseFile_TT && (
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
                  Excel Thay thế hàng loạt
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
                    onClick={handleExportCustomer}
                    style={{
                      opacity: isProcessing ? 0.5 : 1,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      pointerEvents: isProcessing ? "none" : "auto",
                    }}
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
                      opacity: isProcessing ? 0.5 : 1,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      pointerEvents: isProcessing ? "none" : "auto",
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
