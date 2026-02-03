import React, { useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import { createSaveExcel } from "../utils/createSaveExcel";

export default function ModalChooseFile_Save(props) {
  const { isModalChooseFile_Save, setIsModalChooseFile_Save } = props;
  const [selectedFile, setSelectedFile] = useState(null);
  const [taxCode, setTaxCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  /** 'draft' = Tạo nháp (Save), 'sign' = Tạo ký (SaveSign). Mặc định: draft */
  const [createMode, setCreateMode] = useState("draft");

  const toggleModal = () => {
    if (isProcessing) return;
    setIsModalChooseFile_Save(false);
    setSelectedFile(null);
    setTaxCode("");
    setCreateMode("draft");
    setIsProcessing(false);
  };

  if (isModalChooseFile_Save) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const handleFileChange = (e) => {
    if (isProcessing) return;
    const file = e.target.files[0];
    setSelectedFile(file);
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

        if (importedData.length > 0) {
          createSaveExcel(taxCode, importedData, { mode: createMode })
            .then(() => {
              toast.dismiss();
              toast.success(
                <ToastNotify
                  status={1}
                  message="Tạo mới hóa đơn thành công!"
                />,
                { style: styleSuccess }
              );
              setIsModalChooseFile_Save(false);
            })
            .catch((error) => {
              toast.dismiss();
              toast.error(
                <ToastNotify status={-1} message={`Lỗi: ${error.message}`} />,
                { style: styleError }
              );
            })
            .finally(() => setIsProcessing(false));
        } else {
          toast.dismiss();
          toast.error(
            <ToastNotify status={-1} message="Không có dữ liệu để xử lý!" />,
            { style: styleError }
          );
          setIsProcessing(false);
        }
      });
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExportTemplate = () => {
    if (isProcessing) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("users");

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
      "Phần trăm chiết khấu",
      "Tiền chiết khấu",
      "Tiền trước thuế",
      "Thuế suất",
      "Tiền thuế",
      "Tổng tiền",
      "Tính chất",
      "Tên đơn vị",
      "Tên người mua",
      "Địa chỉ",
      "Mã số thuế",
      "Mã đối tượng",
      "Khoa",
      "Hệ đào tạo",
    ];
    worksheet.addRow(columns);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_tao_moi.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {isModalChooseFile_Save && (
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
                  Excel Tạo mới hóa đơn
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
                    <label className="block lbl-txt">Loại tạo hóa đơn</label>
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="createMode"
                          value="draft"
                          checked={createMode === "draft"}
                          onChange={() => setCreateMode("draft")}
                          disabled={isProcessing}
                        />
                        <span style={{ marginLeft: "6px" }}>Tạo nháp</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="createMode"
                          value="sign"
                          checked={createMode === "sign"}
                          onChange={() => setCreateMode("sign")}
                          disabled={isProcessing}
                        />
                        <span style={{ marginLeft: "6px" }}>Tạo ký</span>
                      </label>
                    </div>
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
                    <small style={{ color: "#888" }}>
                      Dùng cùng mẫu với Thay thế. File mẫu:
                      Template_tao_moi.xlsx
                    </small>
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
                    onClick={handleExportTemplate}
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
