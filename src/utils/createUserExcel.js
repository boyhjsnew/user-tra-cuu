import CreateTT from "./createUser";
import formatDate_DC from "./formatDate";

export async function createTTExcel(taxCode, dataArray) {
  console.log("🚀 Bắt đầu xử lý với taxCode:", taxCode);
  console.log("📊 Số lượng dòng dữ liệu:", dataArray.length);

  // Bỏ giới hạn MAX_ROWS - xử lý tất cả dữ liệu
  // const MAX_ROWS = 1000;
  // if (dataArray.length > MAX_ROWS) {
  //   console.warn(
  //     `⚠️ Quá nhiều dữ liệu (${dataArray.length} dòng). Chỉ xử lý ${MAX_ROWS} dòng đầu tiên.`
  //   );
  //   dataArray = dataArray.slice(0, MAX_ROWS);
  // }

  const groupedData = dataArray.reduce((acc, item) => {
    const [
      inv_invoiceSeries,
      so_benh_an,
      inv_invoiceIssuedDate,
      inv_originalId,
      ,
      inv_itemCode,
      inv_itemName,
      inv_unitName,
      inv_quantity,
      inv_unitPrice,
      inv_TotalAmountWithoutVat,
      ma_thue,
      inv_vatAmount,
      inv_TotalAmount,
      tchat,
      inv_buyerLegalName,
      inv_buyerDisplayName,
      inv_buyerAddressLine,
      inv_buyerTaxCode,
    ] = item;

    if (!acc[so_benh_an]) {
      acc[so_benh_an] = {
        inv_originalId,
        ngayvb: formatDate_DC(inv_invoiceIssuedDate),
        sovb: `DC_${so_benh_an}`,
        inv_invoiceSeries,
        inv_invoiceIssuedDate: formatDate_DC(inv_invoiceIssuedDate),
        inv_currencyCode: "VND",
        inv_exchangeRate: 1,
        inv_buyerLegalName,
        inv_buyerDisplayName,
        inv_buyerAddressLine,
        inv_buyerTaxCode,
        inv_paymentMethodName: "TM/CK",
        details: [
          {
            data: [],
          },
        ],
      };
    }

    const currentSTT = acc[so_benh_an].details[0].data.length + 1;

    acc[so_benh_an].details[0].data.push({
      stt_rec0: currentSTT,
      ma: inv_itemCode,
      inv_itemName,
      inv_unitCode: inv_unitName,
      inv_unitName,
      inv_unitPrice,
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

  console.log("📋 Số hóa đơn cần xử lý:", invoices.length);

  // Xử lý từng batch nhỏ để tránh timeout
  const BATCH_SIZE = 10;
  for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
    const batch = invoices.slice(i, i + BATCH_SIZE);
    console.log(
      ` Xử lý batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        invoices.length / BATCH_SIZE
      )}`
    );

    for (const invoice of batch) {
      const payload = { data: [invoice] };

      try {
        // Thêm timeout cho mỗi request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000)
        );

        const responsePromise = CreateTT(taxCode, payload);
        const response = await Promise.race([responsePromise, timeoutPromise]);

        if (response && response.data && response.data.code === "00") {
          console.log(`✅ Tạo hóa đơn thành công cho ${invoice.sovb}`);
        } else {
          console.error(`❌ Không thể tạo hóa đơn cho ${invoice.sovb}`);
          errorInvoices.push({
            so_benh_an: invoice.sovb,
            message: response?.data?.message || "Lỗi không xác định",
          });
        }
      } catch (error) {
        console.error(`⚠️ Lỗi khi tạo hóa đơn cho ${invoice.sovb}:`, error);
        errorInvoices.push({
          so_benh_an: invoice.sovb,
          message: error.message || "Lỗi không xác định",
        });
      }

      // Delay nhỏ giữa các request để tránh quá tải
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Delay giữa các batch
    if (i + BATCH_SIZE < invoices.length) {
      console.log("⏳ Chờ 0,5 giây trước khi xử lý batch tiếp theo...");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (errorInvoices.length > 0) {
    console.log("🛑 Danh sách các hóa đơn bị lỗi:");
    errorInvoices.forEach(({ so_benh_an, message }) => {
      console.log(`- Số bệnh án: ${so_benh_an}, Lỗi: ${message}`);
    });
    throw new Error(
      `Có ${errorInvoices.length} hóa đơn bị lỗi trong quá trình xử lý`
    );
  } else {
    console.log("🎉 Tất cả hóa đơn đã được tạo thành công.");
  }
}
