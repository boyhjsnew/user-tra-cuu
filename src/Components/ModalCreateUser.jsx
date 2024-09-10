import React, { useEffect, useState } from "react";
import "./Modal.css";
import "../../src/dashboard.scss";
import axios from "axios";
import { format, set } from "date-fns";
import { toast } from "react-toastify";
import { styleError, styleSuccess } from "./ToastNotifyStyle";
import ToastNotify from "./ToastNotify";
import CreateUser from "../utils/createUser";

export default function ModalCreateUser(props) {
  const { modal, setModal, editServiceData, chooseUser } = props;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [email, setEmail] = useState("");

  const toggleModal = () => {
    setModal(!modal);
    setUsername(chooseUser.ma_dt || "");
    setTaxCode(taxCode || "");
    setEmail(chooseUser.email);
    setPassword("");
  };
  useEffect(() => {
    const taxCode = localStorage.getItem("login");
    if (chooseUser) {
      setUsername(chooseUser.ma_dt || "");
      setTaxCode(taxCode || "");
      setEmail(chooseUser.email);
    }
  }, [chooseUser]);

  // useEffect(() => {
  //   // Nếu có dữ liệu khách hàng, thì điền dữ liệu đó vào các trường nhập liệu
  //   if (editServiceData) {
  //     SetServiceName(editServiceData.ServiceName || "");
  //     SetServicePrice(
  //       parseInt(editServiceData.ServicePrice.replace(/\./g, ""), 10)
  //     );

  //     console.log(editServiceData.ServicePrice);
  //   } else {
  //     // Nếu không có dữ liệu khách hàng, xóa toàn bộ trường nhập liệu
  //     SetServiceName("");
  //     SetServicePrice("");
  //   }
  // }, [editServiceData]);

  // const handlePriceChange = (e) => {
  //   const inputValue = e.target.value;
  //   const formattedPrice = formatInputPrice(inputValue);
  //   SetServicePrice(formattedPrice);
  // };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !password || !taxCode) {
      toast.error(
        <ToastNotify status={-1} message="Vui lòng nhập đầy đủ thông tin !" />,
        {
          style: styleError,
        }
      );
    } else {
      const userInfo = {
        mst: taxCode,
        ma_dt: username,
        username: username,
        password: password,
        email: email,
      };

      try {
        const response = await CreateUser(taxCode, userInfo);

        if (response.data) {
          toggleModal();
          toast.success(<ToastNotify status={1} message={response.data.ok} />, {
            style: styleSuccess,
          });
        } else {
          throw new Error("Failed to create user.");
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error(<ToastNotify status={-1} message={error.error} />, {
          style: styleError,
        });
      }
    }
  };

  // Hàm xử lý cập nhật thông tin khách hàng
  // const handleUpdateService = async (event) => {
  //   event.preventDefault();
  //   try {
  //     const response = await axios.put(`http://127.0.0.1:8081/UpdateService`, {
  //       ServiceName,
  //       ServicePrice,
  //     });
  //     console.log("Update Success:", response);
  //     setModal(!modal);

  //     toggleModal();
  //   } catch (error) {
  //     toggleModal();
  //     console.error("Update Error:", error);
  //   }
  // };
  // if (modal) {
  //   document.body.classList.add("active-modal");
  // } else {
  //   document.body.classList.remove("active-modal");
  // }

  return (
    <>
      {modal && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content">
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
                  Tạo user tra cứu {"- "}
                  {chooseUser.ma_dt}
                </span>
                <div className="close-modal" onClick={toggleModal}>
                  <i
                    className="fa-solid fa-xmark"
                    style={{ fontSize: "16px", color: "#AAAA" }}
                  ></i>
                </div>
              </div>
              {
                <form className="form-customer">
                  {/* row 1 name - acoutn type */}
                  <div className="row">
                    <div className="block col" style={{ flex: 1 }}>
                      <label className="block lbl-txt" htmlFor="">
                        Mã số thuế
                        <span style={{ color: "red", paddingLeft: "5px" }}>
                          (*)
                        </span>
                      </label>

                      <input
                        value={taxCode}
                        className="input-customer"
                        id="username"
                        type="text"
                        onChange={(e) => setTaxCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="block col" style={{ flex: 1 }}>
                      <label className="block lbl-txt" htmlFor="">
                        Tên đăng nhập
                        <span style={{ color: "red", paddingLeft: "5px" }}>
                          (*)
                        </span>
                      </label>
                      <input
                        value={username}
                        className="input-customer"
                        id="username"
                        type="text"
                        name="ServiceName"
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="block col" style={{ flex: 1 }}>
                      <label className="block lbl-txt" htmlFor="">
                        Mật khẩu
                        <span style={{ color: "red", paddingLeft: "5px" }}>
                          (*)
                        </span>
                      </label>
                      <input
                        value={password}
                        className="input-customer"
                        id="username"
                        type="text"
                        name="ServicePrice"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="block col" style={{ flex: 1 }}>
                      <label className="block lbl-txt" htmlFor="">
                        Email
                      </label>
                      <input
                        value={email}
                        className="input-customer"
                        id="username"
                        type="email"
                        name="ServicePrice"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div
                    className="row"
                    style={{
                      justifyContent: "flex-end",
                      margin: "0 10px",
                      marginTop: "5px",
                    }}
                  >
                    <div className="btn-cancel col" onClick={toggleModal}>
                      <span
                        className="fa-solid fa-xmark"
                        style={{ paddingRight: "5px" }}
                      ></span>

                      <span className="p-component">Đóng</span>
                    </div>
                    {editServiceData ? (
                      <button
                        // onClick={handleUpdateService}
                        className="btn-edit col "
                        style={{
                          marginLeft: "5px",
                        }}
                      >
                        <span
                          className="fa-solid fa-check"
                          style={{
                            paddingRight: "5px",
                          }}
                        ></span>
                        <span className="p-component">Cập nhật</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        className="btn-save col "
                        style={{ marginLeft: "5px" }}
                      >
                        <span
                          className="fa-solid fa-check"
                          style={{ paddingRight: "5px" }}
                        ></span>
                        <span className="p-component">Tạo</span>
                      </button>
                    )}
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
