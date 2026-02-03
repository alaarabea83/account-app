let editPurchaseIndex = null;
let deleteCallback = null;

// ===============================
// عند تحميل الصفحة
// ===============================
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderPurchases();

  document.getElementById("addItemBtn").onclick = addPurchaseItem;
  document.getElementById("saveInvoiceBtn").onclick = savePurchase;

  document
    .getElementById("invoiceCustomer")
    .addEventListener("change", function () {
      const i = this.value;
      document.getElementById("customerBalance").value =
        i === "" ? 0 : customers[i].balance || 0;
      updateGrandTotal();
    });

  document
    .getElementById("paidAmount")
    .addEventListener("input", updateRemaining);
};

// ===============================
// عرض الموردين
// ===============================
function renderCustomerSelect() {
  const sel = document.getElementById("invoiceCustomer");

  sel.innerHTML =
    `<option value="" disabled selected>اختر الحساب</option>
     <option value="">شراء نقدي</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

// ===============================
// إضافة صنف
// ===============================
function addPurchaseItem() {
  const container = document.getElementById("invoiceItems");

  const row = document.createElement("div");
  row.className = "form-row invoice-item";

  row.innerHTML = `
    <select class="itemProduct">
      <option value="">اختر منتج</option>
      ${products.map((p, i) => `<option value="${i}">${p.name}</option>`).join("")}
    </select>

    <input type="number" class="itemQty" placeholder="الكمية">
    <input type="number" class="itemPrice" placeholder="سعر الشراء">
    <input type="number" class="itemTotal" readonly placeholder="الإجمالي">
    <button type="button" class="btn-delete-item">❌</button>
  `;

  container.appendChild(row);

  const qty = row.querySelector(".itemQty");
  const price = row.querySelector(".itemPrice");
  const total = row.querySelector(".itemTotal");

  function calc() {
    total.value = (+qty.value || 0) * (+price.value || 0);
    updateInvoiceTotal();
  }

  qty.oninput = calc;
  price.oninput = calc;

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
  const bal = +document.getElementById("customerBalance").value || 0;
  const inv = +document.getElementById("invoiceTotal").value || 0;

  document.getElementById("grandTotal").value = bal - inv;
  updateRemaining();
}

function updateRemaining() {
  const g = +document.getElementById("grandTotal").value || 0;
  const p = +document.getElementById("paidAmount").value || 0;

  document.getElementById("remainingAmount").value = g + p;
}

// ===============================
// حفظ فاتورة شراء
// ===============================
function savePurchase() {
  const container = document.getElementById("invoiceItems");
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل", "تنبيه");
    return;
  }

  let total = 0;
  let items = [];

  // جمع بيانات كل صف
  document.querySelectorAll(".invoice-item").forEach((row) => {
    const pIndex = row.querySelector(".itemProduct").value;
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;

    // تحقق من صحة المنتج
    if (pIndex === "" || !products[pIndex]) {
      showModal("من فضلك اختر منتج صحيح", "تنبيه");
      throw new Error("منتج غير صحيح");
    }

    const product = products[pIndex];

    total += qty * price;

    items.push({
      name: product.name,
      qty,
      price,
    });
  });

  const paid = +document.getElementById("paidAmount").value || 0;
  const cIndex = document.getElementById("invoiceCustomer").value;

  let supplierName = "نقدي";
  let previousBalance = 0;
  let newBalance = total - paid;

  if (cIndex !== "") {
    const c = customers[cIndex];
    customerName = c.name;
    previousBalance = c.balance || 0; // مهم جدًا
    newBalance = previousBalance - (total - paid);
  }

  const oldInvoice =
    editPurchaseIndex !== null ? purchases[editPurchaseIndex] : null;

  // ===== استرجاع المخزون والرصيد القديم لو تعديل =====
  if (oldInvoice) {
    oldInvoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty -= item.qty; // نطرح الكمية القديمة قبل تعديلها
    });

    if (oldInvoice.customer !== "نقدي") {
      const customer = customers.find((c) => c.name === oldInvoice.customer);
      if (customer) customer.balance -= oldInvoice.total - oldInvoice.paid;
    }

    cash.expenses -= oldInvoice.paid;
  }

  // ===== إضافة جديد للمخزون =====
  items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (product) product.qty += item.qty; // نزيد الكمية الجديدة
  });

  // ===== تحديث رصيد المورد =====
  if (cIndex !== "") {
    customers[cIndex].balance = newBalance;
  }

  // ===== تحديث الخزنة =====
  cash.expenses += paid;

  // ===== إنشاء كائن الفاتورة =====
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

  // ===== حفظ الفاتورة =====
  if (editPurchaseIndex !== null) {
    purchases[editPurchaseIndex] = invoiceData;
    editPurchaseIndex = null;
  } else {
    purchases.push(invoiceData);
  }

  saveData();
  renderPurchases();

  container.innerHTML = "";
  document.querySelectorAll("input").forEach((i) => (i.value = ""));
  document.getElementById("invoiceCustomer").value = "";

  showModal("تم حفظ فاتورة الشراء بنجاح ✅", "نجاح");
}

// ===============================
// عرض الفواتير
// ===============================
function renderPurchases(data = purchases) {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

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
        <button onclick="editPurchase(${i})">✏️ تعديل</button>
        <button onclick="confirmDeletePurchase(${inv.order})">🗑 حذف</button>
      </td>
    </tr>`;
  });
}

