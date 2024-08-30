async function CreateUser(taxCode, userInfo) {
  let sanitizedTaxCode = taxCode.replace(/-/g, "");
  const url = `https://${sanitizedTaxCode}.minvoice.com.vn/api/Invoice/CreateUser_tracuu `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bear " + "O87316arj5+Od3Fqyy5hzdBfIuPk73eKqpAzBSvv8sY=",
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return { data };
  } catch (error) {
    console.error("Error:", error);
    return { data: null };
  }
}

export default CreateUser;
