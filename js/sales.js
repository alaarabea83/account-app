let editInvoiceIndex = null;

// ===============================
// عند تحميل الصفحة
// ===============================
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderSales();

  // Dropdown لاختيار المنتج مباشرة
  renderProductSelect();

  document.getElementById("saveInvoiceBtn").onclick = saveSale;

  document
    .getElementById("invoiceCustomer")
    .addEventListener("change", function () {
      const index = this.value;
      document.getElementById("customerBalance").value =
        index === "" ? 0 : customers[index].balance || 0;
      updateGrandTotal();
    });

  document
    .getElementById("paidAmount")
    .addEventListener("input", updateRemaining);
};

// ===============================
// عرض العملاء
// ===============================
function renderCustomerSelect() {
  const sel = document.getElementById("invoiceCustomer");
  if (!sel) return;

  sel.innerHTML =
    `<option value="" disabled selected>إختر الحساب</option>` +
    `<option value="">بيع نقدي</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

// ===============================
// Dropdown المنتجات أعلى الفاتورة
// ===============================
function renderProductSelect() {
  const sel = document.getElementById("invoiceProductSelect");
  sel.innerHTML =
    `<option value="" disabled selected>إضافة المنتجات</option>` +
    products.map((p, i) => `<option value="${i}">${p.name}</option>`).join("");

  sel.onchange = function () {
    const pIndex = this.value;
    const product = products[pIndex];
    if (!product) return;
    addInvoiceItem(product);
    this.selectedIndex = 0;
  };
}

function addInvoiceItem(product) {
  const tbody = document.getElementById("invoiceItems");
  const rowNumber = tbody.children.length + 1;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${rowNumber}</td>
    <td>${product.name}</td>
    <td><input type="number" class="itemQty" min="1" value=""></td>
    <td><input type="number" class="itemPrice" value="${product.price}" readonly></td>
    <td><input type="number" class="itemTotal" value="${product.price}" readonly></td>
    <td><button type="button" class="btn-delete-item">×</button></td>
  `;
  tbody.appendChild(row);

  const qtyInput = row.querySelector(".itemQty");
  const totalInput = row.querySelector(".itemTotal");

  function calcRow() {
    totalInput.value = (+qtyInput.value || 0) * (+product.price || 0);
    updateInvoiceTotal();
  }

  qtyInput.addEventListener("input", calcRow);
  qtyInput.addEventListener("change", calcRow);

  row.querySelector(".btn-delete-item").onclick = () => {
    row.remove();
    updateInvoiceTotal();
    updateRowNumbers();
  };
}

function updateRowNumbers() {
  const rows = document.querySelectorAll("#invoiceItems tr");
  rows.forEach((r, i) => (r.cells[0].innerText = i + 1));
}

// ===============================
// الحسابات
// ===============================
// تحديث إجمالي الفاتورة
function updateInvoiceTotal() {
  let total = 0;
  document.querySelectorAll("#invoiceItems tr").forEach((row) => {
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;
    total += qty * price;

    // تحديث الخلية مباشرة
    row.querySelector(".itemTotal").value = qty * price;
  });

  document.getElementById("invoiceTotal").value = total;
  updateGrandTotal();
}

// تحديث الإجمالي الكلي
function updateGrandTotal() {
  const balance = +document.getElementById("customerBalance").value || 0;
  const invoiceTotal = +document.getElementById("invoiceTotal").value || 0;
  document.getElementById("grandTotal").value = balance + invoiceTotal;
  updateRemaining();
}

// تحديث المتبقي بعد المدفوع
function updateRemaining() {
  const grand = +document.getElementById("grandTotal").value || 0;
  const paid = +document.getElementById("paidAmount").value || 0;
  document.getElementById("remainingAmount").value = grand - paid;
}

