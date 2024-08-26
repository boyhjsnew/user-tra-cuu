function formatTaxCode(taxCode) {
  // Kiểm tra độ dài chuỗi tax code
  if (taxCode.length > 10) {
    // Tách phần đầu 10 số và phần còn lại
    const part1 = taxCode.slice(0, 10);
    const part2 = taxCode.slice(10);
    // Ghép phần đầu và phần còn lại với dấu gạch ngang
    return `${part1}-${part2}`;
  }
  // Trả về chuỗi ban đầu nếu không cần định dạng lại
  return taxCode;
}
export default formatTaxCode;
