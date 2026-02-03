const BASE_OPTS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bear O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=`,
  },
  signal: null,
};

async function callApi(taxCode, invoiceInfo, endpoint) {
  const TX = taxCode.replace(/[-\s]/g, "");
  const url = `https://${TX}.minvoice.app/api/InvoiceApi78/${endpoint}`;

  console.log(`🔗 URL ${endpoint}:`, url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, {
      ...BASE_OPTS,
      body: JSON.stringify(invoiceInfo),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Response ${endpoint}:`, data);
    return { data };
  } catch (error) {
    console.error(`❌ Error ${endpoint}:`, error);
    if (error.name === "AbortError") {
      console.error("❌ Request timeout");
    }
    return { data: null };
  }
}

/** Tạo nháp – API Save */
export async function Save(taxCode, invoiceInfo) {
  return callApi(taxCode, invoiceInfo, "Save");
}

/** Tạo ký – API SaveSign */
export async function SaveSign(taxCode, invoiceInfo) {
  return callApi(taxCode, invoiceInfo, "SaveSign");
}

/** Giữ tương thích: mặc định gọi Save (tạo nháp). */
async function CreateSave(taxCode, invoiceInfo, options = {}) {
  const useSign = options.mode === "sign";
  return useSign ? SaveSign(taxCode, invoiceInfo) : Save(taxCode, invoiceInfo);
}

export default CreateSave;