// ===============================
// حفظ الفاتورة
// ===============================
function saveSale() {
  const container = document.getElementById("invoiceItems");

  // ===== تحقق من وجود منتجات =====
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل");
    return;
  }

  // ===== تحقق من الكميات =====
  if ([...container.querySelectorAll(".itemQty")].some(i => +i.value <= 0)) {
    showModal("أدخل كميات صحيحة للمنتجات");
    return;
  }

  // ===== إذا كان تعديل فاتورة، استرجاع المخزون والرصيد القديم =====
  if (editInvoiceIndex !== null) {
    const oldInvoice = sales[editInvoiceIndex];

    // استرجاع الرصيد القديم
    if (oldInvoice.customer !== "نقدي") {
      const cust = customers.find(c => c.name === oldInvoice.customer);
      if (cust) {
        cust.balance -= (oldInvoice.total - oldInvoice.paid);
      }
    }

    // استرجاع الكميات القديمة للمخزون
    oldInvoice.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      if (product) product.qty += item.qty;
    });
  }

  // ===== جمع بيانات الفاتورة الجديدة =====
  let total = 0;
  let items = [];

  container.querySelectorAll("tr").forEach(row => {
    const name = row.cells[1].innerText;
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;

    total += qty * price;

    items.push({ name, qty, price });
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
    customers[cIndex].balance = newBalance;
  }

  // ===== خصم الكميات الجديدة من المخزون =====
  items.forEach(item => {
    const product = products.find(p => p.name === item.name);
    if (product) product.qty -= item.qty;
  });

  cash.income += paid;

  const invoiceData = {
    customer: customerName,
    items,
    total,
    paid,
    remaining: total - paid,
    previousBalance,
    newBalance,
    date: new Date().toISOString().slice(0, 10),
    order: editInvoiceIndex !== null ? sales[editInvoiceIndex].order : Date.now()
  };

  // ===== حفظ أو تعديل الفاتورة =====
  if (editInvoiceIndex !== null) {
    sales[editInvoiceIndex] = invoiceData;
    editInvoiceIndex = null;
  } else {
    sales.push(invoiceData);
  }

  // ===== إعادة تعيين النموذج =====
  container.innerHTML = "";
  document.getElementById("invoiceCustomer").selectedIndex = 0;
  document.getElementById("invoiceProductSelect").selectedIndex = 0;
  document.getElementById("customerBalance").value = "";
  document.getElementById("invoiceTotal").value = "";
  document.getElementById("grandTotal").value = "";
  document.getElementById("paidAmount").value = "";
  document.getElementById("remainingAmount").value = "";

  saveData();
  updateBottomCashBalance();
  renderSales();
  showModal("تم حفظ الفاتورة بنجاح ✅", "نجاح");
}


// ===============================
// عرض الفواتير
// ===============================
function renderSales(data = sales) {
  const tbody = document.querySelector("#salesTable tbody");
  tbody.innerHTML = "";

  let sumTotal = 0;
  let sumPaid = 0;
  let sumRemain = 0;

  data.forEach((inv, i) => {
    sumTotal += +inv.total || 0;
    sumPaid += +inv.paid || 0;
    sumRemain += +inv.remaining || 0;

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
          <div class="action-buttons">
            <button class="btn-edit" onclick="editInvoice(${i})">تعديل</button>
            <button class="btn-delete" onclick="confirmDeleteInvoice(${inv.order})">حذف</button>
          </div>
        </td>
      </tr>`;
  });

  // ===== صف الإجمالي =====
  tbody.innerHTML += `
    <tr style="background:#14532d;color:#fff;font-weight:bold">
      <td colspan="3">الإجمالي</td>
      <td>${sumTotal}</td>
      <td>${sumPaid}</td>
      <td>${sumRemain}</td>
      <td colspan="3"></td>
    </tr>`;
}

// ===============================
// تعديل فاتورة
// ===============================
function editInvoice(index) {
  const invoice = sales[index];
  editInvoiceIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

  // ===== تعبئة العميل =====
  document.getElementById("invoiceCustomer").value =
    invoice.customer === "نقدي"
      ? ""
      : customers.findIndex((c) => c.name === invoice.customer);

  document.getElementById("customerBalance").value =
    invoice.customer === "نقدي"
      ? 0
      : customers.find((c) => c.name === invoice.customer).balance;

  document.getElementById("paidAmount").value = invoice.paid;

  // ===== تعبئة المنتجات =====
  invoice.items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (!product) return;
    addInvoiceItem(product); // استخدم الدالة الجديدة
    const row = container.lastElementChild;

    row.querySelector(".itemQty").value = item.qty;
    row.querySelector(".itemTotal").value = item.qty * product.price;
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
    updateBottomCashBalance();
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
