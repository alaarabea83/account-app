let editInvoiceIndex = null;

// ✅ دالة حساب الرصيد الديناميكي
function getCustomerBalance(customerName) {
  let balance = 0;

  sales.forEach((s) => {
    if (s.customer?.trim() === customerName?.trim()) {
      balance += (s.total || 0) - (s.paid || 0);
    }
  });

  return balance;
}

function setTodayDate(id) {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById(id).value = today;
}

// عند تحميل الصفحة //
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderProductSelect();

  setTodayDate("fromDate");
  setTodayDate("toDate");

  // اعرض فواتير اليوم فقط
  filterSalesByDate();

  document.getElementById("saveInvoiceBtn").onclick = saveSale;

  const paidInput = document.getElementById("paidAmount");
  if (paidInput) {
    ["input", "keyup", "change"].forEach((evt) => {
      paidInput.addEventListener(evt, updateRemaining);
    });
  }

  // 🔍 البحث
  document.getElementById("searchSale").addEventListener("input", searchSales);

  // فلترة التاريخ
  document
    .getElementById("fromDate")
    .addEventListener("change", filterSalesByDate);

  document
    .getElementById("toDate")
    .addEventListener("change", filterSalesByDate);
};

document.getElementById("invoiceItems").addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-delete-item")) {
    e.target.closest("tr").remove();
    updateRowNumbers();
    updateInvoiceTotal();
  }
});

// عرض العملاء //
function renderCustomerSelect() {
  const list = document.getElementById("customerDropdown");
  const input = document.getElementById("customerInput");
  const customerBalance = document.getElementById("customerBalance");

  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";

    // ===== بيع نقدي =====
    if ("بيع نقدي".includes(filter)) {
      const cashDiv = document.createElement("div");
      cashDiv.className = "dropdown-item";
      cashDiv.innerText = "بيع نقدي";

      cashDiv.onclick = () => {
        input.value = "بيع نقدي";
        input.dataset.index = "";
        customerBalance.value = "0.00";

        list.style.display = "none";
        updateGrandTotal();
      };

      list.appendChild(cashDiv);
    }

    // ===== العملاء =====
    customers
      .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = c.name;

        div.onclick = () => {
          input.value = c.name;
          input.dataset.index = i;

          const realBalance = getCustomerBalance(c.name);
          customerBalance.value = realBalance.toFixed(2);

          list.style.display = "none";
          updateGrandTotal();
        };

        list.appendChild(div);
      });
  }

  renderList();

  input.addEventListener("focus", () => {
    list.style.display = "block";
    renderList(input.value);
  });

  input.addEventListener("input", () => {
    list.style.display = "block";
    renderList(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.style.display = "none";
    }
  });
}

function renderProductSelect() {
  const list = document.getElementById("productDropdown");
  const input = document.getElementById("productInput");

  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";

    products
      .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = p.name;

        div.onclick = () => {
          addInvoiceItem(p); // يضيف المنتج للفاتورة
          input.value = "";
          list.style.display = "none";
        };

        list.appendChild(div);
      });
  }

  // أول تحميل
  renderList();

  // فتح القائمة عند التركيز
  input.addEventListener("focus", () => {
    list.style.display = "block";
    renderList(input.value);
  });

  // البحث أثناء الكتابة
  input.addEventListener("input", () => {
    list.style.display = "block";
    renderList(input.value);
  });

  // غلق عند الضغط خارجها
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.style.display = "none";
    }
  });
}

