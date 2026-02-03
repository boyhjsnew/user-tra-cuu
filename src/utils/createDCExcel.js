import CreateDC from "./createDC";
import formatDate_DC from "./formatDate";
import GetInfoInvoice from "./GetInfoInvoice";
import GetInvoices from "./GetInvoices";

export async function createDCExcel(
  taxCode,
  dataArray,
  overrideInvoiceSeries = "",
  isExternalSystem = false,
  useApiV1 = false
) {
  // Nhóm dữ liệu theo so_benh_an và inv_invoiceSeries (key: "so_benh_an|inv_invoiceSeries")
  // Cấu trúc Excel: 0 Ký hiệu, 1 Số hoá đơn gốc, 2 Ngày hoá đơn, 3 STT (bỏ qua), 4 Mã hàng, ...
  const groupedData = dataArray.reduce((acc, item) => {
    const [
      inv_invoiceSeries, // 0: Ký hiệu
      so_benh_an, // 1: Số hoá đơn gốc
      inv_invoiceIssuedDate, // 2: Ngày hoá đơn // 3: STT - bỏ qua, sẽ tự đánh lại
      ,
      inv_itemCode, // 4: Mã hàng
      inv_itemName, // 5: Tên hàng
      inv_unitName, // 6: Đơn vị tính
      inv_quantity, // 7: Số lượng
      inv_unitPrice, // 8: Đơn giá
      inv_discountAmount, // 9: Tiền chiết khấu
      inv_TotalAmountWithoutVat, // 10: Tiền trước thuế
      ma_thue, // 11: Thuế suất
      inv_vatAmount, // 12: Tiền thuế
      inv_TotalAmount, // 13: Tổng tiền
      tchat, // 14: Tính chất
      inv_buyerDisplayName, // 15: Tên người mua
      inv_buyerAddressLine, // 16: Địa chỉ
      inv_buyerTaxCode, // 17: Mã số thuế
      inv_buyerLegalName, // 18: Tên đơn vị
      ma_dt,
      khoa,
      HeDaoTao,
    ] = item;

    const groupKey = `${so_benh_an}|${inv_invoiceSeries}`;

    if (!acc[groupKey]) {
      console.log(
        `📝 Tạo nhóm hóa đơn: số=${so_benh_an}, ký hiệu từ Excel="${inv_invoiceSeries}"`
      );
      acc[groupKey] = {
        inv_invoiceSeries, // Sử dụng ký hiệu từ Excel
        inv_InvoiceAuth_id: null,
        so_benh_an,
        inv_invoiceIssuedDate: formatDate_DC(inv_invoiceIssuedDate),
        inv_buyerDisplayName,
        inv_buyerAddressLine,
        inv_buyerTaxCode,
        inv_buyerLegalName,
        inv_paymentMethodName: "Thu qua NH",
        inv_currencyCode: "VND",
        inv_exchangeRate: 1,
        ma_dt,
        khoa,
        HeDaoTao,
        //dieu chinh tu he thong khac
        // isOtherSystem: true,
        // relatedInvoiceProperty: 2,
        // relatedInvoiceType: 1,
        // relatedInvoiceDate: formatDate_DC(inv_invoiceIssuedDate),
        // relatedTemplateCode: 1,
        // relatedInvoiceSerial: "C25MME",
        // relatedInvoiceNumber: so_benh_an,
        data: [],
      };
    }

    const currentSTT = (acc[groupKey].data.length + 1)
      .toString()
      .padStart(0, "0");

    acc[groupKey].data.push({
      stt_rec0: currentSTT,
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
    // Ký hiệu để lấy hóa đơn: dùng override từ form nếu có, không thì dùng từ Excel
    const seriesToGetInvoice =
      overrideInvoiceSeries || invoice.inv_invoiceSeries;
    // Ký hiệu để tạo hóa đơn điều chỉnh: luôn dùng từ Excel
    const seriesToCreateDC = invoice.inv_invoiceSeries;

    console.log(`🔍 Đang xử lý hóa đơn: số bệnh án=${invoice.so_benh_an}`);
    console.log(
      `   📥 Ký hiệu để lấy hóa đơn: "${seriesToGetInvoice}" ${
        overrideInvoiceSeries ? "(từ form)" : "(từ Excel)"
      }`
    );
    console.log(
      `   📤 Ký hiệu để tạo hóa đơn điều chỉnh: "${seriesToCreateDC}" (từ Excel)`
    );

    try {
      if (!isExternalSystem) {
        // Sử dụng API 1.0 hoặc 2.0 tùy theo option
        const invoiceInfo = useApiV1
          ? await GetInvoices(taxCode, invoice.so_benh_an, seriesToGetInvoice)
          : await GetInfoInvoice(
              taxCode,
              invoice.so_benh_an,
              seriesToGetInvoice
            );

        // API 1.0 trả về hoadon68_id, API 2.0 trả về inv_invoiceAuth_id
        const invoiceId =
          invoiceInfo.hoadon68_id || invoiceInfo.inv_invoiceAuth_id;

        if (!invoiceInfo.success || !invoiceId) {
          console.error(
            `❌ Không thể lấy thông tin hóa đơn cho ${invoice.so_benh_an} - ${seriesToGetInvoice}`
          );
          errorInvoices.push({
            so_benh_an: invoice.so_benh_an,
            inv_invoiceSeries: seriesToGetInvoice,
            message:
              invoiceInfo.message || "Không tìm thấy hóa đơn để điều chỉnh",
          });
          continue;
        }

        invoice.inv_InvoiceAuth_id = invoiceId;
        console.log(
          `✅ Đã lấy được inv_InvoiceAuth_id: ${
            invoice.inv_InvoiceAuth_id
          } cho ${invoice.so_benh_an} - ${seriesToGetInvoice} (API ${
            useApiV1 ? "1.0" : "2.0"
          })`
        );
      } else {
        console.log(
          `ℹ️ Bỏ qua bước lấy inv_InvoiceAuth_id vì điều chỉnh từ hệ thống khác cho ${invoice.so_benh_an}`
        );
      }

      // Luôn dùng ký hiệu từ Excel để tạo hóa đơn điều chỉnh
      invoice.inv_invoiceSeries = seriesToCreateDC;
      console.log(
        `📤 Ký hiệu sẽ dùng khi tạo hóa đơn điều chỉnh: "${seriesToCreateDC}" (từ Excel)`
      );

      const payload = invoice;
      console.log("▶️ Gửi payload:", JSON.stringify(payload, null, 2));

      const response = await CreateDC(taxCode, payload);
      if (response.data && response.data.code === "00") {
        console.log(
          `✅ Tạo hóa đơn điều chỉnh thành công cho ${invoice.so_benh_an} - ${seriesToCreateDC}`
        );
      } else {
        console.error(
          `❌ Không thể tạo hóa đơn điều chỉnh cho ${invoice.so_benh_an} - ${seriesToCreateDC}`
        );
        errorInvoices.push({
          so_benh_an: invoice.so_benh_an,
          inv_invoiceSeries: seriesToCreateDC,
          message: response.data?.message || "Lỗi không xác định",
        });
      }
    } catch (error) {
      console.error(
        `⚠️ Lỗi khi xử lý hóa đơn cho ${invoice.so_benh_an} - ${seriesToCreateDC}:`,
        error
      );
      errorInvoices.push({
        so_benh_an: invoice.so_benh_an,
        inv_invoiceSeries: seriesToCreateDC,
        message: error.message || "Lỗi không xác định",
      });
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
