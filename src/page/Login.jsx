import React, { useEffect, useState, CSSProperties } from "react";

import { Link, useNavigate } from "react-router-dom";

import GetALLDmdv from "../utils/getAllDmdv";
import { ToastContainer, toast } from "react-toastify";
import ToastNotify from "../Components/ToastNotify";
import { styleError, styleSuccess } from "../Components/ToastNotifyStyle";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [isCheck, setIsCheck] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const dataLogin = await GetALLDmdv(taxCode);

      if (
        dataLogin?.data &&
        Array.isArray(dataLogin.data) &&
        dataLogin.data.length > 0
      ) {
        localStorage.setItem("login", taxCode);
        localStorage.setItem("comapyname", dataLogin.data[0].ten_dvcs);
        toast.success(
          <ToastNotify status={0} message={"Đăng nhập thành công"} />,
          { style: styleSuccess }
        );
        navigate("/customers");
      } else {
        const errorMessage = dataLogin?.data?.message || "Đăng nhập thất bại";
        toast.error(<ToastNotify status={-1} message={errorMessage} />, {
          style: styleError,
        });
      }
    } catch (error) {
      toast.error(
        <ToastNotify
          status={-1}
          message="Có lỗi xảy ra trong quá trình đăng nhập"
        />,
        {
          style: styleError,
        }
      );
    }
  };

  useEffect(() => {
    const taxCode = localStorage.getItem("login");
    if (taxCode) {
      navigate("/customers");
    }
  }, [taxCode]);

  return (
    <div className="login">
      <ToastContainer
        autoClose={2000}
        hideProgressBar
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="left-row"></div>
      <div className="right-row">
        <div className="form-auth">
          <div style={{ textAlign: "center" }}>
            <img
              src={require("../assets/logo-minvoice.png")}
              alt="logo"
              width={"164px"}
              height={"115px"}
            ></img>
            <p
              style={{
                fontWeight: 500,
                color: "#99321E",
                fontSize: "23px",
                marginBottom: "30px",
              }}
            >
              Quản lý User Tra Cứu
            </p>
          </div>

          <form className="form-login">
            <label className="block  mb-2 fz-15" htmlFor="uname">
              Mã số thuế
            </label>
            <input
              id="username"
              className="input-login mb-3"
              type="text"
              name="uname"
              onChange={(e) => setTaxCode(e.target.value)}
            />
            <label className="block mb-2 fz-15 " htmlFor="uname">
              Tài khoản
            </label>
            <input
              id="username"
              className="input-login mb-3"
              type="text"
              name="uname"
              onChange={(e) => setUsername(e.target.value)}
            />
            <label className="block  lbl-text mb-2 fz-15" htmlFor="uname">
              Mật khẩu
            </label>
            <div style={{}}>
              <input
                id="password"
                className="input-login mb-3"
                type={isCheck ? "text" : "password"}
                name="pwrd"
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* them easye passs */}
            </div>
            <div
              style={{
                height: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* quen mat khau */}
                <div>
                  <form
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      onClick={() => setIsCheck(!isCheck)}
                      checked={isCheck}
                      type="checkbox"
                      id="cb-mind"
                      name="mindAcc"
                      className="checkbox-input"
                    />
                    <label
                      className="lbl-checkbox fz-15"
                      style={{ padding: "8px" }}
                      htmlFor="cb-mind"
                    >
                      Hiện mật khẩu
                    </label>
                  </form>
                </div>
              </div>
              {/* <Link>
                <span
                  style={{
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "15px",
                  }}
                >
                  Quên mật khẩu?
                </span>
              </Link> */}
            </div>
          </form>
          <button
            type="submit"
            className="p-button mt-2 fz-15"
            onClick={handleLogin}
          >
            <i class="fa-regular fa-user"></i>
            <Link
              style={{
                flex: 1,
                padding: "0.75rem",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Đăng nhập
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
