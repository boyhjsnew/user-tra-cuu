import axios from "axios";

import qs from "qs";
import { replace } from "react-router-dom";

async function LoginApp(taxCode, username, password) {
  let sanitizedTaxCode = taxCode.replace(/-/g, "");
  const url = `https://${sanitizedTaxCode}.minvoice.com.vn/api/Account/Login`;

  const body = qs.stringify({
    username: username,
    password: password,
    ma_dvcs: "VP",
  });

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(response.data);
    return { token: response.data.token };
  } catch (error) {
    console.error("Error:", error);
    return { token: null };
  }
}

export default LoginApp;
