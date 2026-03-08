// ===================== دوال مساعدة =====================

// ترجمة نوع الحساب
function getTypeName(type) {
  switch (type) {
    case "customer": return "عميل";
    case "supplier": return "مورد";
    case "income": return "إيراد";
    case "expense": return "مصروف";
    default: return "-";
  }
}

// ===== دالة لحساب الرصيد الفعلي للعميل =====
function calculateCustomerBalance(customerName) {
  const customer = customers.find(c => c.name === customerName);
  if (!customer) return 0;

  let balance = customer.openingBalance || 0;

  // المبيعات
  sales.filter(s => s.customer === customerName)
       .forEach(s => balance += (s.total || 0) - (s.paid || 0));

  // المشتريات
  purchases.filter(p => p.customer === customerName)
           .forEach(p => balance += (p.paid || 0) - (p.total || 0));

  // المصروفات
  expenses.filter(e => e.customer === customerName)
          .forEach(e => balance += (e.amount || 0));

  // المقبوضات
  receipts.filter(r => r.customer === customerName)
          .forEach(r => balance -= (r.amount || 0));

  return balance;
}

// ===================== متغيرات =====================
let editIndex = null;
let deleteIndex = null;

// ===================== عند تحميل الصفحة =====================
window.onload = function () {
  loadData();
  renderCustomers();
  document.getElementById("addCustomerBtn").onclick = addCustomerHandler;
};

