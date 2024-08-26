import * as React from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
// import Register from "./Page/Register";
import Login from "./page/Login";

import "././login.scss";
import "./App.css";

import { useEffect } from "react";
import NavBar from "./Components/NavBar";
import Dashboard from "./page/Dashboard";
import Breadcrumbs from "./Components/Breadcrumbs";
import Customer from "./page/ManageCustomer/Customer";

const Layout = () => {
  return (
    <>
      <NavBar />
      <Breadcrumbs />
      <Outlet />
    </>
  );
};
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/customers",
        element: <Customer />,
      },
    ],
  },
]);

function App() {
  return (
    <div className="app">
      <div className="container">
        <RouterProvider router={router} />
      </div>
    </div>
  );
}

export default App;
