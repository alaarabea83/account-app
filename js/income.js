window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderIncome();

  document.getElementById("addIncomeBtn").onclick = addIncome;
};

function renderCustomerSelect() {
  const sel = document.getElementById("incomeCustomer");
  if (!sel) return;
  sel.innerHTML =
    `<option value="" disabled selected>اختر الحساب</option>` +
    `<option value="">نقدي بدون عميل</option>` +
    customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");
}

function addIncome() {
  const title = document.getElementById("incomeTitle").value.trim();
  const amount = +document.getElementById("incomeAmount").value;
  const customerIndex = document.getElementById("incomeCustomer").value;
  const customer = customerIndex !== "" ? customers[customerIndex] : null;

  if (!title || !amount) {
    showModal("من فضلك أكمل جميع البيانات");
    return;
  }

  if (customer) customer.balance -= amount;
  cash.income += amount;

  const newOrder =
    sales.length + purchases.length + incomes.length + expenses.length + 1;

  incomes.push({
    title,
    amount,
    customer: customer ? customer.name : "نقدي",
    date: new Date().toLocaleDateString(),
    order: newOrder,
  });

  document.getElementById("incomeTitle").value = "";
  document.getElementById("incomeAmount").value = "";
  document.getElementById("incomeCustomer").value = "";

  saveData();
  updateBottomCashBalance();
  renderIncome();
}

function renderIncome() {
  const tbody = document.querySelector("#incomeTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  incomes.sort((a, b) => (a.order || 0) - (b.order || 0));

  incomes.forEach((i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i.title}</td><td>${i.amount}</td><td>${i.customer}</td><td>${i.date}</td>`;
    tbody.appendChild(tr);
  });
}

function showModal(message, title = "تنبيه") {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerText = message;
  document.getElementById("appModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("appModal").style.display = "none";
}

//عند اختيار بند اخري فى بيان المقبوضات
document.addEventListener("DOMContentLoaded", function () {
  const titleSelect = document.getElementById("incomeTitle");
  const modal = document.getElementById("titleModal");
  const saveBtn = document.getElementById("saveTitleBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const otherInput = document.getElementById("otherTitleInput");

  if (!titleSelect) return;

  // فتح المودال عند اختيار "أخرى"
  titleSelect.addEventListener("change", function () {
    if (this.value === "other") {
      modal.style.display = "flex";
      otherInput.value = "";
      otherInput.focus();
    }
  });

  // حفظ البيان الجديد
  saveBtn.onclick = function () {
    let val = otherInput.value.trim();
    if (!val) return;

    // إضافة البيان للقائمة
    let opt = document.createElement("option");
    opt.text = val;
    opt.value = val;
    titleSelect.add(opt);

    // تحديده
    titleSelect.value = val;

    // إغلاق المودال
    modal.style.display = "none";
  };

  // إغلاق المودال بدون حفظ
  closeBtn.onclick = function () {
    modal.style.display = "none";
    titleSelect.value = "";
  };
});