// ===================== مودال تنبيه =====================
function showModal(message, title = "تنبيه") {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerText = message;
  document.getElementById("appModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
}

// ===================== إضافة حساب جديد =====================
function addCustomerHandler() {
  const name = document.getElementById("customerName").value.trim();
  const openingBalance = +document.getElementById("openingBalance").value || 0;
  const type = document.getElementById("accountType").value;

  if (!name && !type) {
    showModal("من فضلك أدخل اسم الحساب واختر نوع الحساب");
    return;
  }
  if (!name) { showModal("من فضلك أدخل اسم الحساب"); return; }
  if (!type) { showModal("من فضلك اختر نوع الحساب"); return; }

  customers.push({
    name,
    openingBalance,
    type
  });

  document.getElementById("customerName").value = "";
  document.getElementById("openingBalance").value = "";
  document.getElementById("accountType").value = "";

  saveData();
  renderCustomers();
  showModal("تم إضافة الحساب بنجاح ✅", "نجاح");
}

// ===================== عرض الحسابات =====================
function renderCustomers(searchQuery = "", filterType = null) {
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";

  let totalDebit = 0;
  let totalCredit = 0;
  let visibleCount = 0;

  customers.forEach((c, index) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
    if (filterType && c.type !== filterType) return;

    visibleCount++;

    let currentBalance = calculateCustomerBalance(c.name);

    if (currentBalance > 0) totalDebit += currentBalance;
    else totalCredit += Math.abs(currentBalance);

    const debit = currentBalance > 0 ? currentBalance.toFixed(2) : "0.00";
    const credit = currentBalance < 0 ? Math.abs(currentBalance).toFixed(2) : "0.00";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${c.name}</td>
      <td>${getTypeName(c.type)}</td>
      <td class="debit">${debit}</td>
      <td class="credit">${credit}</td>
      <td class="actions">
        <button class="action-btn edit" onclick="openEditModal(${index})">تعديل</button>
        <button class="action-btn delete" onclick="deleteCustomer(${index})">حذف</button>
        <button class="action-btn view" onclick="openStatementModal(${index})">كشف حساب</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  if (visibleCount === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="6" style="text-align:center; padding:20px; color:#fff;">لا توجد بيانات للعرض</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  // صف الإجمالي
  const totalRow = document.createElement("tr");
  totalRow.classList.add("table-total-row");
  totalRow.innerHTML = `
    <td></td>
    <td colspan="2">إجمالي الأرصدة</td>
    <td>${totalDebit.toFixed(2)}</td>
    <td>${totalCredit.toFixed(2)}</td>
    <td></td>
  `;
  tbody.appendChild(totalRow);
}

// ===================== البحث والتصفية =====================
document.getElementById("searchCustomer").addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();
  const type = document.getElementById("filterType").value;
  renderCustomers(query, type);
});

document.getElementById("filterType").addEventListener("change", function () {
  const query = document.getElementById("searchCustomer").value.trim().toLowerCase();
  const type = this.value;
  renderCustomers(query, type);
});

// ===================== تعديل الحساب =====================
function openEditModal(index) {
  editIndex = index;
  const customer = customers[index];

  document.getElementById("editCustomerName").value = customer.name;
  document.getElementById("editOpeningBalance").value = customer.openingBalance;
  document.getElementById("editAccountType").value = customer.type;

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editIndex = null;
}

function saveCustomerEdit() {
  if (editIndex === null) return;

  const customer = customers[editIndex];

  const newName = document.getElementById("editCustomerName").value.trim();
  const newOpening = +document.getElementById("editOpeningBalance").value;
  const newType = document.getElementById("editAccountType").value;

  if (!newName || isNaN(newOpening)) {
    showModal("من فضلك أدخل بيانات صحيحة");
    return;
  }

  customer.name = newName;
  customer.openingBalance = newOpening;
  customer.type = newType;

  saveData();
  renderCustomers();
  closeEditModal();
  showModal("تم تعديل بيانات الحساب ✨", "نجاح");
}

// ===================== حذف الحساب =====================
function deleteCustomer(index) {
  deleteIndex = index;
  document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
  deleteIndex = null;
}

function confirmDelete() {
  if (deleteIndex === null) return;

  customers.splice(deleteIndex, 1);
  saveData();
  renderCustomers();

  closeDeleteModal();
  showModal("تم حذف الحساب 🗑️", "نجاح");
}

// ===================== كشف حساب =====================
function openStatementModal(index) {
  const customer = customers[index];
  document.getElementById("statementCustomerName").innerText =
    "إسم الحساب: " + customer.name + " (" + getTypeName(customer.type) + ")";

  const tbody = document.getElementById("statementBody");
  tbody.innerHTML = "";

  let balance = customer.openingBalance;

  tbody.innerHTML += `
    <tr>
      <td>-</td>
      <td>رصيد افتتاحي</td>
      <td></td>
      <td></td>
      <td>${balance.toFixed(2)}</td>
    </tr>
  `;

  const allEntries = [
    ...sales.filter(s => s.customer === customer.name).map(s => ({
      date: s.date,
      desc: "فاتورة مبيعات",
      debit: s.total,
      credit: s.paid,
      order: s.order
    })),
    ...purchases.filter(p => p.customer === customer.name).map(p => ({
      date: p.date,
      desc: "فاتورة مشتريات",
      debit: p.paid,
      credit: p.total,
      order: p.order
    })),
    ...receipts.filter(r => r.customer === customer.name).map(r => ({
      date: r.date,
      desc: r.title || "سند قبض",
      debit: 0,
      credit: r.amount,
      order: r.order
    })),
    ...expenses.filter(e => e.customer === customer.name).map(e => ({
      date: e.date,
      desc: e.title,
      debit: e.amount,
      credit: 0,
      order: e.order
    })),
    ...incomes.filter(e => e.customer === customer.name).map(e => ({
      date: e.date,
      desc: e.title,
      debit: e.amount,
      credit: 0,
      order: e.order
    }))
  ];

  allEntries.sort((a,b) => (a.order||0) - (b.order||0));

  allEntries.forEach(e => {
    balance += (e.debit||0) - (e.credit||0);
    tbody.innerHTML += `
      <tr>
        <td>${e.date}</td>
        <td>${e.desc}</td>
        <td>${(e.debit||0).toFixed(2)}</td>
        <td>${(e.credit||0).toFixed(2)}</td>
        <td>${balance.toFixed(2)}</td>
      </tr>
    `;
  });

  document.getElementById("statementModal").style.display = "flex";
}

function closeStatementModal() {
  document.getElementById("statementModal").style.display = "none";
}