// ===================== متغيرات =====================
let editInvoiceIndex = null;

// ===================== دوال مساعدة =====================

// حساب الرصيد الفعلي للعميل بناءً على المبيعات السابقة
function getCustomerBalance(customerName) {
  let balance = 0;

  sales.forEach((s) => {
    if (s.customer === customerName) {
      balance += (s.total || 0) - (s.paid || 0);
    }
  });

  return balance;
}

// ضبط التاريخ الحالي
function setTodayDate(id) {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById(id).value = today;
}

// ===================== عند تحميل الصفحة =====================
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderProductSelect();

  setTodayDate("fromDate");
  setTodayDate("toDate");

  filterSalesByDate();

  document.getElementById("saveInvoiceBtn").onclick = saveSale;

  const paidInput = document.getElementById("paidAmount");
  if (paidInput) {
    ["input", "keyup", "change"].forEach((evt) =>
      paidInput.addEventListener(evt, updateRemaining),
    );
  }

  document.getElementById("searchSale").addEventListener("input", searchSales);
  document
    .getElementById("fromDate")
    .addEventListener("change", filterSalesByDate);
  document
    .getElementById("toDate")
    .addEventListener("change", filterSalesByDate);

  // حذف منتج من الفاتورة
  document.getElementById("invoiceItems").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete-item")) {
      e.target.closest("tr").remove();
      updateRowNumbers();
      updateInvoiceTotal();
    }
  });
};

// ===================== العملاء =====================
function renderCustomerSelect() {
  const list = document.getElementById("customerDropdown");
  const input = document.getElementById("customerInput");
  const customerBalance = document.getElementById("customerBalance");
  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";

    customers
      .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = c.name;

        div.onclick = () => {
          input.value = c.name;
          input.dataset.index = i;

          // ===== حساب الرصيد الحالي للعميل =====
          let balance = c.openingBalance || 0;

          // مبيعات العميل
          balance += sales
            .filter((s) => s.customer === c.name)
            .reduce((acc, s) => acc + (s.total - s.paid), 0);

          // مشتريات العميل
          balance += purchases
            .filter((p) => p.customer === c.name)
            .reduce((acc, p) => acc + (p.paid - p.total), 0);

          // مصروفات العميل
          balance += expenses
            .filter((e) => e.customer === c.name)
            .reduce((acc, e) => acc + e.amount, 0);

          // إيرادات / سند قبض
          balance -= receipts
            .filter((r) => r.customer === c.name)
            .reduce((acc, r) => acc + r.amount, 0);

          customerBalance.value = balance.toFixed(2);

          // إخفاء القائمة بعد الاختيار
          list.style.display = "none";
          updateGrandTotal();
        };

        list.appendChild(div);
      });
  }

  // أول مرة عرض
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

  // إغلاق القائمة لو ضغط المستخدم خارجها
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.style.display = "none";
    }
  });
}

// ===================== المنتجات =====================
function renderProductSelect() {
  const list = document.getElementById("productDropdown");
  const input = document.getElementById("productInput");
  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";
    products
      .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach((p) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = p.name;
        div.onclick = () => {
          addInvoiceItem(p);
          input.value = "";
          list.style.display = "none";
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
    if (!input.contains(e.target) && !list.contains(e.target))
      list.style.display = "none";
  });
}

// ===================== إضافة منتج =====================
function addInvoiceItem(product) {
  const tbody = document.getElementById("invoiceItems");
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

  const qtyInput = row.querySelector(".itemQty");
  qtyInput.addEventListener("input", updateInvoiceTotal);
  qtyInput.addEventListener("change", updateInvoiceTotal);

  updateInvoiceTotal();
}

// ===================== تحديث رقم الصف =====================
function updateRowNumbers() {
  const rows = document.querySelectorAll("#invoiceItems tr");
  rows.forEach((r, i) => (r.cells[0].innerText = i + 1));
}

// ===================== تحديث الفاتورة =====================
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

// ===================== تحديث الإجمالي الكلي =====================
function updateGrandTotal() {
  const balance = +document.getElementById("customerBalance").value || 0;
  const invoiceTotal = +document.getElementById("invoiceTotal").value || 0;
  const grand = balance + invoiceTotal;
  document.getElementById("grandTotal").value = grand.toFixed(2);
  updateRemaining();
}

// ===================== تحديث المتبقي =====================
function updateRemaining() {
  const grand = +document.getElementById("grandTotal").value || 0;
  const paid = +document.getElementById("paidAmount").value || 0;
  document.getElementById("remainingAmount").value = (grand - paid).toFixed(2);
}

