import React, { useEffect, useState } from "react";
import "./ModalMenu.css";

import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const ModalMenu = (props) => {
  const [name, setName] = useState("Admin");

  const handleLogut = () => {
    localStorage.removeItem("login");
    localStorage.removeItem("start");
    window.location.reload();
  };
  //   useEffect(() => {
  //     const token = Cookies.get("token");
  //     if (token) {
  //       const storedUsername = Cookies.get("username");
  //       setName(storedUsername);
  //     }
  //   }, []);

  const { isModalChangePass, setIsModalChangePass, setIsModalMenu } = props;
  return (
    <div className="menu_profile">
      <ul className="list-profile">
        <li>
          <a className="p-item-menu" href="#">
            <span className="fa-regular fa-user pi"></span>
            <span>{name ? name : ""}</span>
          </a>
        </li>
        <li
        //   onClick={() => {
        //     setIsModalChangePass(!isModalChangePass);
        //     setIsModalMenu(false);
        //   }}
        >
          <a className="p-item-menu" href="#">
            <span className="fa-solid fa-key pi"></span>

            <span>Đổi mật khẩu</span>
          </a>
        </li>
        <li className="separator" role="separator"></li>
        <li onClick={handleLogut}>
          <a className="p-item-menu" href="#" style={{ marginBottom: "5px" }}>
            <span className="fa-solid fa-right-from-bracket pi"></span>

            <span>Đăng xuất</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default ModalMenu;
