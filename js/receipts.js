// ======================= تحميل وحفظ البيانات =====================
function loadData() {
    const c = localStorage.getItem("customers");
    const r = localStorage.getItem("receipts");
    const ce = localStorage.getItem("cashEntries");
    const ca = localStorage.getItem("cash");
    customers = c ? JSON.parse(c) : [];
    receipts = r ? JSON.parse(r) : [];
    cashEntries = ce ? JSON.parse(ce) : [];
    cash = ca ? JSON.parse(ca) : { opening: 0, income: 0, expenses: 0 };
}

function saveData() {
    localStorage.setItem("customers", JSON.stringify(customers));
    localStorage.setItem("receipts", JSON.stringify(receipts));
    localStorage.setItem("cashEntries", JSON.stringify(cashEntries));
    localStorage.setItem("cash", JSON.stringify(cash));
}

// ======================= حساب الرصيد الحالي للعميل =====================
function getCustomerCurrentBalance(customerName) {
    const c = customers.find((c) => c.name === customerName);
    if (!c) return 0;

    let balance = c.openingBalance || 0;

    // مبيعات العميل
    sales
        .filter((s) => s.customer === customerName)
        .forEach((s) => balance += (s.total || 0) - (s.paid || 0));

    // مشتريات العميل
    purchases
        .filter((p) => p.customer === customerName)
        .forEach((p) => balance += (p.paid || 0) - (p.total || 0));

    // مصروفات العميل
    expenses
        .filter((e) => e.customer === customerName)
        .forEach((e) => balance += e.amount);

    // إيرادات / سندات قبض
    receipts
        .filter((r) => r.customer === customerName)
        .forEach((r) => balance -= r.amount);

    return balance;
}

// ======================= العملاء =====================
function renderCustomerSelect() {
    const sel = document.getElementById("receiptCustomer");
    const filterSel = document.getElementById("filterCustomer");

    const validCustomers = customers.filter(c => c.type !== "income" && c.type !== "expense");

    sel.innerHTML = `<option value="" disabled selected>اختر الحساب</option>` +
        validCustomers.map(c => `<option value="${c.name}">${c.name}</option>`).join("");

    filterSel.innerHTML = `<option value="">الكل</option>` +
        validCustomers.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
}

// ======================= تحديث الرصيد السابق والمتبقي =====================
function updateRemainingField() {
    const customerName = document.getElementById("receiptCustomer").value;
    const amount = +document.getElementById("receiptAmount").value || 0;

    if (!customerName) {
        document.getElementById("prevBalance").value = "";
        document.getElementById("remainingBalance").value = "";
        return;
    }

    // 🔹 إعادة تحميل البيانات من localStorage للتأكد من الحصول على أحدث العمليات
    loadData();

    // 🔹 حساب الرصيد الحالي للعميل بناءً على كل العمليات الفعلية
    let balance = 0;

    const c = customers.find(c => c.name === customerName);
    if (c) balance = c.openingBalance || 0;

    // المبيعات
    sales.filter(s => s.customer === customerName)
         .forEach(s => balance += (s.total || 0) - (s.paid || 0));

    // المشتريات
    purchases.filter(p => p.customer === customerName)
             .forEach(p => balance += (p.paid || 0) - (p.total || 0));

    // المصروفات
    expenses.filter(e => e.customer === customerName)
            .forEach(e => balance += e.amount || 0);

    // المقبوضات / الإيرادات
    receipts.filter(r => r.customer === customerName)
            .forEach(r => balance -= r.amount || 0);

    // 🔹 تحديث الحقول
    document.getElementById("prevBalance").value = balance.toFixed(2);
    document.getElementById("remainingBalance").value = (balance - amount).toFixed(2);
}

// ======================= إضافة أو تعديل قبض =====================
let editingReceiptOrder = null;

