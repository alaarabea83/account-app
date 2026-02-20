// ======================= تحميل وحفظ =====================
function loadData() {
const c = localStorage.getItem("customers");
const r = localStorage.getItem("receipts");
const ce = localStorage.getItem("cashEntries");
const ca = localStorage.getItem("cash");
customers = c ? JSON.parse(c) : [];
receipts = r ? JSON.parse(r) : [];
cashEntries = ce ? JSON.parse(ce) : [];
cash = ca ? JSON.parse(ca) : { opening: 0, income: 0, expenses: 0 };
}

// ======================= رصيد العميل الحالي =====================
function getCustomerCurrentBalance(customerName) {
let c = customers.find((c) => c.name === customerName);
if (!c) return 0;

let balance = c.openingBalance || 0;

sales
.filter((s) => s.customer === customerName)
.forEach((s) => (balance += s.total - s.paid));

purchases
.filter((p) => p.customer === customerName)
.forEach((p) => (balance += p.paid - p.total));

incomes
.filter((i) => i.customer === customerName)
.forEach((i) => (balance -= i.amount));

expenses
.filter((e) => e.customer === customerName)
.forEach((e) => (balance += e.amount));

receipts
.filter((r) => r.customer === customerName)
.forEach((r) => (balance -= r.amount));

return balance;
}

function saveData() {
localStorage.setItem("receipts", JSON.stringify(receipts));
localStorage.setItem("cashEntries", JSON.stringify(cashEntries));
localStorage.setItem("cash", JSON.stringify(cash));
}

// ======================= العملاء =====================
function renderCustomerSelect() {
const sel = document.getElementById("receiptCustomer");
const filterSel = document.getElementById("filterCustomer");

// فلترة العملاء: استبعاد الإيرادات والمصروفات
const validCustomers = customers.filter(
(c) => c.type !== "income" && c.type !== "expense",
);

// إعداد الـ select
sel.innerHTML =
`<option value="" disabled selected>اختر الحساب</option>` +
`<option value="-1">نقدي بدون عميل</option>` +
validCustomers
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join("");

filterSel.innerHTML =
`<option value="">الكل</option>` +
validCustomers
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join("");
}

// ======================= إضافة المقبوض =====================
function addReceipt() {
const title = document.getElementById("receiptTitle").value;
const amount = +document.getElementById("receiptAmount").value;
const idx = +document.getElementById("receiptCustomer").value;

if (!title || !amount) {
alert("أكمل البيانات");
return;
}

let customer = null;

if (idx >= 0) {
customer = customers[idx];
}

const date = new Date().toISOString().slice(0, 10);

// ✅ 1- خصم من رصيد العميل
let prevBalance = 0;
let remaining = 0;

if (customer) {
prevBalance = customer.balance || 0;
remaining = prevBalance - amount;
customer.balance = remaining;
}

// ✅ 2- إضافة للخزنة
cash.income = (cash.income || 0) + amount;

// ✅ 3- تسجيل المقبوض
const receipt = {
date,
customer: customer ? customer.name : "نقدي",
amount,
title,
prevBalance,
remaining,
order: Date.now(),
};

receipts.push(receipt);

// 🔥 تسجيل حركة في الخزنة
cashEntries.push({
date,
desc: title,
customer: receipt.customer,
debit: amount,
credit: 0,
order: receipt.order,
});

saveData();

renderReceipt();
renderCashStatement();

alert("تمت الإضافة بنجاح");
}

