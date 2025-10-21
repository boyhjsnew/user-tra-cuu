function formatDate_DC(dateString) {
  const [day, month, year] = dateString.split("/"); // Tách chuỗi thành các phần tử ngày, tháng, năm
  return `${year}-${month}-${day}`; // Sắp xếp lại theo định dạng YYYY/MM/DD
}

export default formatDate_DC;
