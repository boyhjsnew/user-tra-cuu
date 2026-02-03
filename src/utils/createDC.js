import { replace } from "react-router-dom";

async function CreateDC(taxCode, invoiceInfo) {
  // Xử lý taxcode để loại bỏ dấu gạch ngang và khoảng trắng
  const TX = taxCode.replace(/[-\s]/g, "");
  // const url = `https://${TX}.minvoice.app/api/InvoiceApi78/DieuChinh`;
  const url = `https://${TX}.minvoice.com.vn/api/InvoiceApi78/DieuChinh`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bear " + "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
      body: JSON.stringify(invoiceInfo),
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

export default CreateDC;
