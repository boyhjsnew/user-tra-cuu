import CreateSave from "./createSave";
import formatDate_DC from "./formatDate";

/**
 * Import Excel tạo mới hóa đơn - dùng cùng mẫu Excel với Thay thế.
 * Không gọi GetInvoices/GetInfoInvoice, gửi thẳng API Save hoặc SaveSign.
 * @param {string} taxCode - Mã số thuế
 * @param {Array} dataArray - Dữ liệu từ Excel
 * @param {Object} options - { mode: 'draft' | 'sign' } - draft = tạo nháp (Save), sign = tạo ký (SaveSign). Mặc định: 'draft'
 */
export async function createSaveExcel(taxCode, dataArray, options = {}) {
  const mode = options.mode === "sign" ? "sign" : "draft";
  const apiLabel = mode === "sign" ? "SaveSign" : "Save";
  console.log(
    `🚀 [${apiLabel}] Bắt đầu xử lý tạo mới hóa đơn (${
      mode === "sign" ? "ký" : "nháp"
    }), taxCode:`,
    taxCode
  );
  console.log("📊 [Save] Số lượng dòng dữ liệu:", dataArray.length);

  const groupedData = dataArray.reduce((acc, item) => {
    const [
      inv_invoiceSeries,
      so_benh_an,
      inv_invoiceIssuedDate,
      ,
      inv_itemCode,
      inv_itemName,
      inv_unitName,
      inv_quantity,
      inv_unitPrice,
      inv_discountPercentage,
      inv_discountAmount,
      inv_TotalAmountWithoutVat,
      ma_thue,
      inv_vatAmount,
      inv_TotalAmount,
      tchat,
      inv_buyerLegalName,
      inv_buyerDisplayName,
      inv_buyerAddressLine,
      inv_buyerTaxCode,
      ma_dt,
      khoa,
      HeDaoTao,
    ] = item;

    const groupKey = `${so_benh_an}|${inv_invoiceSeries}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        inv_invoiceSeries,
        so_benh_an,
        inv_invoiceIssuedDate: formatDate_DC(inv_invoiceIssuedDate),
        inv_currencyCode: "VND",
        inv_exchangeRate: 1,
        inv_buyerLegalName,
        inv_buyerDisplayName,
        inv_buyerAddressLine,
        inv_buyerTaxCode,
        inv_paymentMethodName: "Tiền mặt",
        Ma_DT: ma_dt || null,
        Khoa: khoa || null,
        HeDaoTao: HeDaoTao || null,
        details: [{ data: [] }],
      };
    }

    const currentSTT = acc[groupKey].details[0].data.length + 1;

    acc[groupKey].details[0].data.push({
      stt_rec0: currentSTT,
      inv_itemCode,
      inv_itemName,
      inv_unitCode: inv_unitName,
      inv_unitName,
      inv_unitPrice,
      inv_discountPercentage,
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

  console.log("📋 [Save] Số hóa đơn cần tạo:", invoices.length);

  const BATCH_SIZE = 10;
  for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
    const batch = invoices.slice(i, i + BATCH_SIZE);
    console.log(
      `[Save] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        invoices.length / BATCH_SIZE
      )}`
    );

    for (const invoice of batch) {
      try {
        const payload = { data: [invoice] };
        console.log("[Save] Payload:", JSON.stringify(payload, null, 2));

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000)
        );
        const responsePromise = CreateSave(taxCode, payload, { mode });
        const response = await Promise.race([responsePromise, timeoutPromise]);

        if (response && response.data && response.data.code === "00") {
          console.log(
            `✅ [Save] Tạo hóa đơn thành công: ${invoice.so_benh_an} - ${invoice.inv_invoiceSeries}`
          );
        } else {
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: invoice.inv_invoiceSeries,
            message: response?.data?.message || "Lỗi không xác định",
          });
        }
      } catch (error) {
        console.error(
          `⚠️ [Save] Lỗi ${invoice.so_benh_an} - ${invoice.inv_invoiceSeries}:`,
          error
        );
        errorInvoices.push({
          so_benh_an: invoice.so_benh_an,
          inv_invoiceSeries: invoice.inv_invoiceSeries,
          message: error.message || "Lỗi không xác định",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (i + BATCH_SIZE < invoices.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (errorInvoices.length > 0) {
    errorInvoices.forEach(({ so_benh_an, inv_invoiceSeries, message }) => {
      console.log(
        `[Save] Lỗi - ${so_benh_an}, ${inv_invoiceSeries}: ${message}`
      );
    });
    throw new Error(
      `Có ${errorInvoices.length} hóa đơn bị lỗi. Vui lòng kiểm tra console để xem chi tiết.`
    );
  }

  console.log("🎉 [Save] Tất cả hóa đơn đã được tạo thành công.");
}