function addOrEditReceipt() {
    const title = document.getElementById("receiptTitle").value.trim();
    const amount = +document.getElementById("receiptAmount").value;
    const customerName = document.getElementById("receiptCustomer").value;

    if (!title || !amount || !customerName) {
        showSuccessModal("أكمل البيانات", false);
        return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const order = editingReceiptOrder || Date.now();

    // لو تعديل، نقص المبلغ القديم من الخزنة
    if (editingReceiptOrder) {
        const oldIndex = receipts.findIndex(r => r.order === editingReceiptOrder);
        if (oldIndex !== -1) cash.income -= receipts[oldIndex].amount;
    }

    const receipt = {
        date,
        customer: customerName,
        amount,
        title,
        order,
    };

    if (editingReceiptOrder) {
        const idx = receipts.findIndex(r => r.order === editingReceiptOrder);
        receipts[idx] = receipt;
        editingReceiptOrder = null;
    } else {
        receipts.push(receipt);
    }

    // تحديث الخزنة
    cash.income += amount;
    cashEntries.push({
        date,
        desc: title,
        customer: customerName,
        debit: amount,
        credit: 0,
        order,
    });

    saveData();
    renderReceipt();
    renderCashStatement();
    resetReceiptForm();
    showSuccessModal(editingReceiptOrder ? "تم تعديل القبض بنجاح ✔" : "تم تسجيل القبض بنجاح ✔");
}

// ======================= عرض المقبوضات =====================
function renderReceipt(filterFn = null) {
    const tbody = document.querySelector("#receiptTable tbody");
    tbody.innerHTML = "";
    let totalAmount = 0;
    let serial = 1;

    receipts
      .filter(r => filterFn ? filterFn(r) : true)
      .sort((a, b) => a.order - b.order)
      .forEach(r => {
          const prevBalance = getCustomerCurrentBalance(r.customer, r.order);
          const remaining = prevBalance - r.amount;

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${serial}</td> <!-- العمود التسلسلي -->
            <td>${r.date}</td>
            <td>${r.customer}</td>
            <td>${r.amount.toFixed(2)}</td>
            <td>${prevBalance.toFixed(2)}</td>
            <td>${remaining.toFixed(2)}</td>
            <td>${r.title}</td>
            <td>
              <button class="btn-edit" onclick="editReceipt(${r.order})">تعديل</button>
              <button class="btn-delete" onclick="confirmDeleteReceipt(${r.order})">حذف</button>
            </td>
          `;
          tbody.appendChild(tr);
          totalAmount += r.amount;
          serial++;
      });

    if (serial === 1) { // لا توجد بيانات
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="8" style="text-align:center; padding:20px; color:#fff;">لا توجد بيانات</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");
    totalRow.innerHTML = `
        <td colspan="3" style="text-align:center;font-weight:bold;">الإجمالي</td>
        <td style="font-weight:bold;color:#28a745;">${totalAmount.toFixed(2)}</td>
        <td colspan="4"></td>
    `;
    tbody.appendChild(totalRow);
}

// ======================= كشف الخزنة =====================
function renderCashStatement() {
    const tbody = document.querySelector("#cashStatementTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let cumulative = cash.opening || 0;
    cashEntries.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.order || 0) - (b.order || 0));
    cashEntries.forEach(e => {
        cumulative += (e.debit || 0) - (e.credit || 0);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${e.date}</td><td>${e.customer}</td><td>${e.desc}</td><td>${(e.debit || 0).toFixed(2)}</td><td>${(e.credit || 0).toFixed(2)}</td><td>${cumulative.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });
}

// ======================= إعادة ضبط النموذج =====================
function resetReceiptForm() {
    document.getElementById("receiptTitle").value = "";
    document.getElementById("receiptAmount").value = "";
    document.getElementById("receiptCustomer").selectedIndex = 0;
    document.getElementById("prevBalance").value = "";
    document.getElementById("remainingBalance").value = "";
    editingReceiptOrder = null;
}

// ======================= تعديل قبض =====================
function editReceipt(order) {
    const r = receipts.find(r => r.order === order);
    if (!r) return;

    document.getElementById("receiptCustomer").value = r.customer;
    document.getElementById("receiptTitle").value = r.title;
    document.getElementById("receiptAmount").value = r.amount;

    editingReceiptOrder = order;
    updateRemainingField(order);
}

// ======================= حذف قبض =====================
function confirmDeleteReceipt(order) {
    showDeleteModal("هل أنت متأكد من حذف هذا القبض؟", () => {
        const index = receipts.findIndex(r => r.order === order);
        if (index === -1) return;

        cash.income -= receipts[index].amount;
        receipts.splice(index, 1);

        saveData();
        renderReceipt();
        renderCashStatement();
        setTimeout(() => showSuccessModal("تم حذف القبض بنجاح ✅"), 300);
    });
}

// ======================= مودال حذف =====================
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

function showSuccessModal(message, success = true) {
    const modal = document.getElementById("successModal");
    const text = document.getElementById("successText");
    const icon = modal.querySelector(".check-icon");

    text.innerText = message;
    icon.style.background = success ? "#28a745" : "#dc3545";
    modal.classList.add("active");

    setTimeout(() => {
        modal.classList.remove("active");
    }, 2000);
}

function closeModal() {
    document.getElementById("appModal").style.display = "none";
    deleteCallback = null;
}

// ======================= حدث تحميل الصفحة =====================
window.onload = function () {
    loadData();
    renderCustomerSelect();
    renderReceipt();

    document.getElementById("addReceiptBtn").onclick = addOrEditReceipt;

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("fromDate").value = today;
    document.getElementById("toDate").value = today;

    document.getElementById("receiptCustomer").addEventListener("change", () => updateRemainingField(editingReceiptOrder));
    document.getElementById("receiptAmount").addEventListener("input", () => updateRemainingField(editingReceiptOrder));
    
    document.getElementById("filterBtn").addEventListener("click", function () {
        const from = document.getElementById("fromDate").value;
        const to = document.getElementById("toDate").value;
        const cust = document.getElementById("filterCustomer").value;
        renderReceipt(r => {
            if (from && r.date < from) return false;
            if (to && r.date > to) return false;
            if (cust && r.customer !== cust) return false;
            return true;
        });
    });
};