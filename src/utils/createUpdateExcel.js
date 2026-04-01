import CreateSave from "./createSave";
import formatDate_DC from "./formatDate";
import GetInvoices from "./GetInvoices";

/**
 * Import Excel cập nhật hóa đơn hàng loạt - dùng API Save với editMode 2 (sửa).
 * Cùng mẫu Excel với Tạo mới / Thay thế.
 * @param {string} taxCode - Mã số thuế
 * @param {Array} dataArray - Dữ liệu từ Excel
 * @param {Object} options - { mode: 'draft' | 'sign' } - draft = nháp, sign = ký. Mặc định: 'draft'
 */
export async function createUpdateExcel(taxCode, dataArray, options = {}) {
  const mode = options.mode === "sign" ? "sign" : "draft";
  const apiLabel = mode === "sign" ? "SaveSign" : "Save";
  console.log(
    `🚀 [${apiLabel}] Bắt đầu cập nhật hóa đơn (editMode 2) (${
      mode === "sign" ? "ký" : "nháp"
    }), taxCode:`,
    taxCode
  );
  console.log("📊 [Update] Số lượng dòng dữ liệu:", dataArray.length);

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
        inv_invoiceNumber: so_benh_an,
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

  console.log("📋 [Update] Số hóa đơn cần cập nhật:", invoices.length);

  const BATCH_SIZE = 10;
  for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
    const batch = invoices.slice(i, i + BATCH_SIZE);
    console.log(
      `[Update] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        invoices.length / BATCH_SIZE
      )}`
    );

    for (const invoice of batch) {
      try {
        const getRes = await GetInvoices(
          taxCode,
          invoice.so_benh_an,
          invoice.inv_invoiceSeries
        );
        if (!getRes.success || !getRes.data) {
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: invoice.inv_invoiceSeries,
            message: getRes.message || "Không lấy được thông tin hóa đơn (keyApi)",
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        const keyApi = getRes.data.keyApi || getRes.data.key_api || null;
        if (!keyApi) {
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: invoice.inv_invoiceSeries,
            message: "API không trả về keyApi",
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        const invoiceWithKey = { ...invoice, keyApi };

        const payload = { data: [invoiceWithKey], editMode: 2 };
        console.log("[Update] Payload:", JSON.stringify(payload, null, 2));

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000)
        );
        const responsePromise = CreateSave(taxCode, payload, { mode });
        const response = await Promise.race([responsePromise, timeoutPromise]);

        if (response && response.data && response.data.code === "00") {
          console.log(
            `✅ [Update] Cập nhật hóa đơn thành công: ${invoice.so_benh_an} - ${invoice.inv_invoiceSeries}`
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
          `⚠️ [Update] Lỗi ${invoice.so_benh_an} - ${invoice.inv_invoiceSeries}:`,
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
        `[Update] Lỗi - ${so_benh_an}, ${inv_invoiceSeries}: ${message}`
      );
    });
    throw new Error(
      `Có ${errorInvoices.length} hóa đơn bị lỗi. Vui lòng kiểm tra console để xem chi tiết.`
    );
  }

  console.log("🎉 [Update] Tất cả hóa đơn đã được cập nhật thành công.");
}
