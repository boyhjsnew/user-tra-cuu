import React, { useEffect, useState } from "react";
import "./Modal.css";
import "./modalChooseFile.css";
import "../../src/page/dashboard.scss";
import ExcelJS from "exceljs";
import axios from "axios";

import { toast } from "react-toastify";
import ToastNotify from "./ToastNotify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import { createUserExcel } from "../utils/createUserExcel";

export default function ModalChooseFile(props) {
  const { isModalChooseFile, setIsModalChooseFile, getCustomer } = props;
  const [selectedFile, setSelectedFile] = useState(null);

  const toggleModal = () => {
    setIsModalChooseFile(false);
    setSelectedFile(null);
  };

  if (isModalChooseFile) {
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
    const taxCode = localStorage.getItem("login");

    if (!selectedFile) {
      toast.error(
        <ToastNotify status={-1} message="Bạn chưa chọn file excel!" />,
        { style: styleError }
      );
      return;
    }

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

        // Sau khi đã lấy được mảng từ Excel, gọi hàm processUserArray
        if (importedData.length > 0) {
          // Gọi hàm createUserExcel với mảng importedData
          createUserExcel(taxCode, importedData)
            .then(() => {
              // Hiển thị toast thành công khi import xong
              toast.success(
                <ToastNotify status={1} message="Dữ liệu đã được cập nhật !" />,
                { style: styleSuccess }
              );

              // Đóng modal sau khi thành công
              setIsModalChooseFile(false);
            })
            .catch((error) => {
              toast.error(
                <ToastNotify
                  status={-1}
                  message="Lỗi trong quá trình import!"
                />,
                { style: styleError }
              );
            });
        } else {
          toast.error(
            <ToastNotify status={-1} message="Không có dữ liệu để xử lý!" />,
            { style: styleError }
          );
        }
      });
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExportCustomer = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("users");

    // Thêm tiêu đề cột
    const columns = ["Mã đối tượng (*)", "Mật khẩu (*)"];
    worksheet.addRow(columns);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_users.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {isModalChooseFile && (
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
                  Nhập dữ liệu từ Excel
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
                      Chọn file
                    </label>
                    <input
                      type="file"
                      accept=".xlsx"
                      className="input-customer"
                      onChange={handleFileChange}
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
                  >
                    <span
                      className="fa-regular fa-file-excel"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">Tải file mẫu</span>
                  </div>
                  <div
                    className="btn-get col"
                    style={{ margin: "10px " }}
                    onClick={handleImportExcel}
                  >
                    <span
                      className="fa-solid fa-upload"
                      style={{ paddingRight: "5px" }}
                    ></span>
                    <span className="p-component">Nhận file</span>
                  </div>
                  <div
                    role="none"
                    className="btn-close col"
                    onClick={toggleModal}
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
