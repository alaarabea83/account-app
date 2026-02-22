function getTypeName(type) {
  switch (type) {
    case "customer":
      return "عميل";
    case "supplier":
      return "مورد";
    case "income":
      return "إيراد";
    case "expense":
      return "مصروف";
    default:
      return "-";
  }
}

let editIndex = null;
let deleteIndex = null;

// عند تحميل الصفحة
window.onload = function () {
  loadData();
  renderCustomers();
  document.getElementById("addCustomerBtn").onclick = addCustomerHandler;
};

// ====== MODAL ======
function showModal(message, title = "تنبيه") {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerText = message;
  document.getElementById("appModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
}

// ====== ADD CUSTOMER ======
function addCustomerHandler() {
  const name = document.getElementById("customerName").value.trim();
  const balance = +document.getElementById("openingBalance").value || 0;
  const type = document.getElementById("accountType").value; // النوع

  // ✅ التحقق من الاسم ونوع الحساب مع بعض
  if (!name && !type) {
    showModal("من فضلك أدخل اسم الحساب واختر نوع الحساب");
    return;
  }

  if (!name) {
    showModal("من فضلك أدخل اسم الحساب");
    return;
  }

  if (!type) {
    showModal("من فضلك اختر نوع الحساب");
    return;
  }

  // 👇 إضافة الحساب
  customers.push({
    name,
    openingBalance: balance,
    balance: balance,
    type,
  });

  // تنظيف الحقول بعد الإضافة
  document.getElementById("customerName").value = "";
  document.getElementById("openingBalance").value = "";
  document.getElementById("accountType").value = "";

  saveData();
  updateBottomCashBalance();
  renderCustomers();
  showModal("تم إضافة الحساب بنجاح ✅", "نجاح");
}

// ====== RENDER CUSTOMERS ======
function renderCustomers(searchQuery = "", filterType = null) {
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";

  let totalDebit = 0;
  let totalCredit = 0;
  let visibleCount = 0; // 👈 هنعدّ العملاء اللي اتعرضوا

  customers.forEach((c, index) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
    if (filterType && c.type !== filterType) return;

    visibleCount++; // 👈 زوّدنا العداد

    let currentBalance = c.openingBalance;

    sales.filter((s) => s.customer === c.name)
      .forEach((s) => currentBalance += s.total - s.paid);

    purchases.filter((p) => p.customer === c.name)
      .forEach((p) => currentBalance += p.paid - p.total);

    incomes.filter((i) => i.customer === c.name)
      .forEach((i) => currentBalance -= i.amount);

    expenses.filter((e) => e.customer === c.name)
      .forEach((e) => currentBalance += e.amount);

    receipts.filter((r) => r.customer === c.name)
      .forEach((r) => currentBalance -= r.amount);

    if (currentBalance > 0) {
      totalDebit += currentBalance;
    } else {
      totalCredit += Math.abs(currentBalance);
    }

    const debit = currentBalance > 0 ? currentBalance.toFixed(2) : "0.00";
    const credit = currentBalance < 0 ? Math.abs(currentBalance).toFixed(2) : "0.00";

    const tr = document.createElement("tr");
    tr.innerHTML = `
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

  // ===== لو مفيش بيانات =====
  if (visibleCount === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="5" style="text-align:center; padding:20px; color:#6B7280;">
        لا توجد بيانات
      </td>
    `;
    tbody.appendChild(emptyRow);
    return; // 👈 نوقف هنا ومينزلش صف الإجمالي
  }

  // ===== صف الإجمالي (يظهر فقط لو فيه بيانات) =====
  const totalRow = document.createElement("tr");
  totalRow.classList.add("table-total-row");

  totalRow.innerHTML = `
    <td colspan="2">إجمالي الأرصدة</td>
    <td>${totalDebit.toFixed(2)}</td>
    <td>${totalCredit.toFixed(2)}</td>
    <td></td>
  `;

  tbody.appendChild(totalRow);
}

// البحث في الحسابات
document
  .getElementById("searchCustomer")
  .addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    const type = document.getElementById("filterType").value;
    renderCustomers(query, type);
  });

document.getElementById("filterType").addEventListener("change", function () {
  const query = document
    .getElementById("searchCustomer")
    .value.trim()
    .toLowerCase();
  const type = this.value;
  renderCustomers(query, type);
});

// ====== OPEN EDIT MODAL ======
function openEditModal(index) {
  editIndex = index;
  const customer = customers[index];

  document.getElementById("editCustomerName").value = customer.name;
  document.getElementById("editOpeningBalance").value = customer.openingBalance;
  document.getElementById("editAccountType").value = customer.type; // ✅ النوع

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editIndex = null;
}

// ====== SAVE EDIT ======
function saveCustomerEdit() {
  if (editIndex === null) return;

  const customer = customers[editIndex];

  const newName = document.getElementById("editCustomerName").value.trim();
  const newOpening = +document.getElementById("editOpeningBalance").value;
  const newType = document.getElementById("editAccountType").value; // ✅ النوع

  if (!newName || isNaN(newOpening)) {
    showModal("من فضلك أدخل بيانات صحيحة");
    return;
  }

  const diff = newOpening - customer.openingBalance;

  customer.name = newName;
  customer.openingBalance = newOpening;
  customer.balance += diff;
  customer.type = newType; // ✅ تحديث النوع

  saveData();
  updateBottomCashBalance();
  renderCustomers();
  closeEditModal();
  showModal("تم تعديل بيانات الحساب ✨", "نجاح");
}

// ====== DELETE ======
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
  updateBottomCashBalance();
  renderCustomers();

  closeDeleteModal();
  showModal("تم حذف الحساب 🗑️", "نجاح");
}

// ====== OPEN STATEMENT MODAL ======
function openStatementModal(index) {
  const customer = customers[index];
  document.getElementById("statementCustomerName").innerText =
    "الحساب: " + customer.name + " (" + customer.type + ")";

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
    ...sales
      .filter((s) => s.customer === customer.name)
      .map((s) => ({
        date: s.date,
        desc: "فاتورة مبيعات",
        debit: s.total,
        credit: s.paid,
        order: s.order,
      })),
    ...purchases
      .filter((p) => p.customer === customer.name)
      .map((p) => ({
        date: p.date,
        desc: "فاتورة مشتريات",
        debit: p.paid,
        credit: p.total,
        order: p.order,
      })),
    ...incomes
      .filter((i) => i.customer === customer.name)
      .map((i) => ({
        date: i.date,
        desc: i.title,
        debit: 0,
        credit: i.amount,
        order: i.order,
      })),
    ...expenses
      .filter((e) => e.customer === customer.name)
      .map((e) => ({
        date: e.date,
        desc: e.title,
        debit: e.amount,
        credit: 0,
        order: e.order,
      })),
    ...receipts
      .filter((r) => r.customer === customer.name)
      .map((r) => ({
        date: r.date,
        desc: r.title || "سند قبض",
        debit: 0,
        credit: r.amount,
        order: r.order,
      })),
  ];

  allEntries.sort((a, b) => (a.order || 0) - (b.order || 0));

  allEntries.forEach((e) => {
    balance += (e.debit || 0) - (e.credit || 0);
    tbody.innerHTML += `
      <tr>
        <td>${e.date}</td>
        <td>${e.desc}</td>
        <td>${(e.debit || 0).toFixed(2)}</td>
        <td>${(e.credit || 0).toFixed(2)}</td>
        <td>${balance.toFixed(2)}</td>
      </tr>
    `;
  });

  document.getElementById("statementModal").style.display = "flex";
}

function closeStatementModal() {
  document.getElementById("statementModal").style.display = "none";
}
