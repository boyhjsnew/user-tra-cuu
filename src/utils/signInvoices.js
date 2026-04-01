/**
 * Ký hóa đơn qua TokenCloud (Intrust CA).
 * POST /api/TokenCloud/SignInvoiceByIntrustCa
 * Thông tin chữ ký số gán cứng theo API đã cung cấp.
 */

const DEFAULT_AUTH =
  "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=";

/** Thông tin chữ ký số Intrust CA – gán cứng */
const SIGN_DEFAULTS = {
  user_name: "ICA.1702325579 ",
  credentialID: "RS-ICA.1702325579-1753153287961",
  pinCode: "123456",
  mode: 2,
  certificate:
    "MIIEvDCCA6SgAwIBAgIQZKvMJtz65/itP4kw/yzd0TANBgkqhkiG9w0BAQsFADBaMQswCQYDVQQGEwJWTjEUMBIGA1UECgwLSW50cnVzdCBKU0MxEjAQBgNVBAsMCUludHJ1c3RDQTEhMB8GA1UEAwwYSW50cnVzdENBIFJlbW90ZSBTaWduaW5nMB4XDTI1MDcyMjAzMDgyMVoXDTI3MDcyMjAzMDgyMVowgZYxCzAJBgNVBAYTAlZOMREwDwYDVQQIDAhBbiBHaWFuZzFUMFIGA1UEAwxLVFJVTkcgVMOCTSBOxq/hu5pDIFPhuqBDSCBWw4AgVuG7hiBTSU5IIE3DlEkgVFLGr+G7nE5HIE7DlE5HIFRIw5ROIEFOIEdJQU5HMR4wHAYKCZImiZPyLGQBAQwOTVNUOjE3MDIzMjU1NzkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCQRv8Uzu64irkB03fTJk0Nn8QZ+1gnlGjrrDJxSnSDW3+o+Ei4pX+Xx1EawZ1HqNCEwa0XdQJJxZQ9opKGzdI6AdYHMZPAd3fteexAR5jkRq+DNvx9NvMnPR9r8DbVwX9+n3ZXQV0dnlILiytARrqfIxFxMeAxiXAYouPXlOFps6a5MO4BdZ7fM4Q6n8GNF9OkazRq4Z00p+NfHqSb/ReDKnfftDrjtMcfFtmvjgBEBUwWUm1SQfXZcAWJfmKtOKgAxNhufM3oGFZL5YWOjdsPz0YFzJmzm4KesYH1B2HNd2Aqm6BfPpkpkd55IeeqQeHhprGIKPQDWHi3zv7KNBVPAgMBAAGjggE/MIIBOzAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFODI9YvOl57uP87N2140iyu93ixVMHgGCCsGAQUFBwEBBGwwajBCBggrBgEFBQcwAoY2aHR0cHM6Ly9pbnRydXN0Y2Eudm4vY2VydC9JbnRydXN0Q0FfUmVtb3RlX1NpZ25pbmcuY2VyMCQGCCsGAQUFBzABhhhodHRwOi8vb2NzcC5pbnRydXN0Y2Eudm4wJwYDVR0lBCAwHgYIKwYBBQUHAwIGCCsGAQUFBwMEBggrBgEFBQcDATA4BgNVHR8EMTAvMC2gK6AphidodHRwOi8vY3JsLmludHJ1c3RjYS52bi9JbnRydXN0Q0FSTS5jcmwwHQYDVR0OBBYEFLAzXZXpgkNWzH0DDDBMjsHxGeMgMA4GA1UdDwEB/wQEAwIF4DANBgkqhkiG9w0BAQsFAAOCAQEAOiZdha6KGlpMiKZkbdGLicxvqe5aXpLYx29zYjHKySAf/OJeU9jYp/zs7un9l4dAc8zdvVVhCIHfX408o9jrR8TM9WbSB7OBcPao/edv+0bOfR7W2x65DOP8UxxNgMjjZU/sHfa8L8A3Js7cw+3JoHuzDEpa1oKBtNLuKzgXpqW8gUXGSl9d0qOjiieEK+B4baC8PBPAodjAIyiqOK8GbyU2RKuVZtSdlxX9YvNodlxeg180HIdKFilAe6MgkPGVsWGNr8d6wPGu3tKgcZfw4VePU+BliHv87Sp/jctqPv+wCZZiE2/ESS4F/z0qXO+GyrHazm7noTlhwjEMeE4Upw==",
  auth_data:
    "pXCOonotTcm22CX+Wf877EAWL7fDzHbY9HM0v3HQLJcLmn+vICrY7bePHkp+tubDnxRXmyyle0vfKwH3RGG8Lv7BE2tNF5eVIBL/z3/b7imCgEb7qok5bEewjiGObHIiopWqvM4JZV/vCNE/fX9SSXfJR0q9qvJwFm6Dh44MZDd2TbVjplPDffcGCWdsZ4/jnYDoz4B6+y0YFnzgUSoNWniRURsqTNYFJL2Kj4MlHJfjfnGNWZdf7I0y4NvNKHjStXpABSeN9M/DR+HVdirwsK0Vfi1rj3uPkDKlkuAAJG5DGxsYLFbCxaf92e+6y39UdKaD7PvoafxVuJkHIeIkfT8rRKKuNgXRnPjPLHGJ0ug69egUUK1iRAva07g4YYSp4VGwxQGjE/xBvZkHdrs1dTLQwfHZNgVeXoEkClnhqUIdf9YpOfpxcQEyx/GWV+5KCzhD5VrzHT9HqgyvDGKANc22XGJUwl8LfV5FIGM8G7HvYu9HMgVu5nD1HjBF6MsYDePuhqWxi1QWSBOGlL94VB4ITYMg0WMyvdOmVKYib1GJGeM7ghjd/tanDXX9Z6swkqF3ClrL3TW+ezY4a1BDtR12PULbyoUcPyFVm/gffjzZ951+gb11RVJEvxDgxsTxbal5jJfsMlKnfUi4CPtz/DHxZm7i4Nk1Ipv/4V7x5npmcAqQiUkc3M5m1km6VjzR5sTSvjtEsvucY+mU26XeNNGVGWnaPKTg6qGi2jfB76bvpYRFeRlTp+nnbyTWyrk7BaH+nwMOA5km9ftL8DrtotIWhSmHi5l/R9uA/Gn1NiTQuYV0sWIvHR3Zkrrahbw8lwHWyn/4KDzg+qLdQJn3zlwbfvx0llUZoxO/n4g879wqH96Qd5gMgjggFBYVJW/Yj5vRijM94FkbDlG69HCskUBeyjz9HnX9xKOEfYZLb78j1DsvOa4XNUBLgDVi9B7wjr9KBROF8Zk76uvPVe1hLyS+1pxzme2CKQDnyGHndWR56c4dW0STu25kGZuEmbYkYa2uUKB5oPL+Z6zRYlEFnllmB5lt7wJc4G6sfY8M+VEVlAetz6hiFFye7U4tN5ui0l2kGIezUhygsc7qOX4+UorpshCFsN8bTV5qbvOxiwU0ha5nvH6PEonvSqtk2UvI1jut1O+Qsd6PHRhHfJAQisGx0tXFBltT4GMdlZ9amqqEmCzazA7wVA2FGaxI1P4XW840bKwL98tYZCv4/u1PLc+M9hbfWFa5WaiNfXjiKqefEfZHwueDoW4ATUQ8+dgx73h6H9rwX5K5PdlGsfq6B4ntawap+mcsqh+0hMBgOnn7zDYmjjUT+e2PbfvYSK71pNCF93spU9ZxlBc+dTngNs5PJCh8H748HKddkVNZ7JQaoR4bhbMShEWWHzwOonFZ4NGIiUouH7PpSPLijb1UlzQnowLF85bgNPDJKyhgksjx3h51M2rklEZr0BqILMV3beSdYjVKYxH4CGJBKYp9A+FWDx9+fVOyUewOPhQevF43wwheULHwcf+d2A/2VRR+Tl/1NHjI6KNcBSkvl/5xrccs8n5hqroJE4Fd5TrVr+0=",
};

