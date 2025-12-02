import CreateTT from "./createUser";
import formatDate_DC from "./formatDate";
import GetInfoInvoice from "./GetInfoInvoice";

export async function createTTExcel(
  taxCode,
  dataArray,
  overrideInvoiceSeries = ""
) {
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
      inv_invoiceIssuedDate, // Bỏ qua inv_originalId - sẽ lấy từ API
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

    const groupKey = `${so_benh_an}|${inv_invoiceSeries}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        inv_originalId: null, // Sẽ được lấy từ API
        ngayvb: formatDate_DC(inv_invoiceIssuedDate),
        sovb: `DC_${so_benh_an}`,
        inv_invoiceSeries,
        so_benh_an,
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

    const currentSTT = acc[groupKey].details[0].data.length + 1;

    acc[groupKey].details[0].data.push({
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
      // Ký hiệu để lấy hóa đơn: dùng override từ form nếu có, không thì dùng từ Excel
      const seriesToGetInvoice =
        overrideInvoiceSeries || invoice.inv_invoiceSeries;
      // Ký hiệu để tạo hóa đơn thay thế: luôn dùng từ Excel
      const seriesToCreateTT = invoice.inv_invoiceSeries;

      console.log(`🔍 Đang xử lý hóa đơn: số bệnh án=${invoice.so_benh_an}`);
      console.log(
        `   📥 Ký hiệu để lấy hóa đơn: "${seriesToGetInvoice}" ${
          overrideInvoiceSeries ? "(từ form)" : "(từ Excel)"
        }`
      );
      console.log(
        `   📤 Ký hiệu để tạo hóa đơn thay thế: "${seriesToCreateTT}" (từ Excel)`
      );

      try {
        // Lấy thông tin hóa đơn từ API để lấy inv_originalId
        const invoiceInfo = await GetInfoInvoice(
          taxCode,
          invoice.so_benh_an,
          seriesToGetInvoice
        );

        if (!invoiceInfo.success) {
          console.error(
            `❌ Không thể lấy thông tin hóa đơn cho ${invoice.so_benh_an} - ${seriesToGetInvoice}`
          );
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: seriesToGetInvoice,
            message:
              invoiceInfo.message || "Không tìm thấy hóa đơn để thay thế",
          });
          continue;
        }

        // Sử dụng inv_originalId từ response hoặc inv_invoiceAuth_id
        // GetInfoInvoice trả về inv_invoiceAuth_id, có thể dùng làm inv_originalId
        invoice.inv_originalId =
          invoiceInfo.data?.inv_originalId ||
          invoiceInfo.data?.inv_invoiceAuth_id ||
          invoiceInfo.inv_invoiceAuth_id;

        if (!invoice.inv_originalId) {
          console.error(
            `❌ Không tìm thấy inv_originalId cho ${invoice.so_benh_an} - ${seriesToGetInvoice}`
          );
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: seriesToGetInvoice,
            message: "Không tìm thấy ID hóa đơn gốc",
          });
          continue;
        }

        console.log(
          `✅ Đã lấy được inv_originalId: ${invoice.inv_originalId} cho ${invoice.so_benh_an} - ${seriesToGetInvoice}`
        );

        // Đảm bảo ký hiệu trong invoice là ký hiệu từ Excel (để tạo hóa đơn thay thế)
        invoice.inv_invoiceSeries = seriesToCreateTT;
        console.log(
          `📤 Ký hiệu sẽ dùng khi tạo hóa đơn thay thế: "${seriesToCreateTT}" (từ Excel)`
        );

        const payload = { data: [invoice] };

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
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: seriesToCreateTT,
            message: response?.data?.message || "Lỗi không xác định",
          });
        }
      } catch (error) {
        console.error(
          `⚠️ Lỗi khi tạo hóa đơn cho ${invoice.so_benh_an} - ${seriesToCreateTT}:`,
          error
        );
        errorInvoices.push({
          so_benh_an: invoice.so_benh_an,
          inv_invoiceSeries: seriesToCreateTT,
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
    errorInvoices.forEach(({ so_benh_an, inv_invoiceSeries, message }) => {
      console.log(
        `- Số bệnh án: ${so_benh_an}, Ký hiệu: ${
          inv_invoiceSeries || "N/A"
        }, Lỗi: ${message}`
      );
    });
    throw new Error(
      `Có ${errorInvoices.length} hóa đơn bị lỗi. Vui lòng kiểm tra console để xem chi tiết.`
    );
  } else {
    console.log("🎉 Tất cả hóa đơn đã được tạo thành công.");
  }
}
