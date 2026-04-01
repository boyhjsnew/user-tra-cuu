/**
 * Huỷ hóa đơn VAT IPOS theo danh sách tran_id.
 * JSON đầu vào có dạng: { "data": [ { "tran_id": "...", ... }, ... ] }
 * Gọi API DELETE từng tran_id: https://posapi.ipos.vn/api/invoice/v1/delete?merged_tran_id={tran_id}
 */

const IPOS_DELETE_BASE = "https://posapi.ipos.vn/api/invoice/v1/delete";

const DEFAULT_HEADERS = {
  Accept: "application/json, text/plain, */*",
  Authorization:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE0M2Q0ZGQxLWM1ZGYtNDI4OS05NDFhLWYyMjE4YjMyYjEwNyIsInV0IjoiODg0NzQ1MzQtOTNhOS00YzRhLWE3M2QtZjUyODg2NTU1ZDJjIiwiZW1haWwiOiJiYWNrdXAubWVkaUBnbWFpbC5jb20iLCJpYXQiOjE3NzA1MzY2OTksImV4cCI6MTc3MTE0MTQ5OX0.-X-yim3myo_-nOg7i2ev38l3IwCMunjDv7fzQX9VkR0",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  Origin: "https://fabi.ipos.vn",
  Pragma: "no-cache",
  Referer: "https://fabi.ipos.vn/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
  "accept-language": "vi",
  access_token: "5c885b2ef8c34fb7b1d1fad11eef7bec",
  fabi_type: "pos-cms",
  "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "x-client-timezone": "25200000",
};

/**
 * Trích danh sách tran_id từ JSON (object hoặc chuỗi).
 * @param {string|object} jsonInput - Chuỗi JSON hoặc object có thuộc tính data là mảng
 * @returns {{ tranIds: string[], error?: string }}
 */
export function parseTranIdsFromJson(jsonInput) {
  try {
    const parsed =
      typeof jsonInput === "string" ? JSON.parse(jsonInput) : jsonInput;
    if (!parsed || !Array.isArray(parsed.data)) {
      return { tranIds: [], error: "JSON phải có thuộc tính 'data' là mảng." };
    }
    const tranIds = parsed.data
      .map((item) => item && item.tran_id)
      .filter(Boolean);
    const unique = [...new Set(tranIds)];
    console.log(
      `[CancelVatIpos] Đã trích ${unique.length} tran_id từ ${parsed.data.length} bản ghi.`
    );
    return { tranIds: unique };
  } catch (e) {
    console.error("[CancelVatIpos] Lỗi parse JSON:", e);
    return {
      tranIds: [],
      error: e.message || "JSON không hợp lệ.",
    };
  }
}

/**
 * Gọi API DELETE huỷ một hóa đơn theo tran_id.
 * @param {string} tranId
 * @param {object} options - { headers?: object, signal?: AbortSignal }
 */
export async function deleteVatInvoiceByTranId(tranId, options = {}) {
  const url = `${IPOS_DELETE_BASE}?merged_tran_id=${encodeURIComponent(tranId)}`;
  const headers = { ...DEFAULT_HEADERS, ...options.headers };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const signal = options.signal || controller.signal;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data, tranId };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      data: null,
      tranId,
      error: err.message || "Request failed",
    };
  }
}

/**
 * Huỷ hàng loạt: trích tran_id từ JSON rồi gọi DELETE từng tran_id.
 * @param {string|object} jsonInput - JSON có data[] chứa tran_id
 * @param {object} options - { headers?: object, delayMs?: number, onProgress?: (done, total, tranId) => void }
 * @returns {Promise<{ success: number, failed: number, results: array, tranIds: string[] }>}
 */
export async function cancelVatIposByJson(jsonInput, options = {}) {
  const { tranIds, error } = parseTranIdsFromJson(jsonInput);
  if (error) {
    throw new Error(error);
  }
  if (tranIds.length === 0) {
    return { success: 0, failed: 0, results: [], tranIds: [] };
  }

  const delayMs = options.delayMs ?? 200;
  const onProgress = options.onProgress || (() => {});

  const results = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < tranIds.length; i++) {
    const tranId = tranIds[i];
    const result = await deleteVatInvoiceByTranId(tranId, {
      headers: options.headers,
    });
    results.push(result);
    if (result.ok) {
      success++;
      console.log(`[CancelVatIpos] OK: ${tranId}`);
    } else {
      failed++;
      console.warn(
        `[CancelVatIpos] Lỗi ${tranId}:`,
        result.data?.message || result.error
      );
    }
    onProgress(i + 1, tranIds.length, tranId);
    if (i < tranIds.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { success, failed, results, tranIds };
}
