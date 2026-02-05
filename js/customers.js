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

  if (!name) {
    showModal("من فضلك أدخل اسم العميل");
    return;
  }

  customers.push({
    name,
    openingBalance: balance,
    balance: balance,
  });

  document.getElementById("customerName").value = "";
  document.getElementById("openingBalance").value = "";

  saveData();
  updateBottomCashBalance();
  renderCustomers();
  showModal("تم إضافة العميل بنجاح ✅", "نجاح");
}

// ====== RENDER CUSTOMERS ======
function renderCustomers(searchQuery = "") {
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";

  let totalBalance = 0; // 👈 إجمالي الأرصدة

  customers.forEach((c, index) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery)) return;

    let currentBalance = c.openingBalance;

    sales
      .filter((s) => s.customer === c.name)
      .forEach((s) => {
        currentBalance += s.total - s.paid;
      });

    purchases
      .filter((p) => p.customer === c.name)
      .forEach((p) => {
        currentBalance += p.paid - p.total;
      });

    incomes
      .filter((i) => i.customer === c.name)
      .forEach((i) => {
        currentBalance -= i.amount;
      });

    expenses
      .filter((e) => e.customer === c.name)
      .forEach((e) => {
        currentBalance += e.amount;
      });

    totalBalance += currentBalance; // 👈 نجمع الإجمالي

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${c.name}</td>
      <td>${currentBalance.toFixed(2)}</td>
      <td class="actions">
        <button class="btn-primary" onclick="openStatementModal(${index})">كشف حساب</button>
        <button class="btn-edit" onclick="openEditModal(${index})">تعديل</button>
        <button class="btn-delete" onclick="deleteCustomer(${index})">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ===== صف الإجمالي =====
  const totalRow = document.createElement("tr");
  totalRow.style.background = "#111827";
  totalRow.style.fontWeight = "bold";
  totalRow.style.color = "#fff";

  totalRow.innerHTML = `
    <td colspan="2">الإجمالي</td>
    <td>${totalBalance.toFixed(2)}</td>
    <td></td>
  `;

  tbody.appendChild(totalRow);
}

// البحث في العملاء
document
  .getElementById("searchCustomer")
  .addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    renderCustomers(query);
  });

// ====== OPEN EDIT MODAL ======
function openEditModal(index) {
  editIndex = index;
  const customer = customers[index];

  document.getElementById("editCustomerName").value = customer.name;
  document.getElementById("editOpeningBalance").value = customer.openingBalance;

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

  if (!newName || isNaN(newOpening)) {
    showModal("من فضلك أدخل بيانات صحيحة");
    return;
  }

  const diff = newOpening - customer.openingBalance;

  customer.name = newName;
  customer.openingBalance = newOpening;
  customer.balance += diff;

  saveData();
  updateBottomCashBalance();
  renderCustomers();
  closeEditModal();
  showModal("تم تعديل بيانات العميل ✨", "نجاح");
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
  showModal("تم حذف العميل 🗑️", "نجاح");
}

// ====== OPEN STATEMENT MODAL ======
function openStatementModal(index) {
  const customer = customers[index];
  document.getElementById("statementCustomerName").innerText =
    "العميل: " + customer.name;

  const tbody = document.getElementById("statementBody");
  tbody.innerHTML = "";

  let balance = customer.openingBalance;

  // الرصيد الافتتاحي
  tbody.innerHTML += `
    <tr>
      <td>-</td>
      <td>رصيد افتتاحي</td>
      <td></td>
      <td></td>
      <td>${balance.toFixed(2)}</td>
    </tr>
  `;

  // جمع كل العمليات الخاصة بالعميل
  const allEntries = [
    // المبيعات
    ...sales
      .filter((s) => s.customer === customer.name)
      .map((s) => ({
        date: s.date,
        desc: "فاتورة مبيعات",
        debit: s.total,
        credit: s.paid,
        order: s.order,
      })),
    // المشتريات
    ...purchases
      .filter((p) => p.customer === customer.name)
      .map((p) => ({
        date: p.date,
        desc: "فاتورة مشتريات",
        debit: p.paid,
        credit: p.qty * p.price,
        order: p.order,
      })),
    // الإيرادات
    ...incomes
      .filter((i) => i.customer === customer.name)
      .map((i) => ({
        date: i.date,
        desc: i.title,
        debit: 0,
        credit: i.amount,
        order: i.order,
      })),
    // المصروفات
    ...expenses
      .filter((e) => e.customer === customer.name)
      .map((e) => ({
        date: e.date,
        desc: e.title,
        debit: e.amount,
        credit: 0,
        order: e.order,
      })),
  ];

  // ترتيب العمليات حسب order وليس التاريخ
  allEntries.sort((a, b) => (a.order || 0) - (b.order || 0));

  // عرض العمليات وحساب الرصيد التراكمي
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
