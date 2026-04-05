async function GetInvoices(taxCode, so_benh_an, inv_invoiceSeries) {
  // Xử lý taxcode để loại bỏ dấu gạch ngang và khoảng trắng
  const TX = taxCode.replace(/[-\s]/g, "");
  // API 1.0: domain minvoice.com.vn (khác API 2.0 dùng minvoice.app trong GetInfoInvoice.js)
  const url = `https://${TX}.minvoice.com.vn/api/InvoiceApi78/GetInfoInvoice?number=${so_benh_an}&seri=${inv_invoiceSeries}`;

  try {
    console.log("📤 Gọi API GetInvoices với URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bear O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Kiểm tra response có thành công không
    if (data.code === "00" && data.data && data.data.hoadon68_id) {
      return {
        success: true,
        hoadon68_id: data.data.hoadon68_id,
        inv_invoiceAuth_id: data.data.hoadon68_id, // Dùng hoadon68_id làm inv_invoiceAuth_id
        data: data.data,
      };
    } else {
      return {
        success: false,
        message: data.message || "Không tìm thấy hóa đơn",
        data: null,
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi gọi API",
      data: null,
    };
  }
}

export default GetInvoices;
