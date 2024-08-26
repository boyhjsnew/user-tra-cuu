import React from "react";

async function GetDmkh(taxCode) {
  let sanitizedTaxCode = taxCode.replace(/-/g, "");
  const url = `https://${sanitizedTaxCode}.minvoice.com.vn/api/System/GetDataByWindowNo1`;
  const body = {
    window_id: "WIN00009",
    start: 0,
    count: 2000,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bear " + "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return { data };
  } catch (error) {
    console.error("Error:", error);
    return { data: null };
  }
}

export default GetDmkh;
