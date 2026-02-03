let editInvoiceIndex = null;

// ===============================
// عند تحميل الصفحة
// ===============================
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderSales();

  document.getElementById("addItemBtn").onclick = addInvoiceItem;
  document.getElementById("saveInvoiceBtn").onclick = saveSale;

  document.getElementById("invoiceCustomer").addEventListener("change", function () {
    const index = this.value;
    document.getElementById("customerBalance").value =
      index === "" ? 0 : customers[index].balance || 0;
    updateGrandTotal();
  });

  document.getElementById("paidAmount").addEventListener("input", updateRemaining);
};

// ===============================
// عرض العملاء
// ===============================
function renderCustomerSelect() {
  const sel = document.getElementById("invoiceCustomer");
  if (!sel) return;

  sel.innerHTML =
    `<option value="" disabled selected>إختر الحساب</option>` +
    `<option value="">مبيعات نقدي</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

// ===============================
// إضافة صف منتج
// ===============================
function addInvoiceItem() {
  const container = document.getElementById("invoiceItems");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "form-row invoice-item";

  row.innerHTML = `
    <select class="itemProduct">
      <option value="">إختر منتج</option>
      ${products.map((p, i) => `<option value="${i}">${p.name}</option>`).join("")}
    </select>
    <input type="number" class="itemQty" min="1" placeholder="الكمية">
    <input type="number" class="itemPrice" readonly placeholder="السعر">
    <input type="number" class="itemTotal" readonly placeholder="الإجمالي">
    <button type="button" class="btn-delete-item">❌</button>
  `;

  container.appendChild(row);

  const productSelect = row.querySelector(".itemProduct");
  const qtyInput = row.querySelector(".itemQty");
  const priceInput = row.querySelector(".itemPrice");
  const totalInput = row.querySelector(".itemTotal");

  function calcRow() {
    totalInput.value = (+qtyInput.value || 0) * (+priceInput.value || 0);
    updateInvoiceTotal();
  }

  productSelect.onchange = function () {
    const p = products[this.value];
    priceInput.value = p ? p.price : 0;
    calcRow();
  };

  qtyInput.oninput = calcRow;

  row.querySelector(".btn-delete-item").onclick = () => {
    row.remove();
    updateInvoiceTotal();
  };
}

// ===============================
// الحسابات
// ===============================
function updateInvoiceTotal() {
  let total = 0;
  document.querySelectorAll(".invoice-item").forEach((r) => {
    total += +r.querySelector(".itemTotal").value || 0;
  });
  document.getElementById("invoiceTotal").value = total;
  updateGrandTotal();
}

function updateGrandTotal() {
  const balance = +document.getElementById("customerBalance").value || 0;
  const invoiceTotal = +document.getElementById("invoiceTotal").value || 0;
  document.getElementById("grandTotal").value = balance + invoiceTotal;
  updateRemaining();
}

function updateRemaining() {
  const g = +document.getElementById("grandTotal").value || 0;
  const p = +document.getElementById("paidAmount").value || 0;
  document.getElementById("remainingAmount").value = g - p;
}

// ===============================
// حفظ الفاتورة (مضاف / معدل)
// ===============================
function saveSale() {
  const container = document.getElementById("invoiceItems");
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل");
    return;
  }

  let total = 0;
  let items = [];

  document.querySelectorAll(".invoice-item").forEach((row) => {
    const pIndex = row.querySelector(".itemProduct").value;
    const qty = +row.querySelector(".itemQty").value;
    const product = products[pIndex];

    total += qty * product.price;

    items.push({
      name: product.name,
      qty,
      price: product.price,
    });
  });

  const paid = +document.getElementById("paidAmount").value || 0;
  const cIndex = document.getElementById("invoiceCustomer").value;

  let customerName = "نقدي";
  let previousBalance = 0;
  let newBalance = total - paid;

  if (cIndex !== "") {
    const c = customers[cIndex];
    customerName = c.name;
    previousBalance = c.balance;
    newBalance = c.balance + (total - paid);
  }

  const oldInvoice = editInvoiceIndex !== null ? sales[editInvoiceIndex] : null;

  // رجوع البيانات القديمة لو تعديل
  if (oldInvoice) {
    oldInvoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });

    if (oldInvoice.customer !== "نقدي") {
      const customer = customers.find((c) => c.name === oldInvoice.customer);
      if (customer) customer.balance -= oldInvoice.total - oldInvoice.paid;
    }

    cash.income -= oldInvoice.paid;
  }

  // خصم من المخزون 
  items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (product) product.qty -= item.qty;
  });

  // تحديث رصيد العميل
  if (cIndex !== "") {
    customers[cIndex].balance = newBalance;
  }

  // تحديث  الخزنه
  cash.income += paid;

  // إنشاء كائن الفاتورة الجديد للتخزين
  const invoiceData = {
    customer: customerName,
    items,
    total,
    paid,
    remaining: total - paid,
    previousBalance,
    newBalance,
    date: oldInvoice ? oldInvoice.date : new Date().toISOString().slice(0, 10),
    order: oldInvoice ? oldInvoice.order : Date.now(),
  };

  if (editInvoiceIndex !== null) {
    sales[editInvoiceIndex] = invoiceData; // ✔️ تعديل في نفس المكان
    editInvoiceIndex = null;
  } else {
    sales.push(invoiceData);
  }

  saveData();
  renderSales();
  container.innerHTML = "";
  document.querySelectorAll("input").forEach((i) => (i.value = ""));
  showModal("تم حفظ الفاتورة بنجاح ✅", "نجاح");
}

// ===============================
// عرض الفواتير
// ===============================
function renderSales(data = sales) {
  const tbody = document.querySelector("#salesTable tbody");
  tbody.innerHTML = "";

  data.forEach((inv, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${inv.date}</td>
        <td>${inv.customer}</td>
        <td>${inv.total}</td>
        <td>${inv.paid}</td>
        <td>${inv.remaining}</td>
        <td>${inv.previousBalance}</td>
        <td>${inv.newBalance}</td>
        <td>
          <button class="btn-edit" onclick="editInvoice(${i})">تعديل الفاتورة</button>
          <button class="btn-delete" onclick="confirmDeleteInvoice(${inv.order})">حذف الفاتورة</button>
        </td>
      </tr>`;
  });
}