// == إضافة منتج ==//
function addInvoiceItem(product) {
  const tbody = document.getElementById("invoiceItems");

  // لو المنتج موجود بالفعل → زود الكمية
  const existingRow = [...tbody.querySelectorAll("tr")].find(
    (r) => r.cells[1].innerText === product.name,
  );

  if (existingRow) {
    const qtyInput = existingRow.querySelector(".itemQty");
    qtyInput.value = (+qtyInput.value || 0) + 1;
    updateInvoiceTotal();
    return;
  }

  const rowNumber = tbody.children.length + 1;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${rowNumber}</td>
    <td>${product.name}</td>
    <td><input type="number" class="itemQty" min="1" value="1"></td>
    <td><input type="number" class="itemPrice" value="${product.price}" readonly></td>
    <td><input type="number" class="itemTotal" readonly></td>
    <td><button type="button" class="btn-delete-item">حذف</button></td>
  `;

  tbody.appendChild(row);
  // ✅ ربط تحديث الحساب عند تغيير الكمية
  const qtyInput = row.querySelector(".itemQty");
  qtyInput.addEventListener("input", updateInvoiceTotal);
  qtyInput.addEventListener("change", updateInvoiceTotal);

  updateInvoiceTotal();
}

// == تحديث رقم الصف ==//
function updateRowNumbers() {
  const rows = document.querySelectorAll("#invoiceItems tr");
  rows.forEach((r, i) => (r.cells[0].innerText = i + 1));
}

// === الحسابات ===//
// == تحديث إجمالي الفاتورة ==//

function updateInvoiceTotal() {
  let total = 0;

  document.querySelectorAll("#invoiceItems tr").forEach((row) => {
    const qty = parseFloat(row.querySelector(".itemQty").value) || 0;
    const price = parseFloat(row.querySelector(".itemPrice").value) || 0;

    const rowTotal = qty * price;

    row.querySelector(".itemTotal").value = rowTotal.toFixed(2);
    total += rowTotal;
  });

  document.getElementById("invoiceTotal").value = total.toFixed(2);

  updateGrandTotal();
}

// == تحديث الإجمالي الكلي ==//
function updateGrandTotal() {
  const balance = +document.getElementById("customerBalance").value || 0;
  const invoiceTotal = +document.getElementById("invoiceTotal").value || 0;

  const grand = balance + invoiceTotal;

  document.getElementById("grandTotal").value = grand.toFixed(2);

  updateRemaining();
}

// == تحديث المتبقي بعد المدفوع ==//
function updateRemaining() {
  const grand = Number(document.getElementById("grandTotal").value) || 0;

  const paid = Number(document.getElementById("paidAmount").value) || 0;

  const remaining = grand - paid;

  document.getElementById("remainingAmount").value = remaining.toFixed(2);
}

// === حفظ الفاتورة ===//
function saveSale() {
  const container = document.getElementById("invoiceItems");

  // ===== تحقق من وجود منتجات ===== //
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل");
    return;
  }

  // ===== تحقق من الكميات ===== //
  if ([...container.querySelectorAll(".itemQty")].some((i) => +i.value <= 0)) {
    showModal("أدخل كميات صحيحة للمنتجات");
    return;
  }

  // ===== إذا كان تعديل فاتورة، استرجاع المخزون والرصيد القديم ===== //
  if (editInvoiceIndex !== null) {
    const oldInvoice = sales[editInvoiceIndex];

    // استرجاع الرصيد القديم //
    if (oldInvoice.customer !== "نقدي") {
      const cust = customers.find((c) => c.name === oldInvoice.customer);
      if (cust) {
        cust.balance -= oldInvoice.total - oldInvoice.paid;
      }
    }

    // استرجاع الكميات القديمة للمخزون //
    oldInvoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });

    // ===== خصم المدفوع القديم من الخزنة ===== //
    cash.income -= oldInvoice.paid;
  }

  // ===== جمع بيانات الفاتورة الجديدة ===== //
  let total = 0;
  let items = [];

  container.querySelectorAll("tr").forEach((row) => {
    const name = row.cells[1].innerText;
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;

    total += qty * price;

    items.push({ name, qty, price });
  });

  const paid = +document.getElementById("paidAmount").value || 0;
  const input = document.getElementById("customerInput");
  const cIndex = input.dataset.index ?? "";

  let customerName = "نقدي";
  let previousBalance = 0;
  let newBalance = total - paid;

  if (cIndex !== "") {
    const c = customers[cIndex];
    customerName = c.name;

    previousBalance = getCustomerBalance(customerName);
    newBalance = previousBalance + (total - paid);
  }

  // ===== خصم الكميات الجديدة من المخزون ===== //
  items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
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
    order:
      editInvoiceIndex !== null ? sales[editInvoiceIndex].order : Date.now(),
  };

  // حفظ أو تعديل الفاتورة //
  if (editInvoiceIndex !== null) {
    sales[editInvoiceIndex] = invoiceData;
    editInvoiceIndex = null;
  } else {
    sales.push(invoiceData);
  }

  // ===== إعادة تعيين النموذج ===== //
  container.innerHTML = "";
  const ci = document.getElementById("customerInput");
  ci.value = "";
  ci.dataset.index = "";
  document.getElementById("customerBalance").value = "";
  document.getElementById("invoiceTotal").value = "";
  document.getElementById("grandTotal").value = "";
  document.getElementById("paidAmount").value = "";
  document.getElementById("remainingAmount").value = "";

  saveData();
  updateBottomCashBalance();
  filterSalesByDate();
  showModal("تم حفظ الفاتورة بنجاح ✅", "نجاح");
}

// ==  عرض الفواتير في جدول ==//
function renderSales(data = sales) {
  const tbody = document.querySelector("#salesTable tbody");
  tbody.innerHTML = "";

  let sumTotal = 0;
  let sumPaid = 0;
  let sumRemain = 0;
  let visibleCount = 0; // 👈 عداد المبيعات الظاهرة

  data.forEach((inv, i) => {
    visibleCount++;

    sumTotal += +inv.total || 0;
    sumPaid += +inv.paid || 0;
    sumRemain += +inv.remaining || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${visibleCount}</td>
      <td>${inv.date}</td>
      <td>${inv.customer}</td>
      <td>${inv.total}</td>
      <td>${inv.paid}</td>
      <td>${inv.remaining}</td>
      <td>${inv.previousBalance}</td>
      <td>${inv.newBalance}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-edit" onclick="editInvoice(${inv.order})">تعديل</button>
          <button class="btn-delete" onclick="confirmDeleteInvoice(${inv.order})">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ===== لو مفيش مبيعات =====
  if (visibleCount === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="9" style="text-align:center; padding:20px; color:#fff;">
        لا توجد بيانات
      </td>
    `;
    tbody.appendChild(emptyRow);
    return; // 👈 مفيش إجمالي
  }

  // ===== صف الإجمالي =====
  const totalRow = document.createElement("tr");
  totalRow.style.background = "#0f172a";
  totalRow.style.fontWeight = "bold";
  totalRow.style.color = "#fff";

  totalRow.innerHTML = `
    <td colspan="3">الإجمالي</td>
    <td>${sumTotal.toFixed(2)}</td>
    <td>${sumPaid.toFixed(2)}</td>
    <td>${sumRemain.toFixed(2)}</td>
    <td colspan="3"></td>
  `;
  tbody.appendChild(totalRow);
}