// ===============================
// تعديل
// ===============================
function editPurchase(index) {
  const invoice = purchases[index];
  editPurchaseIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

  // ===== استرجاع المخزون القديم =====
  invoice.items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (product) product.qty -= item.qty; // نطرح الكمية لأنها كانت مضافة من الفاتورة
  });

  // ===== استرجاع رصيد المورد القديم =====
  if (invoice.customer !== "نقدي") {
    const customer = customers.find((c) => c.name === invoice.customer);
    if (customer) customer.balance -= invoice.total - invoice.paid;
  }

  // ===== تعبئة الحقول =====
  document.getElementById("invoiceCustomer").value =
    invoice.customer === "نقدي"
      ? ""
      : customers.findIndex((c) => c.name === invoice.customer);

  document.getElementById("customerBalance").value =
    invoice.customer === "نقدي"
      ? 0
      : customers.find((c) => c.name === invoice.customer).balance;

  document.getElementById("paidAmount").value = invoice.paid;

  // ===== تعبئة الأصناف =====
  invoice.items.forEach((item) => {
    addPurchaseItem();
    const row = container.lastElementChild;

    row.querySelector(".itemProduct").value = products.findIndex(
      (p) => p.name === item.name,
    );
    row.querySelector(".itemQty").value = item.qty;
    row.querySelector(".itemPrice").value = item.price;
    row.querySelector(".itemTotal").value = item.qty * item.price;
  });

  updateInvoiceTotal();
  updateGrandTotal();

  showModal("تم تحميل فاتورة الشراء للتعديل ✏️", "تعديل فاتورة");
}

// ===============================
// حذف
// ===============================
function confirmDeletePurchase(order) {
  showDeleteModal("هل متأكد من الحذف؟", () => {
    const i = purchases.findIndex((p) => p.order === order);
    if (i === -1) return;

    const inv = purchases[i];

    inv.items.forEach((it) => {
      const p = products.find((x) => x.name === it.name);
      if (p) p.qty -= it.qty;
    });

    if (inv.customer !== "نقدي") {
      const c = customers.find((x) => x.name === inv.customer);
      if (c) c.balance -= inv.total - inv.paid;
    }

    cash.expenses -= inv.paid;

    purchases.splice(i, 1);

    saveData();
    renderPurchases();
    showModal("تم الحذف ✅");
  });
}

// ===============================
// مودالات
// ===============================
function showDeleteModal(msg, onConfirm) {
  const m = document.getElementById("appModal");

  modalTitle.innerText = "تأكيد";
  modalMessage.innerText = msg;

  modalConfirmBtn.style.display = "flex";
  modalCancelBtn.style.display = "flex";
  modalOkBtn.style.display = "none";

  deleteCallback = onConfirm;
  m.style.display = "flex";

  modalConfirmBtn.onclick = () => {
    if (deleteCallback) deleteCallback();
    closeModal();
  };

  modalCancelBtn.onclick = closeModal;
}

function showModal(msg, title = "تنبيه") {
  const m = document.getElementById("appModal");

  modalTitle.innerText = title;
  modalMessage.innerText = msg;

  modalConfirmBtn.style.display = "none";
  modalCancelBtn.style.display = "none";
  modalOkBtn.style.display = "flex";

  m.style.display = "flex";

  modalOkBtn.onclick = closeModal;
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
  deleteCallback = null;
}
