let editingIndex = null;

window.onload = function () {
  loadData();
  renderIncomeCustomerSelect();
  renderFilterCustomerSelect();
  renderIncome(); // الافتراضي: عرض عمليات اليوم

  document.getElementById("addIncomeBtn").onclick = addIncome;

  // تعيين التاريخ الافتراضي للفلاتر
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fromDate").value = today;
  document.getElementById("toDate").value = today;

  // عرض العمليات حسب التاريخ الافتراضي
  renderIncome();
};

// ==================== قائمة حسابات الإيراد ====================
function renderIncomeCustomerSelect() {
  const sel = document.getElementById("incomeCustomer");
  if (!sel) return;

  // حسابات الإيراد فقط
  const incomeCustomers = customers.filter((c) => c.type === "income");

  sel.innerHTML =
    `<option value="" selected disabled>اختر حساب الإيراد</option>` +
    incomeCustomers
      .map((c, i) => `<option value="${i}">${c.name}</option>`)
      .join("");
}

// ==================== قائمة فلتر الحسابات ====================
function renderFilterCustomerSelect() {
  const sel = document.getElementById("filterCustomer");
  if (!sel) return;

  const incomeCustomers = customers.filter((c) => c.type === "income");

  sel.innerHTML =
    `<option value="">اختر الحساب للفلترة</option>` +
    incomeCustomers
      .map((c) => `<option value="${c.name}">${c.name}</option>`)
      .join("");
}

// ==================== App Modal ====================
function showModal(message, type = "warning") {
  const modal = document.getElementById("appModal");
  const title = document.getElementById("modalTitle");
  const text = document.getElementById("modalMessage");

  if (!modal) return; // أمان لو المودال مش موجود

  text.innerText = message;

  if (type === "success") {
    title.innerText = "نجاح";
    title.style.color = "#28a745";
  } else if (type === "error") {
    title.innerText = "خطأ";
    title.style.color = "#dc3545";
  } else {
    title.innerText = "تنبيه";
    title.style.color = "#ffc107";
  }

  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("appModal");
  if (modal) modal.style.display = "none";
}

// ==================== إضافة الإيراد ====================
function addIncome() {
  const title = document.getElementById("incomeTitle").value.trim();
  const amount = +document.getElementById("incomeAmount").value;
  const customerIndex = document.getElementById("incomeCustomer").value;

  const incomeCustomers = customers.filter((c) => c.type === "income");
  const customer = customerIndex >= 0 ? incomeCustomers[customerIndex] : null;

  if (!title || !amount) {
    showModal("من فضلك أكمل جميع البيانات", "warning");
    return;
  }

  if (customer) customer.balance -= amount;
  cash.income += amount;

  incomes.push({
    date: new Date().toISOString().slice(0, 10),
    customer: customer ? customer.name : "نقدي",
    amount,
    title,
    order: Date.now(),
  });

  document.getElementById("incomeTitle").value = "";
  document.getElementById("incomeAmount").value = "";
  document.getElementById("incomeCustomer").value = "";

  saveData();
  updateBottomCashBalance();
  renderIncome();
  showModal("تمت إضافة الإيراد بنجاح ✔", "success");
}

// ==================== عرض الإيرادات مع الفلترة ====================
function renderIncome() {
  const tbody = document.querySelector("#incomeTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const filterCustomer = document.getElementById("filterCustomer")?.value || "";

  const filtered = incomes.filter((i) => {
    if (from && i.date < from) return false;
    if (to && i.date > to) return false;
    if (filterCustomer && i.customer !== filterCustomer) return false;
    return true;
  });

  filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

  let total = 0;

  filtered.forEach((i) => {
    const index = incomes.indexOf(i);

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${i.date}</td>
    <td>${i.customer}</td>
    <td>${i.amount}</td>
    <td>${i.title}</td>
    <td>
  <button class="action-btn edit-btn" onclick="editIncome(${index})">✏️ تعديل</button>
  <button class="action-btn delete-btn" onclick="deleteIncome(${index})">🗑️ حذف</button>
</td>
  `;
    tbody.appendChild(tr);
    total += i.amount;
  });

  const totalCell = document.getElementById("incomeTotal");
  if (totalCell) totalCell.textContent = total.toFixed(2);
}

function editIncome(index) {
  const item = incomes[index];

  editingIndex = index;

  document.getElementById("editAmount").value = item.amount;
  document.getElementById("editTitle").value = item.title;

  document.getElementById("editIncomeModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editIncomeModal").style.display = "none";
}

function saveIncomeEdit() {
  const newAmount = +document.getElementById("editAmount").value;
  const newTitle = document.getElementById("editTitle").value.trim();

  if (!newAmount || !newTitle) return;

  const oldItem = incomes[editingIndex];

  // تعديل الرصيد
  const customer = customers.find((c) => c.name === oldItem.customer);
  if (customer) {
    customer.balance += oldItem.amount; // رجع القديم
    customer.balance -= newAmount; // اخصم الجديد
  }

  cash.income -= oldItem.amount;
  cash.income += newAmount;

  incomes[editingIndex].amount = newAmount;
  incomes[editingIndex].title = newTitle;

  saveData();
  updateBottomCashBalance();
  closeEditModal();
  renderIncome();
}

// ====================   دالة الحذف ====================
let deleteIncomeIndex = null;

function deleteIncome(index) {
  deleteIncomeIndex = index;
  const modal = document.getElementById("deleteIncomeModal");
  modal.style.display = "flex";
}

// زر تأكيد الحذف
document
  .getElementById("confirmDeleteIncomeBtn")
  .addEventListener("click", () => {
    if (deleteIncomeIndex === null) return;

    const item = incomes[deleteIncomeIndex];

    // تعديل الرصيد
    const customer = customers.find((c) => c.name === item.customer);
    if (customer) customer.balance += item.amount;

    cash.income -= item.amount;

    // حذف الإيراد
    incomes.splice(deleteIncomeIndex, 1);

    saveData();
    updateBottomCashBalance();
    renderIncome();

    document.getElementById("deleteIncomeModal").style.display = "none";
    deleteIncomeIndex = null;
  });

// زر الإلغاء
document
  .getElementById("cancelDeleteIncomeBtn")
  .addEventListener("click", () => {
    document.getElementById("deleteIncomeModal").style.display = "none";
    deleteIncomeIndex = null;
  });

// ==================== فلترة عند تغيير التاريخ تلقائيًا ====================
document.getElementById("fromDate")?.addEventListener("change", renderIncome);
document.getElementById("toDate")?.addEventListener("change", renderIncome);
document
  .getElementById("filterCustomer")
  ?.addEventListener("change", renderIncome);

// ==================== مودال بند أخرى ====================
document.addEventListener("DOMContentLoaded", function () {
  const titleSelect = document.getElementById("incomeTitle");
  const modal = document.getElementById("titleModal");
  const saveBtn = document.getElementById("saveTitleBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const otherInput = document.getElementById("otherTitleInput");

  if (!titleSelect) return;

  titleSelect.addEventListener("change", function () {
    if (this.value === "other") {
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
});
