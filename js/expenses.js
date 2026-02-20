// ==================== المتغيرات ====================
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCustomer = document.getElementById("expenseCustomer");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expenseTableBody = document.querySelector("#expenseTable tbody");

// ==================== قائمة حسابات المصروفات ====================
function renderExpenseCustomerSelect() {
  if (!expenseCustomer) return;

  // إظهار الحسابات التي نوعها "expense" فقط
  const expenseCustomers = customers.filter((c) => c.type === "expense");

  const opts =
    `<option value="" disabled selected>اختر حساب المصروف</option>` +
    expenseCustomers
      .map((c, i) => `<option value="${i}">${c.name}</option>`)
      .join("");

  expenseCustomer.innerHTML = opts;
}

// ==================== إضافة المصروف ====================
function addExpense() {
  const title = expenseTitle.value.trim();
  const amount = +expenseAmount.value;
  const customerIndex = expenseCustomer.value;
  const expenseCustomers = customers.filter((c) => c.type === "expense");
  const customer = customerIndex >= 0 ? expenseCustomers[customerIndex] : null;

  if (!title || !amount) {
    showModal("من فضلك أكمل جميع البيانات");
    return;
  }

  if (customer) customer.balance += amount;
  cash.expenses += amount;

  if (!customer) {
    showModal("من فضلك اختر الحساب أولاً"); // مودال تنبيه
    return;
  }

  expenses.push({
    customer: customer.name,
    amount,
    title,
    date: new Date().toISOString().slice(0, 10),
    order: Date.now(),
  });

  // إعادة تعيين الحقول
  expenseCustomer.value = "";
  expenseAmount.value = "";
  expenseTitle.value = "";

  // حفظ البيانات وتحديث العرض
  saveData();
  updateBottomCashBalance();
  renderExpenses();
  renderExpenseCustomerSelect();
  showSuccessModal("✅ تم حفظ المصروف بنجاح");
}

function showSuccessModal(message = "تمت العملية بنجاح") {
  const modal = document.getElementById("successModal");
  const msg = document.getElementById("successMessage");
  msg.textContent = message;
  modal.style.display = "flex";

  // اختفاء المودال تلقائيًا بعد 2 ثانية
  setTimeout(() => {
    modal.style.display = "none";
  }, 2000);
}

// دوال المودال
function showModal(message) {
  const modal = document.getElementById("appModal");
  document.getElementById("modalMessage").textContent = message;
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("appModal");
  modal.style.display = "none";
}

// زر "حسناً" يغلق المودال
document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);

