window.onload = function () {
  loadData();

  // كل render مش موجودة في الصفحة هتتجاهل
  if (typeof renderProducts === "function") renderProducts();
  if (typeof renderCustomers === "function") renderCustomers();
  if (typeof renderSales === "function") renderSales();
  if (typeof renderPurchases === "function") renderPurchases();
  if (typeof renderIncome === "function") renderIncome();
  if (typeof renderExpense === "function") renderExpense();
  if (typeof renderCash === "function") renderCash();
};

