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

  document.getElementById("invoiceCustomer").addEventListener("change", function () {
    const index = this.value;
    document.getElementById("customerBalance").value =
      index === "" ? 0 : customers[index].balance || 0;
    updateGrandTotal();
  });

  document.getElementById("paidAmount").addEventListener("input", updateRemaining);
};

// ===============================
// عرض العملاء في اختيار الفاتورة
// ===============================
function renderCustomerSelect() {
  const sel = document.getElementById("invoiceCustomer");
  if (!sel) return;

  sel.innerHTML =
    `<option value="" disabled selected>اختر الحساب</option>` +
    `<option value="">شراء نقدي</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

// ===============================
// إضافة صف منتج في الفاتورة
// ===============================
function addPurchaseItem() {
  const container = document.getElementById("invoiceItems");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "form-row invoice-item";

  row.innerHTML = `
    <select class="itemProduct">
      <option value="">اختر منتج</option>
      ${products.map((p, i) => `<option value="${i}">${p.name}</option>`).join("")}
    </select>
    <input type="number" class="itemQty" min="1" placeholder="الكمية">
    <input type="number" class="itemPrice" placeholder="سعر الشراء">
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

  qtyInput.oninput = calcRow;
  priceInput.oninput = calcRow;

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
  document.getElementById("grandTotal").value = balance - invoiceTotal;
  updateRemaining();
}

function updateRemaining() {
  const g = +document.getElementById("grandTotal").value || 0;
  const p = +document.getElementById("paidAmount").value || 0;
  document.getElementById("remainingAmount").value = g - p;
}

// ===============================
// حفظ فاتورة الشراء
// ===============================
function savePurchase() {
  const container = document.getElementById("invoiceItems");
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل");
    return;
  }

  let total = 0;
  let items = [];

  document.querySelectorAll(".invoice-item").forEach((row) => {
    const pIndex = row.querySelector(".itemProduct").value;
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;

    if (pIndex === "" || !products[pIndex]) {
      showModal("من فضلك اختر منتج صحيح");
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

  let customerName = "نقدي";
  let previousBalance = 0;
  let newBalance = total - paid;

  if (cIndex !== "") {
    const c = customers[cIndex];
    customerName = c.name;
    previousBalance = c.balance || 0;
    newBalance = previousBalance - (total - paid);
  }

  const oldInvoice = editPurchaseIndex !== null ? purchases[editPurchaseIndex] : null;

  // استرجاع البيانات القديمة عند التعديل
  if (oldInvoice) {
    oldInvoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty -= item.qty;
    });

    if (oldInvoice.customer !== "نقدي") {
      const customer = customers.find((c) => c.name === oldInvoice.customer);
      if (customer) customer.balance -= oldInvoice.total - oldInvoice.paid;
    }

    cash.expenses -= oldInvoice.paid;
  }

  // تحديث المخزون
  items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (product) product.qty += item.qty;
  });

  cash.expenses += paid;

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
// عرض فواتير الشراء
// ===============================
function renderPurchases(data = purchases) {
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
          <button class="btn-edit" onclick="editPurchase(${i})">تعديل الفاتورة</button>
          <button class="btn-delete" onclick="confirmDeletePurchase(${inv.order})">حذف الفاتورة</button>
        </td>
      </tr>`;
  });
}

// ===============================
// تعديل فاتورة
// ===============================
function editPurchase(index) {
  const invoice = purchases[index];
  editPurchaseIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

  invoice.items.forEach(item => {
    const product = products.find(p => p.name === item.name);
    if (product) product.qty -= item.qty;
  });

  document.getElementById("invoiceCustomer").value =
    invoice.customer === "نقدي"
      ? ""
      : customers.findIndex(c => c.name === invoice.customer);

  document.getElementById("customerBalance").value =
    invoice.customer === "نقدي"
      ? 0
      : customers.find(c => c.name === invoice.customer).balance;

  document.getElementById("paidAmount").value = invoice.paid;

  invoice.items.forEach(item => {
    addPurchaseItem();
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
function confirmDeletePurchase(order) {
  showDeleteModal("هل أنت متأكد من حذف هذه الفاتورة؟", () => {
    const index = purchases.findIndex((p) => p.order === order);
    if (index === -1) return;

    const invoice = purchases[index];

    invoice.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      if (product) product.qty -= item.qty;
    });

    cash.expenses -= invoice.paid;
    purchases.splice(index, 1);

    saveData();
    renderPurchases();
    showModal("تم حذف الفاتورة بنجاح ✅", "نجاح");
  });
}

// ===============================
// مودالات
// ===============================
function showDeleteModal(msg, onConfirm) {
  const m = document.getElementById("appModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalOkBtn = document.getElementById("modalOkBtn");

  modalTitle.innerText = "تأكيد الحذف";
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
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalOkBtn = document.getElementById("modalOkBtn");

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
