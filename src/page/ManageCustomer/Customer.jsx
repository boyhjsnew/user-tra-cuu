import { MaterialReactTable } from "material-react-table";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import "../dashboard.scss";
import "./customer.scss";
import { useImperativeDisableScroll } from "../../utils/configScrollbar";
import ExcelJS from "exceljs";
import { useNavigate } from "react-router-dom";
import GetDmkh from "../../utils/GetDmkh";
import GetUserTracuu from "../../utils/GetUserTracuu";
import CreateUser from "../../utils/createUser";
import NotifyMessage from "../../Components/NotiMessage";

const Customer = () => {
  //hidden scroll
  useImperativeDisableScroll({
    element: document.scrollingElement,
    disabled: true,
  });
  const tableHeight =
    ((window.innerHeight - 64 - 64 - 52 - 1) / window.innerHeight) * 100;

  const navigate = useNavigate();

  // useEffect(() => {
  //   const token = Cookies.get("token");
  //   const username = Cookies.get("username");
  //   if (!token && !username) {
  //     // Không có token, điều hướng người dùng trở lại trang đăng nhập
  //     navigate("/");
  //   }
  // }, [navigate]);

  const [customers, setCustomers] = useState([]);
  const [getIDRow, setIDRow] = useState(0);
  const [idCus, setidCus] = useState(0);
  const [editCustomerData, setEditCustomerData] = useState(null);

  //active modal
  const [modal, setModal] = useState(false);
  const [modalAssign, setModalAssign] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [isModalChooseFile, setIsModalChooseFile] = useState(false);
  const [taxCode, setTaxCode] = useState("");
  const [listKH, setListKH] = useState([]);
  console.log("🚀 ~ Customer ~ listKH:", listKH);
  const [isCreateUser, setIsCreateUser] = useState(false);
  const [listKHChuaTaoTK, setlistKHChuaTaoTK] = useState([]);
  const [startLocal, setStartLocal] = useState(0);
  const [isOpenMessage, setIsOpenMessage] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const taxCode = localStorage.getItem("login");
    const start = localStorage.getItem(taxCode);
    if (taxCode) {
      setTaxCode(taxCode);
      getDataKH(taxCode, start || 0);
    } else {
      navigate("/");
    }
  }, [startLocal, taxCode, navigate]);

  const getDataKH = async (taxCode, start) => {
    setIsloading(true);

    const listKHResponse = await GetDmkh(taxCode, start);
    console.log("🚀 ~ getDataKH ~ listKHResponse:", listKHResponse.data.data);
    if (listKHResponse.data.data.length > 0) {
      // Loại bỏ phần tử trùng lặp dựa trên một thuộc tính nhất định, ví dụ như 'taxCode'
      const listKHData = [...listKHResponse.data.data];
      const seen = new Map();

      const uniqueListKH = listKHData.filter((item) => {
        if (!seen.has(item.ma_dt)) {
          seen.set(item.ma_dt, true);
          return true;
        }
        return false;
      });

      console.log(uniqueListKH);
      setIsloading(false);
      setlistKHChuaTaoTK([]);
      setListKH(uniqueListKH);
    } else {
      setListKH([]);
      setIsloading(false);
    }
  };

  const handleGetUser = async () => {
    setIsloading(true);
    const newFilteredList = [];

    // Giả sử uniqueList chứa danh sách ma_dt đã lọc từ getDataKH
    console.log("🚀 ~ handleGetUser ~ listKH:", listKH);
    for (const item of listKH) {
      const result = await GetUserTracuu(item.ma_dt, taxCode);

      if (result.error && result.error.includes("chưa có user tra cứu")) {
        newFilteredList.push(item);
      }
    }
    console.log("🚀 ~ getUser ~ newFilteredList:", newFilteredList);

    if (newFilteredList.length === 0) {
      const startIndex = listKH.length >= 300 ? 300 : listKH.length;
      localStorage.setItem(taxCode, Number(startLocal) + startIndex);
      setStartLocal(startLocal + startIndex);
    }
    setlistKHChuaTaoTK(newFilteredList); // Cập nhật danh sách mới sau khi lọc
    setIsloading(false);
  };

  const handleCreateUser = async () => {
    if (listKHChuaTaoTK.length > 0) {
      let isCreateUser = false;
      const createUserPromises = listKHChuaTaoTK.map(async (item) => {
        const userInfo = {
          mst: taxCode,
          ma_dt: item.ma_dt,
          username: item.ma_dt,
          password: item.ma_dt,
          email: "",
        };
        const result = await CreateUser(taxCode, userInfo);
        if (result.data.error) {
          console.log("🚀 ~ handleCreateUser ~ result.error:", result.error);
          return false;
        } else {
          console.log(result.data);
          return true;
        }
      });

      const results = await Promise.all(createUserPromises);
      isCreateUser = results.some((result) => result === true);

      if (isCreateUser) {
        setIsOpenMessage(true);
        setIsCreateUser(true);
        const startIndex = listKH.length >= 300 ? 300 : listKH.length;
        localStorage.setItem(taxCode, Number(startLocal) + startIndex);
        setStartLocal(startLocal + startIndex);
        setlistKHChuaTaoTK([]);
      }
    }
  };

  const handleExportCustomer = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    // Thêm tiêu đề cột
    const columns = ["Mã đối tượng", "Loại tài khoản"];
    worksheet.addRow(columns);

    // Thêm dữ liệu khách hàng
    listKH.forEach((customer) => {
      const row = [customer.ma_dt, customer.su_dung];
      worksheet.addRow(row);
    });

    // Tạo tệp Excel và tải xuống
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Customers.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const labelDisplayedRowss = ({ from, to, count }) => {
    return `${from}-${to} trong ${count} bản ghi`; // Ví dụ: "1-10 of 100"
  };

  const handleRowClick = (row) => {
    if (getIDRow === "" || getIDRow !== row.getValue("AccountID")) {
      setIDRow(row.getValue("AccountID"));
    } else {
      setIDRow("");
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "stt",
      header: "STT",

      Cell: ({ row }) => (
        <span className={row.original.ma_dt === getIDRow ? "active" : ""}>
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "ma_dt",
      header: "Mã đối tượng",
      Cell: ({ row }) => (
        <span className={row.original.ma_dt === getIDRow ? "active" : ""}>
          {row.original.ma_dt}
        </span>
      ),
    },
    {
      accessorKey: "su_dung",
      header: "Loại tài khoản",
      Cell: ({ row }) => (
        <span className={row.original.ma_dt === getIDRow ? "active" : ""}>
          {row.original.su_dung}
        </span>
      ),
    },

    {
      header: "Chức năng",
      accessorKey: "assignService",
      // Tiêu đề của cột "Assign Service"
      accessor: "assignService", // Truy cập dữ liệu của cột "Assign Service"

      Cell: ({ row }) => (
        <button
          className="btn-assign"
          onClick={() => {
            setidCus(row.getValue("ma_dt"));
            setModalAssign(!modalAssign);
          }}
        >
          <span
            className="fa-solid fa-plus"
            style={{ paddingRight: "5px" }}
          ></span>
          <span className="p-component">Chọn dịch vụ</span>
        </button>
      ),
    },
  ]);

  return (
    <div
      style={{
        paddingTop: "6.5rem",
        backgroundColor: "#EDF1F5",

        maxHeight: "10px",
      }}
    >
      {listKH && (
        <div className="gird-layout wide ">
          <style>
            {`
                          ::-webkit-scrollbar {
                            width: 5px;
                            height:5px
                          }
                          ::-webkit-scrollbar-thumb {
                            background-color: #6466F1; 
                            border-radius:5px
                          }
                          ::-webkit-scrollbar-track {
                            background-color: transparent; 
                          }
                        `}
          </style>
          {/* <ToastContainer autoClose={2000} hideProgressBar /> */}
          {/* <Modal
          modal={modal}
          setModal={setModal}
          editCustomerData={editCustomerData}
          setEditCustomerData={setEditCustomerData}
        /> */}
          {/* <ModalAssignService
          setidCus={setidCus}
          idCus={idCus}
          modalAssign={modalAssign}
          setModalAssign={setModalAssign}
          editCustomerData={editCustomerData}
          setEditCustomerData={setEditCustomerData}
        /> */}
          {/* <ModalChooseFile
          getCustomer={getCustomer}
          isModalChooseFile={isModalChooseFile}
          setIsModalChooseFile={setIsModalChooseFile}
        /> */}
          <div className="col-12">
            <MaterialReactTable
              muiTablePaperProps={{
                sx: {
                  flex: "1 1 0",
                  display: "flex",
                  "flex-flow": "column",
                },
              }}
              enableSorting={true}
              enableGlobalFilter={true}
              enableColumnFilters={false}
              initialState={{
                columnPinning: { right: ["assignService"] },
                pagination: { pageSize: 300 },
              }} //pin email column to left by default
              state={{ isLoading: isLoading }}
              muiTableBodyRowProps={({ row }) => ({
                // onClick: (event) => handleRowClick(row),
                className:
                  getIDRow === row.getValue("ma_dt") ? "selected-row" : "",
                sx: {
                  cursor: "pointer",
                },
              })}
              enableStickyHeader={true}
              enableStickyFooter={true}
              muiTablePaginationProps={{
                labelDisplayedRows: labelDisplayedRowss,
              }}
              muiPaginationProps={{
                rowsPerPageOptions: [300, 500, 1000],
              }}
              enablePagination={true}
              columns={columns}
              data={listKHChuaTaoTK.length > 0 ? listKHChuaTaoTK : listKH}
              renderTopToolbarCustomActions={() => (
                <Box className="col">
                  <Button
                    className="btn_add"
                    style={{}}
                    onClick={handleGetUser}
                    disabled={listKH.length === 0}
                  >
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-plus"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>
                      Lọc user chưa tạo TK
                    </span>
                  </Button>
                  <Button className="btn_edit">
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-pencil"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>Sửa</span>
                  </Button>
                  {/* <Button
                  className="btn_remove"
                  // onClick={(e) => handleDeleteCustomer(e)}
                >
                  <span
                    style={{ paddingRight: "5px" }}
                    className="fa-solid fa-trash"
                  ></span>
                  <span style={{ paddingLeft: "5px" }}>Xoá</span>
                </Button> */}

                  <Button
                    className="btn_import"
                    onClick={() => setIsModalChooseFile(!isModalChooseFile)}
                  >
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-file-import"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>Nhập Excel</span>
                  </Button>
                  <Button onClick={handleExportCustomer} className="btn_export">
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-file-excel"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>Xuất Excel</span>
                  </Button>
                  {listKHChuaTaoTK.length > 0 && (
                    <Button onClick={handleCreateUser} className="btn_export">
                      <span
                        style={{ paddingRight: "5px" }}
                        className="fa-solid fa-file-excel"
                      ></span>
                      <span style={{ paddingLeft: "5px" }}>
                        Tạo {listKHChuaTaoTK.length} TK user
                      </span>
                    </Button>
                  )}
                </Box>
              )}
            />
          </div>
        </div>
      )}
      <NotifyMessage
        open={isOpenMessage}
        message="Tạo user tra cứu thành công"
        setOpen={setIsOpenMessage}
      />
    </div>
  );
};

export default Customer;