// ==================== عرض سجل المصروفات ====================
function renderExpenses() {
  if (!expenseTableBody) return;
  expenseTableBody.innerHTML = "";

  const filterFrom = document.getElementById("filterDateFrom")?.value;
  const filterTo = document.getElementById("filterDateTo")?.value;
  const filterCustomer = document.getElementById("filterCustomer")?.value;

  let filteredExpenses = expenses;

  if (filterFrom)
    filteredExpenses = filteredExpenses.filter((e) => e.date >= filterFrom);
  if (filterTo)
    filteredExpenses = filteredExpenses.filter((e) => e.date <= filterTo);
  if (filterCustomer)
    filteredExpenses = filteredExpenses.filter(
      (e) => e.customer === filterCustomer,
    );

  filteredExpenses.sort((a, b) => (a.order || 0) - (b.order || 0));

  let total = 0;

  filteredExpenses.forEach((e, index) => {
    total += e.amount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${e.customer}</td>
      <td>${e.amount.toFixed(2)}</td>
      <td>${e.title}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editExpense(${index})">✏ تعديل</button>
        <button class="action-btn delete-btn" onclick="deleteExpense(${index})">🗑 حذف</button>
      </td>
    `;
    expenseTableBody.appendChild(tr);
  });

  if (filteredExpenses.length > 0) {
    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");
    totalRow.innerHTML = `
      <td colspan="2"><strong>الإجمالي</strong></td>
      <td><strong>${total.toFixed(2)}</strong></td>
      <td colspan="2"></td>
    `;
    expenseTableBody.appendChild(totalRow);
  }
}

function renderExpenseFilterCustomers() {
  const filterCustomer = document.getElementById("filterCustomer");
  if (!filterCustomer) return;

  const expenseCustomers = customers.filter((c) => c.type === "expense");

  filterCustomer.innerHTML =
    `<option value="">كل الحسابات</option>` +
    expenseCustomers
      .map((c) => `<option value="${c.name}">${c.name}</option>`)
      .join("");
}

// ==================== مودال إدخال بند آخر ====================
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
    const val = otherExpenseInput.value.trim();
    if (!val) return;

    const opt = document.createElement("option");
    opt.text = val;
    opt.value = val;
    expenseSelect.add(opt);

    expenseSelect.value = val;
    expenseModal.style.display = "none";
  };

  // إغلاق المودال بدون حفظ
  closeExpenseModalBtn.onclick = function () {
    expenseModal.style.display = "none";
    expenseSelect.value = "";
  };
});

let currentEditIndex = null;

function editExpense(index) {
  currentEditIndex = index;
  const exp = expenses[index];

  document.getElementById("editExpenseTitle").value = exp.title;
  document.getElementById("editExpenseAmount").value = exp.amount;

  // فتح المودال
  document.getElementById("editExpenseModal").style.display = "flex";
}

function closeEditExpenseModal() {
  document.getElementById("editExpenseModal").style.display = "none";
  currentEditIndex = null;
}

function saveEditedExpense() {
  const title = document.getElementById("editExpenseTitle").value.trim();
  const amount = +document.getElementById("editExpenseAmount").value;

  if (!title || !amount) {
    alert("اكمل البيانات");
    return;
  }

  const oldExpense = expenses[currentEditIndex];

  // تعديل الخزنة
  cash.expenses -= oldExpense.amount;
  cash.expenses += amount;

  const customer = customers.find((c) => c.name === oldExpense.customer);
  if (customer) {
    customer.balance -= oldExpense.amount;
    customer.balance += amount;
  }

  // تحديث البيانات
  expenses[currentEditIndex].title = title;
  expenses[currentEditIndex].amount = amount;

  saveData();
  renderExpenses();

  if (typeof renderCash === "function") {
    renderCash();
  }

  if (typeof updateBottomCashBalance === "function") {
    updateBottomCashBalance();
  }

  // اقفل المودال مباشرة
  closeEditExpenseModal();
}

let deleteIndex = null; // لتخزين المؤشر الحالي

function deleteExpense(index) {
  deleteIndex = index;
  const modal = document.getElementById("deleteConfirmModal");
  modal.style.display = "flex";
}

// زر تأكيد الحذف
document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (deleteIndex === null) return;

  const exp = expenses[deleteIndex];

  // تعديل الرصيد
  cash.expenses -= exp.amount;

  const customer = customers.find((c) => c.name === exp.customer);
  if (customer) customer.balance -= exp.amount;

  expenses.splice(deleteIndex, 1);

  saveData();
  renderExpenses();
  if (typeof updateBottomCashBalance === "function") updateBottomCashBalance();

  // اغلاق المودال
  document.getElementById("deleteConfirmModal").style.display = "none";
  deleteIndex = null;
});

// زر الإلغاء
document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  document.getElementById("deleteConfirmModal").style.display = "none";
  deleteIndex = null;
});

document
  .getElementById("filterDateFrom")
  ?.addEventListener("change", renderExpenses);
document
  .getElementById("filterDateTo")
  ?.addEventListener("change", renderExpenses);
document
  .getElementById("filterCustomer")
  ?.addEventListener("change", renderExpenses);

document.getElementById("clearFilters")?.addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("filterDateFrom").value = today;
  document.getElementById("filterDateTo").value = today;
  document.getElementById("filterCustomer").value = "";
  renderExpenses();
});

// ==================== أحداث صفحة ====================
addExpenseBtn.addEventListener("click", addExpense);

window.onload = function () {
  loadData();
  renderExpenseCustomerSelect();
  renderExpenses();
};

window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().slice(0, 10);

  // التاريخ الافتراضي من وإلى اليوم
  const filterFrom = document.getElementById("filterDateFrom");
  const filterTo = document.getElementById("filterDateTo");
  if (filterFrom) filterFrom.value = today;
  if (filterTo) filterTo.value = today;

  // تعبئة قائمة الحسابات في فلتر المصروف
  renderExpenseFilterCustomers();

  // عرض مصروفات اليوم افتراضياً
  renderExpenses();
});
