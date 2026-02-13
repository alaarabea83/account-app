let editInvoiceIndex = null;

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
    ["input","keyup","change"].forEach(evt=>{
      paidInput.addEventListener(evt,updateRemaining);
    });
  }

  // 🔍 البحث
  document
    .getElementById("searchSale")
    .addEventListener("input", searchSales);

  // فلترة التاريخ
  document
    .getElementById("fromDate")
    .addEventListener("change", filterSalesByDate);

  document
    .getElementById("toDate")
    .addEventListener("change", filterSalesByDate);
};

// عرض العملاء //
function renderCustomerSelect() {
  const list = document.getElementById("customerDropdown");
  const input = document.getElementById("customerInput");

  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";

    // بيع نقدي
    if ("بيع نقدي".includes(filter)) {
      const cashDiv = document.createElement("div");
      cashDiv.className = "dropdown-item";
      cashDiv.innerText = "بيع نقدي";

      cashDiv.onclick = () => {
        input.value = "بيع نقدي";
        input.dataset.index = "";
        customerBalance.value = 0;
        list.style.display = "none";
        updateGrandTotal();
      };

      list.appendChild(cashDiv);
    }

    // العملاء
    customers
      .filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase())
      )
      .forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = c.name;

        div.onclick = () => {
          input.value = c.name;
          input.dataset.index = i;
          customerBalance.value = c.balance || 0;
          list.style.display = "none";
          updateGrandTotal();
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

function renderProductSelect() {
  const list = document.getElementById("productDropdown");
  const input = document.getElementById("productInput");

  if (!list || !input) return;

  function renderList(filter = "") {
    list.innerHTML = "";

    products
      .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
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
    r => r.cells[1].innerText === product.name
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
    <td><input type="number" class="itemQty" placeholder="الكمية" min="1" value=""></td>
    <td><input type="number" class="itemPrice" value="${product.price}" readonly></td>
    <td><input type="number" class="itemTotal" readonly></td>
    <td><button type="button" class="btn-delete-item">❌</button></td>
  `;

  tbody.appendChild(row);

  row.querySelector(".itemQty")
     .addEventListener("input", updateInvoiceTotal);

  row.querySelector(".btn-delete-item").onclick = () => {
    row.remove();
    updateRowNumbers();
    updateInvoiceTotal();
  };

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
    const qty = +row.querySelector(".itemQty").value || 0;
    const price = +row.querySelector(".itemPrice").value || 0;

    total += qty * price;
    row.querySelector(".itemTotal").value = (qty * price).toFixed(2);
  });

  document.getElementById("invoiceTotal").value =
    total.toFixed(2);

  updateGrandTotal();
  updateRemaining(); // فقط هنا
}

// == تحديث الإجمالي الكلي ==//
function updateGrandTotal() {
  const balance =
    Number(document.getElementById("customerBalance").value) || 0;

  const invoiceTotal =
    Number(document.getElementById("invoiceTotal").value) || 0;

  const grand = balance + invoiceTotal;

  document.getElementById("grandTotal").value =
    grand.toFixed(2);
}


// == تحديث المتبقي بعد المدفوع ==//
function updateRemaining() {
  const grand = Number(
    document.getElementById("grandTotal").value
  ) || 0;

  const paid = Number(
    document.getElementById("paidAmount").value
  ) || 0;

  const remaining = grand - paid;

  document.getElementById("remainingAmount").value =
    remaining.toFixed(2);
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
    previousBalance = c.balance;
    newBalance = c.balance + (total - paid);
    customers[cIndex].balance = newBalance;
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

  // صف الإجمالي  //
  tbody.innerHTML += `
    <tr style="background:#111827;color:#fbbf24;font-weight:bold">
      <td colspan="3">الإجمالي</td>
      <td>${sumTotal}</td>
      <td>${sumPaid}</td>
      <td>${sumRemain}</td>
      <td colspan="3"></td>
    </tr>`;
}

// تعديل فاتورة //
function editInvoice(index) {
  const invoice = sales[index];
  editInvoiceIndex = index;

  const container = document.getElementById("invoiceItems");
  container.innerHTML = "";



  // تعبئة المنتجات //
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

// حذف فاتورة //
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

// =====  دالة البحث بإسم العميل ==== //
function searchSales() {
  const text = document
    .getElementById("searchSale")
    .value
    .toLowerCase();

  const filtered = sales.filter(inv =>
    inv.customer.toLowerCase().includes(text)
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