// ===============================
// تعديل فاتورة
// ===============================
function editInvoice(index) {
  const invoice = sales[index];
  editInvoiceIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

  // ===== استرجاع المخزون القديم =====
  invoice.items.forEach(item => {
    const product = products.find(p => p.name === item.name);
    if (product) product.qty += item.qty;
  });

  // ===== استرجاع رصيد العميل القديم =====
  if (invoice.customer !== "نقدي") {
    const customer = customers.find(c => c.name === invoice.customer);
    if (customer) customer.balance -= invoice.total - invoice.paid;
  }

  // ===== تعبئة الحقول =====
  document.getElementById("invoiceCustomer").value =
    invoice.customer === "نقدي"
      ? ""
      : customers.findIndex(c => c.name === invoice.customer);

  document.getElementById("customerBalance").value =
    invoice.customer === "نقدي"
      ? 0
      : customers.find(c => c.name === invoice.customer).balance;

  document.getElementById("paidAmount").value = invoice.paid;

  // ===== تعبئة الأصناف =====
  invoice.items.forEach(item => {
    addInvoiceItem();
    const row = container.lastElementChild;

    row.querySelector(".itemProduct").value =
      products.findIndex(p => p.name === item.name);
    row.querySelector(".itemQty").value = item.qty;
    row.querySelector(".itemPrice").value = item.price;
    row.querySelector(".itemTotal").value = item.qty * item.price;
  });

  updateInvoiceTotal();
  updateGrandTotal();

  showModal("تم تحميل الفاتورة للتعديل ✏️", "تعديل فاتورة");
}


// ===============================
// حذف فاتورة
// ===============================
function confirmDeleteInvoice(order) {
  showDeleteModal("هل أنت متأكد من حذف هذه الفاتورة؟", () => {
    const index = sales.findIndex((s) => s.order === order);
    if (index === -1) return;

    const invoice = sales[index];

    invoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });

    if (invoice.customer !== "نقدي") {
      const customer = customers.find((c) => c.name === invoice.customer);
      if (customer) customer.balance -= invoice.total - invoice.paid;
    }

    cash.income -= invoice.paid;
    sales.splice(index, 1);

    saveData();
    renderSales();
    showModal("تم حذف الفاتورة بنجاح ✅", "نجاح");
  });
}


function filterSalesByDate() {
  const fromVal = document.getElementById("fromDate").value;
  const toVal = document.getElementById("toDate").value;

  const from = fromVal ? new Date(fromVal) : null;
  const to = toVal ? new Date(toVal) : null;

  const filtered = sales.filter((invoice) => {
    if (!invoice.date) return false;
    const d = new Date(invoice.date);

    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  renderSales(filtered);
}

function resetSalesFilter() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  renderSales();
}

// ===============================
// مودال عام
// ===============================
let deleteCallback = null;

function showDeleteModal(message, onConfirm) {
  const appModal = document.getElementById("appModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalOkBtn = document.getElementById("modalOkBtn");

  modalTitle.innerText = "تأكيد الحذف";
  modalMessage.innerText = message;

  modalConfirmBtn.style.display = "flex";
  modalCancelBtn.style.display = "flex";
  modalOkBtn.style.display = "none";

  deleteCallback = onConfirm;
  appModal.style.display = "flex";

  modalConfirmBtn.onclick = () => {
    if (deleteCallback) deleteCallback();
    closeModal();
  };

  modalCancelBtn.onclick = closeModal;
}

function showModal(message, title = "تنبيه") {
  const appModal = document.getElementById("appModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalOkBtn = document.getElementById("modalOkBtn");

  modalTitle.innerText = title;
  modalMessage.innerText = message;

  modalConfirmBtn.style.display = "none";
  modalCancelBtn.style.display = "none";
  modalOkBtn.style.display = "flex";

  appModal.style.display = "flex";

  modalOkBtn.onclick = closeModal;
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
  deleteCallback = null;
}
