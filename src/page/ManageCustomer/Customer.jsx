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
import PopupDialog from "../../Components/PopupDialog";
import ModalChooseFile from "../../Components/ModalChooseFile";
import ModalCreateUser from "../../Components/ModalCreateUser";

import { ToastContainer, toast } from "react-toastify";

import { styleError, styleSuccess } from "../../Components/ToastNotifyStyle";
import ToastNotify from "../../Components/ToastNotify";

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

  const [currenUser, setCurrentUser] = useState();
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
  const [isCreateUser, setIsCreateUser] = useState(false);
  const [listKHChuaTaoTK, setlistKHChuaTaoTK] = useState([]);
  const [startLocal, setStartLocal] = useState(0);
  const [isOpenMessage, setIsOpenMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [isConfirmCreate, setIsConfirmCreate] = useState(false);
  const [isLoadingCreateUser, setIsloadingCreateUser] = useState(false);
  const [chooseUser, setChooseUser] = useState("");

  // Lấy danh sách user từ API
  const getDataKH = async (taxCode, start) => {
    setIsloading(true);

    const listKHResponse = await GetDmkh(taxCode, start);
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

      setIsloading(false);
      setlistKHChuaTaoTK([]);
      setListKH(uniqueListKH);
    } else {
      setListKH([]);
      setIsloading(false);
    }
  };

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

  //Lấy danh sách user chưa có tài khoản tra cứu
  const handleGetUser = async () => {
    setIsloading(true);
    const newFilteredList = [];

    // Giả sử uniqueList chứa danh sách ma_dt đã lọc từ getDataKH
    for (const item of listKH) {
      const result = await GetUserTracuu(item.ma_dt, taxCode);

      if (result.error && result.error.includes("chưa có user tra cứu")) {
        newFilteredList.push(item);
      }
    }

    if (newFilteredList.length === 0) {
      const startIndex = listKH.length >= 1000 ? 1000 : listKH.length;
      localStorage.setItem(taxCode, Number(startLocal) + startIndex);
      setStartLocal(startLocal + startIndex);
    }
    setlistKHChuaTaoTK(newFilteredList); // Cập nhật danh sách mới sau khi lọc
    setIsloading(false);
  };

  // show popup khi click vào nút tạo user
  const handleCreateUser = async () => {
    setIsOpenPopup(true);
  };

  // confirm create new user
  useEffect(() => {
    if (isConfirmCreate) {
      const handleCreateNewUser = async () => {
        setIsloadingCreateUser(true);
        if (listKHChuaTaoTK.length > 0) {
          let isCreateNewUser = false;
          const createUserPromises = listKHChuaTaoTK.map(async (item) => {
            const userInfo = {
              mst: taxCode,
              ma_dt: item.ma_dt,
              username: item.ma_dt,
              password: "123456",
              email: "",
            };
            const result = await CreateUser(taxCode, userInfo);
            if (result.data.error) {
              toast.error(
                <ToastNotify status={-1} message={result.data.error} />,
                {
                  style: styleError,
                }
              );
              return false;
            } else {
              toast.success(
                <ToastNotify status={1} message={result.data.ok} />,
                {
                  style: styleSuccess,
                }
              );
              return true;
            }
          });

          const results = await Promise.all(createUserPromises);
          isCreateNewUser = results.some((result) => result === true);

          if (isCreateNewUser) {
            setIsOpenMessage(true);
            setIsCreateUser(true);
            const startIndex = listKH.length >= 1000 ? 1000 : listKH.length;
            localStorage.setItem(taxCode, Number(startLocal) + startIndex);
            setStartLocal(startLocal + startIndex);
            setlistKHChuaTaoTK([]);
            setIsOpenPopup(false);
          }
        }
        setIsloadingCreateUser(false);
      };
      handleCreateNewUser();
    }
  }, [isConfirmCreate, listKHChuaTaoTK]);

  // tạo file excel với dữ liệu của user
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
    if (getIDRow === "" || getIDRow !== row.getValue("ma_dt")) {
      setIDRow(row.getValue("ma_dt"));
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
      accessorKey: "dia_chi",

      header: "Địa chỉ",
      Cell: ({ row }) => (
        <span className={row.original.ma_dt === getIDRow ? "active" : ""}>
          {row.original.dia_chi}
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
            setChooseUser(row.original);
            console.log(row.original);
            setModal(!modal);
          }}
        >
          <span
            className="fa-solid fa-plus"
            style={{ paddingRight: "5px" }}
          ></span>
          <span className="p-component">Tạo tra cứu</span>
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
      <ModalCreateUser
        modal={modal}
        chooseUser={chooseUser}
        setModal={setModal}
        editCustomerData={editCustomerData}
        setEditCustomerData={setEditCustomerData}
      />
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
          <ToastContainer autoClose={2000} hideProgressBar />
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
          <ModalChooseFile
            // getCustomer={getCustomer}
            isModalChooseFile={isModalChooseFile}
            setIsModalChooseFile={setIsModalChooseFile}
          />
          <div className="col-12">
            <MaterialReactTable
              muiTablePaperProps={{
                sx: {
                  flex: "1 1 0",
                  display: "flex",
                  "flex-flow": "column",
                },
              }}
              enableDensityToggle={false}
              enableFullScreenToggle={false}
              enableStickyFooter
              onSearchChange={() => console.log("tetx")}
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
                  height: "8px",
                },
              })}
              muiTableContainerProps={{
                sx: { maxHeight: "calc(95vh - 200px)" },
              }}
              positionPagination="bottom"
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
                <Box className="col" style={{ marginLeft: "20px" }}>
                  <Button
                    className="btn_add"
                    style={{}}
                    onClick={handleGetUser}
                    disabled={listKH.length === 0}
                  >
                    <div
                      style={{
                        borderRadius: "6px",
                        background: "#fce5cd",
                        padding: "4px",
                        position: "absolute",
                        left: -30,
                        top: -15,
                        width: "50px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "red",
                          textAlign: "center",
                          verticalAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {localStorage.getItem(taxCode) > 0
                          ? localStorage.getItem(taxCode)
                          : 0}
                      </span>
                    </div>
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-filter"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>
                      Lọc user chưa tạo
                    </span>
                  </Button>
                  {/* <Button className="btn_edit">
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-pencil"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>Sửa</span>
                  </Button> */}
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
                    <span style={{ paddingLeft: "5px" }}>Nhập excel</span>
                  </Button>
                  <Button onClick={handleExportCustomer} className="btn_export">
                    <span
                      style={{ paddingRight: "5px" }}
                      className="fa-solid fa-file-excel"
                    ></span>
                    <span style={{ paddingLeft: "5px" }}>Xuất excel</span>
                  </Button>
                  {listKHChuaTaoTK.length > 0 && (
                    <Button onClick={handleCreateUser} className="btn_user">
                      <span
                        style={{ paddingRight: "5px" }}
                        className="fa-solid fa-users"
                      ></span>
                      <span style={{ paddingLeft: "5px" }}>
                        Tạo {listKHChuaTaoTK.length} User
                      </span>
                    </Button>
                  )}
                </Box>
              )}
            />
            <div>
              <PopupDialog
                isOpen={isOpenPopup}
                numberUserNeedToCreate={listKHChuaTaoTK.length}
                setIsOpen={setIsOpenPopup}
                setIsConfirm={setIsConfirmCreate}
                isLoadingCreateUser={isLoadingCreateUser}
              />
            </div>
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