async function signInvoices(taxCode, params, authToken = DEFAULT_AUTH) {
  const TX = (taxCode || "").replace(/[-\s]/g, "");
  const url = `https://${TX}.minvoice.com.vn/api/TokenCloud/SignInvoiceByIntrustCa`;

  const { hoadonIds = [], mode = 2 } = params || {};
  const opts = { ...SIGN_DEFAULTS, ...params, mode: Number(mode) };

  if (!hoadonIds.length) {
    return { success: false, data: null, error: "Danh sách hoadon68_id trống." };
  }

  const body = {
    user_name: opts.user_name ?? SIGN_DEFAULTS.user_name,
    credentialID: opts.credentialID ?? SIGN_DEFAULTS.credentialID,
    certificate: opts.certificate ?? SIGN_DEFAULTS.certificate,
    pinCode: opts.pinCode ?? SIGN_DEFAULTS.pinCode,
    auth_data: opts.auth_data ?? SIGN_DEFAULTS.auth_data,
    mode: opts.mode,
    hoadon: hoadonIds,
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        data,
        error: data?.message || data?.error || `HTTP ${response.status}`,
      };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error("signInvoices error:", error);
    let msg = error.message;
    if (msg === "Failed to fetch" || error?.name === "TypeError") {
      msg = "Failed to fetch (CORS hoặc mạng). Kiểm tra proxy / kết nối.";
    }
    return {
      success: false,
      data: null,
      error: msg,
    };
  }
}

export default signInvoices;
