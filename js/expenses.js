const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCustomer = document.getElementById("expenseCustomer");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expenseTableBody = document.querySelector("#expenseTable tbody");

function renderExpenseCustomerSelect() {
  const opts =
    `<option value="" disabled selected>إختر الحساب</option>` +
    `<option value="">نقدي بدون عميل</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
  expenseCustomer.innerHTML = opts;
}

function addExpense() {
  const title = expenseTitle.value.trim();
  const amount = +expenseAmount.value;
  const customerIndex = expenseCustomer.value;
  const customer = customerIndex !== "" ? customers[customerIndex] : null;

  if (!title || !amount) {
    showModal("من فضلك أكمل جميع البيانات");
    return;
  }

  if (customer) customer.balance += amount;
  cash.expenses += amount;

  expenses.push({
    customer: customer ? customer.name : "نقدي",
    amount,
    title,
    date: new Date().toISOString().slice(0, 10),
    order: Date.now(),
  });

  expenseCustomer.value = "";
  expenseAmount.value = "";
  expenseTitle.value = "";

  saveData();
  updateBottomCashBalance();
  renderExpenses();
  renderCash();
  renderExpenseCustomerSelect();
}

function renderExpenses() {
  expenseTableBody.innerHTML = "";

  expenses.sort((a, b) => (a.order || 0) - (b.order || 0));

  expenses.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.date}</td><td>${e.customer}</td><td>${e.amount.toFixed(2)}</td><td>${e.title}</td>`;
    expenseTableBody.appendChild(tr);
  });
}

addExpenseBtn.addEventListener("click", addExpense);

window.onload = function () {
  loadData();
  renderExpenseCustomerSelect();
  renderExpenses();
  renderCash();
};

function showModal(message, title = "تنبيه") {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerText = message;
  document.getElementById("appModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const expenseSelect = document.getElementById("expenseTitle");
  const expenseModal = document.getElementById("expenseModal");
  const otherExpenseInput = document.getElementById("otherExpenseInput");
  const saveExpenseBtn = document.getElementById("saveExpenseBtn");
  const closeExpenseModalBtn = document.getElementById("closeExpenseModalBtn");

  if (!expenseSelect) return;

  // فتح المودال عند اختيار "أخرى"
  expenseSelect.addEventListener("change", function () {
    if (this.value === "other") {
      expenseModal.style.display = "flex";
      otherExpenseInput.value = "";
      otherExpenseInput.focus();
    }
  });

  // حفظ البيان الجديد
  saveExpenseBtn.onclick = function () {
    let val = otherExpenseInput.value.trim();
    if (!val) return;

    // إضافة البيان للقائمة
    const opt = document.createElement("option");
    opt.text = val;
    opt.value = val;
    expenseSelect.add(opt);

    // تحديده
    expenseSelect.value = val;

    // إغلاق المودال
    expenseModal.style.display = "none";
  };

  // إغلاق المودال بدون حفظ
  closeExpenseModalBtn.onclick = function () {
    expenseModal.style.display = "none";
    expenseSelect.value = "";
  };
});
