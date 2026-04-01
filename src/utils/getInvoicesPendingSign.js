/**
 * Lấy danh sách hóa đơn chờ ký (tối đa 250 record/lần).
 * API: command CM0009, filter tthai = "Chờ ký", is_send_email = "thirdState".
 */

const DEFAULT_AUTH =
  "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=";

async function getInvoicesPendingSign(taxCode, cctbao_id, start = 0, count = 250, authToken = DEFAULT_AUTH) {
  const TX = (taxCode || "").replace(/[-\s]/g, "");
  const url = `https://${TX}.minvoice.com.vn/api/Pattern/GetData`;

  const body = {
    command: "CM0009",
    start: start,
    count: count,
    filter: [
      { columnName: "tthai", columnType: "nvarchar", value: "Chờ ký" },
      { columnName: "is_send_email", columnType: "bit", value: "thirdState" },
    ],
    tlbparam: [{ columnName: "cctbao_id", value: cctbao_id }],
    isListAll: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bear ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const list = result?.data ?? [];
    const total_count = result?.total_count ?? 0;

    return {
      data: result,
      list,
      total_count,
      pos: result?.pos ?? start,
    };
  } catch (error) {
    console.error("getInvoicesPendingSign error:", error);
    let msg = error.message;
    if (msg === "Failed to fetch" || error?.name === "TypeError") {
      msg =
        "Failed to fetch (CORS hoặc mạng). Chạy từ localhost: thử tắt extension, hoặc dùng proxy trong package.json (mã số thuế 1702325579).";
    }
    return {
      data: null,
      list: [],
      total_count: 0,
      error: msg,
    };
  }
}

export default getInvoicesPendingSign;
