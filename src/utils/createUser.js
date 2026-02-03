import { replace } from "react-router-dom";

async function CreateTT(taxCode, invoiceInfo) {
  // Xử lý taxcode để loại bỏ dấu gạch ngang và khoảng trắng
  const TX = taxCode.replace(/[-\s]/g, "");
  const url = `https://${TX}.minvoice.app/api/InvoiceApi78/ThayThe`;
  // const url = `https://${TX}.minvoice.com.vn/api/InvoiceApi78/ThayThe`;

  console.log("🔗 URL:", url);
  console.log("📋 TaxCode đã xử lý:", TX);

  try {
    // Thêm timeout cho fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 giây timeout
    //"O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bear " + "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
      body: JSON.stringify(invoiceInfo),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Response data:", data);

    return { data };
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.name === "AbortError") {
      console.error("❌ Request timeout");
    }
    return { data: null };
  }
}

export default CreateTT;