// ======================= عرض المقبوضات =====================
function renderReceipt(filterFn = null) {
const tbody = document.querySelector("#receiptTable tbody");
tbody.innerHTML = "";
let total = 0;
receipts
.filter((r) => (filterFn ? r && filterFn(r) : true))
.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.date}</td><td>${r.customer}</td><td>${r.prevBalance}</td><td>${r.amount}</td><td>${r.remaining}</td><td>${r.title}</td>`;
    tbody.appendChild(tr);
    total += r.amount;
});
document.getElementById("receiptTotal").innerText = total.toFixed(2);
}

// ======================= مودال أخرى =====================
const titleSelect = document.getElementById("receiptTitle");
const modal = document.getElementById("titleModal");
const saveBtn = document.getElementById("saveTitleBtn");
const closeBtn = document.getElementById("closeModalBtn");
const otherInput = document.getElementById("otherTitleInput");

titleSelect.addEventListener("change", function () {
if (this.value === "أخرى") {
modal.style.display = "flex";
otherInput.value = "";
otherInput.focus();
}
});
saveBtn.onclick = function () {
let val = otherInput.value.trim();
if (!val) return;
let opt = document.createElement("option");
opt.text = val;
opt.value = val;
titleSelect.add(opt);
titleSelect.value = val;
modal.style.display = "none";
};
closeBtn.onclick = function () {
modal.style.display = "none";
titleSelect.value = "";
};

// ======================= الرصيد السابق والمتبقي =====================
// عند اختيار العميل
document
.getElementById("receiptCustomer")
.addEventListener("change", function () {
const customerName = this.value;
const customer = customers.find((c) => c.name === customerName);
const prev = customer ? getCustomerCurrentBalance(customer.name) : 0;

document.getElementById("prevBalance").value = prev.toFixed(2);

const amount = +document.getElementById("receiptAmount").value || 0;
document.getElementById("remainingBalance").value = (prev - amount).toFixed(
    2,
);
});

document.getElementById("receiptAmount").addEventListener("input", function () {
const customerName = document.getElementById("receiptCustomer").value;
const customer = customers.find((c) => c.name === customerName);
const prev = customer ? getCustomerCurrentBalance(customer.name) : 0;

document.getElementById("remainingBalance").value = (
prev - (+this.value || 0)
).toFixed(2);
});

// عند إدخال المبلغ
document.getElementById("receiptAmount").addEventListener("input", function () {
const customerName = document.getElementById("receiptCustomer").value;
const customer = customers.find((c) => c.name === customerName);

const prev = customer ? getCustomerCurrentBalance(customer.name) : 0;

document.getElementById("remainingBalance").value = (
prev - (+this.value || 0)
).toFixed(2);
});

// عند إدخال المبلغ
document.getElementById("receiptAmount").addEventListener("input", function () {
const idx = parseInt(document.getElementById("receiptCustomer").value);
const customer = idx >= 0 ? customers[idx] : null;

const prev = customer ? getCustomerCurrentBalance(customer.name) : 0;

document.getElementById("remainingBalance").value = (
prev - (+this.value || 0)
).toFixed(2);
});

// ======================= فلترة الجدول =====================
document.getElementById("filterBtn").addEventListener("click", function () {
const from = document.getElementById("fromDate").value;
const to = document.getElementById("toDate").value;
const cust = document.getElementById("filterCustomer").value;
renderReceipt((r) => {
if (from && r.date < from) return false;
if (to && r.date > to) return false;
if (cust && r.customer !== cust) return false;
return true;
});
});

// ======================= كشف الخزنة =====================
function renderCashStatement() {
const tbody = document.querySelector("#cashStatementTable tbody");
if (!tbody) return;
tbody.innerHTML = "";
let cumulative = cash.opening || 0;
cashEntries.sort(
(a, b) =>
    new Date(a.date) - new Date(b.date) || (a.order || 0) - (b.order || 0),
);
cashEntries.forEach((e) => {
cumulative += (e.debit || 0) - (e.credit || 0);
const tr = document.createElement("tr");
tr.innerHTML = `<td>${e.date}</td><td>${e.customer}</td><td>${e.desc}</td><td>${(e.debit || 0).toFixed(2)}</td><td>${(e.credit || 0).toFixed(2)}</td><td>${cumulative.toFixed(2)}</td>`;
tbody.appendChild(tr);
});
}

// ======================= تحميل الصفحة =====================
window.onload = function () {
loadData();
renderCustomerSelect();
renderReceipt();

document.getElementById("addReceiptBtn").onclick = addReceipt;

const today = new Date().toISOString().split("T")[0];
document.getElementById("fromDate").value = today;
document.getElementById("toDate").value = today;
};