// تعديل فاتورة //
function editInvoice(order) {
  const index = sales.findIndex((s) => s.order === order);
  if (index === -1) return;

  const invoice = sales[index];
  editInvoiceIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

  // ===== العميل =====
  const customerInput = document.getElementById("customerInput");
  const customerBalance = document.getElementById("customerBalance");

  customerInput.value = invoice.customer;

  const cIndex = customers.findIndex((c) => c.name === invoice.customer);

  if (cIndex !== -1) {
    customerInput.dataset.index = cIndex;
    customerBalance.value = invoice.previousBalance || 0;
  } else {
    customerInput.dataset.index = "";
    customerBalance.value = 0;
  }

  // ===== المنتجات =====
  invoice.items.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td></td>
      <td>${item.name}</td>
      <td><input type="number" class="itemQty" value="${item.qty}"></td>
      <td><input type="number" class="itemPrice" value="${item.price}" readonly></td>
      <td><input type="number" class="itemTotal" value="${item.qty * item.price}" readonly></td>
      <td><button type="button" class="btn-delete-item">❌</button></td>
    `;

    container.appendChild(row);

    row.querySelector(".itemQty").addEventListener("input", updateInvoiceTotal);

    row.querySelector(".btn-delete-item").onclick = () => {
      row.remove();
      updateRowNumbers();
      updateInvoiceTotal();
    };
  });

  updateRowNumbers();

  // ===== المدفوع والمتبقي =====
  document.getElementById("paidAmount").value = invoice.paid;
  document.getElementById("remainingAmount").value = invoice.remaining;

  updateInvoiceTotal();
  updateGrandTotal();
  updateRemaining();

  showModal("تم تحميل الفاتورة للتعديل ✏️", "تعديل فاتورة");

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("customerInput").focus();
}

function filterSalesByDate() {
  const fromVal = document.getElementById("fromDate").value;
  const toVal = document.getElementById("toDate").value;

  // تاريخ اليوم بصيغة yyyy-mm-dd
  const today = new Date().toISOString().slice(0, 10);

  // لو المستخدم لم يحدد تاريخ → استخدم اليوم
  const from = fromVal || today;
  const to = toVal || today;

  const filtered = sales.filter((invoice) => {
    if (!invoice.date) return false;

    const invDate = invoice.date.slice(0, 10); // تجاهل الوقت لو موجود

    return invDate >= from && invDate <= to;
  });

  renderSales(filtered);
}

function resetSalesFilter() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  renderSales();
}

function confirmDeleteInvoice(order) {
  showDeleteModal("هل أنت متأكد من حذف هذه الفاتورة؟", () => {
    const index = sales.findIndex((s) => s.order === order);
    if (index === -1) return;

    const invoice = sales[index];

    // رجوع المخزون
    invoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });

    // الخزنة
    cash.income -= invoice.paid;

    // حذف
    sales.splice(index, 1);

    saveData();
    updateBottomCashBalance();
    filterSalesByDate();

    // ✅ الحل هنا
    setTimeout(() => {
      showModal("تم حذف الفاتورة بنجاح ✅", "نجاح");
    }, 300);
  });
}

// =====  دالة البحث بإسم العميل ==== //
function searchSales() {
  const text = document.getElementById("searchSale").value.toLowerCase();

  const filtered = sales.filter((inv) =>
    inv.customer.toLowerCase().includes(text),
  );

  renderSales(filtered);
}

function showAllSales() {
  document.getElementById("searchSale").value = "";
  renderSales(sales);
}

// ===== مودال عام ==== //
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
