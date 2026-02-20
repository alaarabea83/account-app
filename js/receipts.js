// ======================= تحميل وحفظ =====================
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

// ======================= رصيد العميل الحالي =====================
function getCustomerCurrentBalance(customerName) {
    let c = customers.find((c) => c.name === customerName);
    if (!c) return 0;

    let balance = c.openingBalance || 0;

    sales
        .filter((s) => s.customer === customerName)
        .forEach((s) => (balance += s.total - s.paid));

    purchases
        .filter((p) => p.customer === customerName)
        .forEach((p) => (balance += p.paid - p.total));

    incomes
        .filter((i) => i.customer === customerName)
        .forEach((i) => (balance -= i.amount));

    expenses
        .filter((e) => e.customer === customerName)
        .forEach((e) => (balance += e.amount));

    receipts
        .filter((r) => r.customer === customerName)
        .forEach((r) => (balance -= r.amount));

    return balance;
}

function saveData() {
    localStorage.setItem("receipts", JSON.stringify(receipts));
    localStorage.setItem("cashEntries", JSON.stringify(cashEntries));
    localStorage.setItem("cash", JSON.stringify(cash));
}

// ======================= العملاء =====================
function renderCustomerSelect() {
    const sel = document.getElementById("receiptCustomer");
    const filterSel = document.getElementById("filterCustomer");

    const validCustomers = customers.filter(
        (c) => c.type !== "income" && c.type !== "expense"
    );

    sel.innerHTML =
        `<option value="" disabled selected>اختر الحساب</option>` +
        validCustomers
            .map((c) => `<option value="${c.name}">${c.name}</option>`)
            .join("");

    filterSel.innerHTML =
        `<option value="">الكل</option>` +
        validCustomers
            .map((c) => `<option value="${c.name}">${c.name}</option>`)
            .join("");
}

// ======================= إضافة المقبوض =====================
function addReceipt() {
    const title = document.getElementById("receiptTitle").value;
    const amount = +document.getElementById("receiptAmount").value;
    const customerName = document.getElementById("receiptCustomer").value;

    if (!title || !amount || !customerName) {
        showSuccessModal("أكمل البيانات", false);
        return;
    }

    const date = new Date().toISOString().slice(0, 10);

    const prevBalance = getCustomerCurrentBalance(customerName);
    const remaining = prevBalance - amount;

    // إضافة للخزنة
    cash.income = (cash.income || 0) + amount;

    const receipt = {
        date,
        customer: customerName,
        amount,
        title,
        prevBalance,
        remaining,
        order: Date.now(),
    };

    receipts.push(receipt);

    cashEntries.push({
        date,
        desc: title,
        customer: customerName,
        debit: amount,
        credit: 0,
        order: receipt.order,
    });

    saveData();
    renderReceipt();
    renderCashStatement();

    resetReceiptForm();   // 🔥 مهم جداً
    showSuccessModal("تم تسجيل القبض بنجاح ✔");
}

// ======================= عرض المقبوضات =====================
function renderReceipt(filterFn = null) {
    const tbody = document.querySelector("#receiptTable tbody");
    tbody.innerHTML = "";
    let totalAmount = 0;

    receipts
        .filter((r) => (filterFn ? filterFn(r) : true))
        .forEach((r) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.customer}</td>
        <td>${r.prevBalance.toFixed(2)}</td>
        <td>${r.amount.toFixed(2)}</td>
        <td>${r.remaining.toFixed(2)}</td>
        <td>${r.title}</td>
      `;
            tbody.appendChild(tr);

            totalAmount += r.amount;
        });

    // 🔥 صف الإجمالي
    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");

    totalRow.innerHTML = `
    <td colspan="3" style="text-align:center;font-weight:bold;">الإجمالي</td>
    <td style="font-weight:bold;color:#28a745;">${totalAmount.toFixed(2)}</td>
    <td></td>
    <td></td>
  `;

    tbody.appendChild(totalRow);
}

// ======================= مودال أخرى =====================
const titleSelect = document.getElementById("receiptTitle");
const modal = document.getElementById("titleModal");
const saveBtn = document.getElementById("saveTitleBtn");
const closeBtn = document.getElementById("closeModalBtn");
const otherInput = document.getElementById("otherTitleInput");

titleSelect.addEventListener("change", function () {
    if (this.value === "أخرى") {
        modal.style.display = "flex";
        otherInput.value = "";
        otherInput.focus();
    }
});
saveBtn.onclick = function () {
    let val = otherInput.value.trim();
    if (!val) return;
    let opt = document.createElement("option");
    opt.text = val;
    opt.value = val;
    titleSelect.add(opt);
    titleSelect.value = val;
    modal.style.display = "none";
};
closeBtn.onclick = function () {
    modal.style.display = "none";
    titleSelect.value = "";
};

// ======================= الرصيد السابق والمتبقي =====================
// عند اختيار العميل
function updateRemainingField() {
    const customerName = document.getElementById("receiptCustomer").value;
    const amount = +document.getElementById("receiptAmount").value || 0;

    if (!customerName) return;

    const prev = getCustomerCurrentBalance(customerName);

    document.getElementById("prevBalance").value = prev.toFixed(2);
    document.getElementById("remainingBalance").value =
        (prev - amount).toFixed(2);
}

document
    .getElementById("receiptCustomer")
    .addEventListener("change", updateRemainingField);

document
    .getElementById("receiptAmount")
    .addEventListener("input", updateRemainingField);

function resetReceiptForm() {
    document.getElementById("receiptTitle").value = "";
    document.getElementById("receiptAmount").value = "";
    document.getElementById("receiptCustomer").selectedIndex = 0;
    document.getElementById("prevBalance").value = "";
    document.getElementById("remainingBalance").value = "";
}

// ======================= فلترة الجدول =====================
document.getElementById("filterBtn").addEventListener("click", function () {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;
    const cust = document.getElementById("filterCustomer").value;
    renderReceipt((r) => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        if (cust && r.customer !== cust) return false;
        return true;
    });
});

// ======================= كشف الخزنة =====================
function renderCashStatement() {
    const tbody = document.querySelector("#cashStatementTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let cumulative = cash.opening || 0;
    cashEntries.sort(
        (a, b) =>
            new Date(a.date) - new Date(b.date) || (a.order || 0) - (b.order || 0),
    );
    cashEntries.forEach((e) => {
        cumulative += (e.debit || 0) - (e.credit || 0);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${e.date}</td><td>${e.customer}</td><td>${e.desc}</td><td>${(e.debit || 0).toFixed(2)}</td><td>${(e.credit || 0).toFixed(2)}</td><td>${cumulative.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });
}

// ======================= تحميل الصفحة =====================
window.onload = function () {
    loadData();
    renderCustomerSelect();
    renderReceipt();

    document.getElementById("addReceiptBtn").onclick = addReceipt;

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("fromDate").value = today;
    document.getElementById("toDate").value = today;
};

function showSuccessModal(message, success = true) {
    const modal = document.getElementById("successModal");
    const text = document.getElementById("successText");
    const icon = modal.querySelector(".check-icon");

    text.innerText = message;

    if (!success) {
        icon.style.background = "#dc3545";
    } else {
        icon.style.background = "#28a745";
    }

    modal.classList.add("active");

    setTimeout(() => {
        modal.classList.remove("active");
    }, 2000);
}
