/* ===============================
   البيانات الأساسية
================================ */

let customers = [];
let products = [];
let sales = [];
let purchases = [];
let incomes = [];
let expenses = [];
let receipts = [];

let cash = {
  opening: 0,
  income: 0,
  expenses: 0,
};

/* ===============================
   LocalStorage
================================ */

function saveData() {
  localStorage.setItem("customers", JSON.stringify(customers));
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("sales", JSON.stringify(sales));
  localStorage.setItem("purchases", JSON.stringify(purchases));
  localStorage.setItem("incomes", JSON.stringify(incomes));
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("cash", JSON.stringify(cash));
  localStorage.setItem("receipts", JSON.stringify(receipts));
}

function loadData() {
  const c = localStorage.getItem("customers");
  const p = localStorage.getItem("products");
  const s = localStorage.getItem("sales");
  const pu = localStorage.getItem("purchases");
  const i = localStorage.getItem("incomes");
  const e = localStorage.getItem("expenses");
  const ca = localStorage.getItem("cash");
  const r = localStorage.getItem("receipts");

  customers = c ? JSON.parse(c) : [];
  products = p ? JSON.parse(p) : [];
  sales = s ? JSON.parse(s) : [];
  purchases = pu ? JSON.parse(pu) : [];
  incomes = i ? JSON.parse(i) : [];
  expenses = e ? JSON.parse(e) : [];
  receipts = r ? JSON.parse(r) : [];

  cash = ca ? JSON.parse(ca) : { opening: 0, income: 0, expenses: 0 };
}

/* ===============================
   أدوات مساعدة عامة
================================ */

function formatDate(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getCashFinal() {
  return (cash.opening || 0) + (cash.income || 0) - (cash.expenses || 0);
}