// ===================== حفظ أو تعديل الفاتورة =====================
function saveSale() {
  const container = document.getElementById("invoiceItems");
  if (!container.children.length) {
    showModal("أضف منتج واحد على الأقل");
    return;
  }
  if ([...container.querySelectorAll(".itemQty")].some((i) => +i.value <= 0)) {
    showModal("أدخل كميات صحيحة للمنتجات");
    return;
  }

  if (editInvoiceIndex !== null) {
    const oldInvoice = sales[editInvoiceIndex];
    if (oldInvoice.customer !== "نقدي") {
      const cust = customers.find((c) => c.name === oldInvoice.customer);
      if (cust) cust.balance -= oldInvoice.total - oldInvoice.paid;
    }
    oldInvoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });
    cash.income -= oldInvoice.paid;
  }

  let total = 0,
    items = [];
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

  if (editInvoiceIndex !== null) {
    sales[editInvoiceIndex] = invoiceData;
    editInvoiceIndex = null;
  } else sales.push(invoiceData);

  // إعادة تعيين النموذج
  container.innerHTML = "";
  input.value = "";
  input.dataset.index = "";
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

// ===================== عرض الفواتير =====================
function renderSales(data = sales) {
  const tbody = document.querySelector("#salesTable tbody");
  tbody.innerHTML = "";

  let sumTotal = 0;
  let sumPaid = 0;
  let sumRemain = 0;
  let visibleCount = 0; // عداد الفواتير الظاهرة

  data.forEach((inv) => {
    visibleCount++;

    sumTotal += +inv.total || 0;
    sumPaid += +inv.paid || 0;
    sumRemain += +inv.remaining || 0;

    // ===== حساب الرصيد السابق الصحيح =====
    let previousBalance = 0;
    if (inv.customer && inv.customer !== "نقدي") {
      const customer = customers.find((c) => c.name === inv.customer);
      if (customer) {
        // اجمع كل العمليات السابقة قبل هذه الفاتورة
        previousBalance = customer.openingBalance || 0;

        // مبيعات قبل هذه الفاتورة
        sales
          .filter((s) => s.customer === inv.customer && s.order < inv.order)
          .forEach((s) => {
            previousBalance += s.total - s.paid;
          });

        // مشتريات قبل هذه الفاتورة
        purchases
          .filter((p) => p.customer === inv.customer && p.order < inv.order)
          .forEach((p) => {
            previousBalance += p.paid - p.total;
          });

        // مصروفات قبل هذه الفاتورة
        expenses
          .filter((e) => e.customer === inv.customer && e.order < inv.order)
          .forEach((e) => {
            previousBalance += e.amount;
          });

        // إيرادات قبل هذه الفاتورة
        receipts
          .filter((r) => r.customer === inv.customer && r.order < inv.order)
          .forEach((r) => {
            previousBalance -= r.amount;
          });
      }
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${visibleCount}</td>
      <td>${inv.date}</td>
      <td>${inv.customer}</td>
      <td>${inv.total}</td>
      <td>${inv.paid}</td>
      <td>${inv.remaining}</td>
      <td>${previousBalance.toFixed(2)}</td>
      <td>${(previousBalance + (inv.total - inv.paid)).toFixed(2)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-edit" onclick="editInvoice(${inv.order})">تعديل</button>
          <button class="btn-delete" onclick="confirmDeleteInvoice(${inv.order})">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ===== لو مفيش فواتير =====
  if (visibleCount === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="9" style="text-align:center; padding:20px; color:#fff;">
        لا توجد بيانات
      </td>
    `;
    tbody.appendChild(emptyRow);
    return;
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

// ===================== تعديل الفاتورة =====================
function editInvoice(order) {
  const index = sales.findIndex((s) => s.order === order);
  if (index === -1) return;

  const invoice = sales[index];
  editInvoiceIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";

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
  document.getElementById("paidAmount").value = invoice.paid;
  document.getElementById("remainingAmount").value = invoice.remaining;
  updateInvoiceTotal();
  updateGrandTotal();
  updateRemaining();

  showModal("تم تحميل الفاتورة للتعديل ✏️", "تعديل فاتورة");
  window.scrollTo({ top: 0, behavior: "smooth" });
  customerInput.focus();
}

// ===================== فلترة التاريخ =====================
function filterSalesByDate() {
  const fromVal = document.getElementById("fromDate").value;
  const toVal = document.getElementById("toDate").value;
  const today = new Date().toISOString().slice(0, 10);
  const from = fromVal || today;
  const to = toVal || today;

  const filtered = sales.filter((inv) => {
    if (!inv.date) return false;
    const invDate = inv.date.slice(0, 10);
    return invDate >= from && invDate <= to;
  });

  renderSales(filtered);
}

function resetSalesFilter() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  renderSales();
}

// ===================== حذف فاتورة =====================
function confirmDeleteInvoice(order) {
  showDeleteModal("هل أنت متأكد من حذف هذه الفاتورة؟", () => {
    const index = sales.findIndex((s) => s.order === order);
    if (index === -1) return;

    const invoice = sales[index];
    invoice.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
      if (product) product.qty += item.qty;
    });
    cash.income -= invoice.paid;
    sales.splice(index, 1);
    saveData();
    updateBottomCashBalance();
    filterSalesByDate();
    setTimeout(() => showModal("تم حذف الفاتورة بنجاح ✅", "نجاح"), 300);
  });
}

// ===================== البحث =====================
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

// ===================== مودال حذف =====================
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
