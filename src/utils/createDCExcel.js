import CreateDC from "./createDC";
import formatDate_DC from "./formatDate";

export async function createDCExcel(taxCode, dataArray) {
  const groupedData = dataArray.reduce((acc, item) => {
    const [
      inv_invoiceSeries,
      so_benh_an,
      inv_invoiceIssuedDate,
      inv_InvoiceAuth_id, // STT gốc - bỏ qua
      ,
      inv_itemCode,
      inv_itemName,
      inv_unitName,
      inv_quantity,
      inv_unitPrice,
      inv_discountAmount,
      inv_TotalAmountWithoutVat,
      ma_thue,
      inv_vatAmount,
      inv_TotalAmount,
      tchat,
      inv_buyerDisplayName,
      inv_buyerAddressLine,
      inv_buyerTaxCode,
      inv_buyerLegalName,
    ] = item;

    if (!acc[so_benh_an]) {
      acc[so_benh_an] = {
        inv_invoiceSeries,
        inv_InvoiceAuth_id,
        so_benh_an,
        inv_invoiceIssuedDate: formatDate_DC(inv_invoiceIssuedDate),
        inv_buyerDisplayName,
        inv_buyerAddressLine,
        inv_buyerTaxCode,
        inv_buyerLegalName,
        inv_paymentMethodName: "TM/CK",
        data: [],
      };
    }

    const currentSTT = (acc[so_benh_an].data.length + 1)
      .toString()
      .padStart(0, "0");

    acc[so_benh_an].data.push({
      //stt_rec0: currentSTT,
      stt: currentSTT,
      ma: inv_itemCode,
      inv_itemName,
      inv_unitCode: inv_unitName,
      inv_unitName,
      inv_unitPrice,
      inv_discountAmount,
      inv_quantity,
      inv_TotalAmountWithoutVat,
      inv_vatAmount,
      inv_TotalAmount,
      ma_thue,
      tchat,
    });

    return acc;
  }, {});

  const invoices = Object.values(groupedData);
  const errorInvoices = [];

  for (const invoice of invoices) {
    const payload = invoice;

    console.log("▶️ Gửi payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await CreateDC(taxCode, payload);
      if (response.data && response.data.code === "00") {
        console.log(`✅ Tạo hóa đơn thành công cho ${invoice.so_benh_an}`);
      } else {
        console.error(`❌ Không thể tạo hóa đơn cho ${invoice.so_benh_an}`);
        errorInvoices.push({
          so_benh_an: invoice.so_benh_an,
          message: response.data?.message || "Lỗi không xác định",
        });
      }
    } catch (error) {
      console.error(`⚠️ Lỗi khi tạo hóa đơn cho ${invoice.so_benh_an}:`, error);
      errorInvoices.push({
        so_benh_an: invoice.so_benh_an,
        message: error.message || "Lỗi không xác định",
      });
    }
  }

  if (errorInvoices.length > 0) {
    console.log("🛑 Danh sách các hóa đơn bị lỗi:");
    errorInvoices.forEach(({ so_benh_an, message }) => {
      console.log(`- Số bệnh án: ${so_benh_an}, Lỗi: ${message}`);
    });
  } else {
    console.log("🎉 Tất cả hóa đơn đã được tạo thành công.");
  }
}
