async function GetUserTracuu(ma_dt, taxCode) {
  let sanitizedTaxCode = taxCode.replace(/-/g, "");
  const url = `https://${sanitizedTaxCode}.minvoice.com.vn/api/Invoice/GetUserTracuu`;
  const body = {
    ma_dt: ma_dt,
    mst: taxCode,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Trả về dữ liệu để xử lý lỗi
  } catch (error) {
    console.error("Error:", error);
    return { error: error.message };
  }
}
export default GetUserTracuu;
