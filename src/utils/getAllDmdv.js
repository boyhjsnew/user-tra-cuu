async function GetALLDmdv(taxCode) {
  let sanitizedTaxCode = taxCode.replace(/-/g, "");
  const url = `https://${sanitizedTaxCode}.minvoice.com.vn/api/System/GetAllDmDvcs`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
    });

    const result = await response.json();
    console.log("API response:", result); // Log kết quả API để kiểm tra

    return { data: result };
  } catch (error) {
    console.error("Error:", error.message);
    return { error: error.message };
  }
}

export default GetALLDmdv;
