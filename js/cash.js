
function setTodayDate(id){
  const today = new Date().toISOString().split("T")[0];
  document.getElementById(id).value = today;
}

window.onload = function () {
  loadData();
// 👇 إضافة تاريخ اليوم
  setTodayDate("fromDate");
  setTodayDate("toDate");

  renderCashCustomerFilter(); // عرض العملاء في فلتر كشف الخزنة
  renderCashStatement(); // عرض كشف الخزنة عند التحميل
  renderCash(); // تحديث الملخص

  document.getElementById("filterCashBtn").onclick = renderCashStatement;
};

// عرض العملاء في فلتر كشف الخزنة
function renderCashCustomerFilter() {
  const sel = document.getElementById("cashCustomerFilter");
  if (!sel) return;
  sel.innerHTML =
    `<option value="">إختر الحساب</option>` +
    customers
      .map((c) => `<option value="${c.name}">${c.name}</option>`)
      .join("");
}

function renderCashStatement() {
  const tbody = document.querySelector("#cashStatementTable tbody");
  if (!tbody) return;

  const from = document.getElementById("fromDate")?.value;
  const to = document.getElementById("toDate")?.value;
  const customerFilter = document.getElementById("cashCustomerFilter")?.value;

  tbody.innerHTML = "";

  const allEntries = [
    ...sales.map((s) => ({
      date: s.date,
      timestamp: s.order || 0,
      desc: "فاتورة مبيعات",
      debit: s.paid,
      credit: 0,
      customer: s.customer,
    })),

    ...purchases.map((p) => ({
      date: p.date,
      timestamp: p.order || 0,
      desc: "فاتورة مشتريات",
      debit: 0,
      credit: p.paid,
      customer: p.customer,
    })),

    ...incomes.map((i) => ({
      date: i.date,
      timestamp: i.order || 0,
      desc: i.title,
      debit: i.amount,
      credit: 0,
      customer: i.customer || "",
    })),

    ...expenses.map((e) => ({
      date: e.date,
      timestamp: e.order || 0,
      desc: e.title,
      debit: 0,
      credit: e.amount,
      customer: e.customer || "",
    })),
  ];

  // 🔥 الترتيب حسب التاريخ ثم وقت العملية
  allEntries.sort((a, b) => {
    const d = new Date(a.date) - new Date(b.date);
    if (d !== 0) return d;
    return (a.timestamp || 0) - (b.timestamp || 0);
  });

  let cumulativeBalance = cash.opening || 0;

  allEntries.forEach((e) => {
    cumulativeBalance += (e.debit || 0) - (e.credit || 0);
    e.cumulativeBalance = cumulativeBalance;
  });

  const filteredEntries = allEntries.filter((e) => {
    if (from && new Date(e.date) < new Date(from)) return false;
    if (to && new Date(e.date) > new Date(to)) return false;
    if (customerFilter && e.customer !== customerFilter) return false;
    return true;
  });

  filteredEntries.forEach((e) => {
    tbody.innerHTML += `<tr>
      <td>${e.date}</td>
      <td>${e.customer || "-"}</td>
      <td>${e.desc}</td>
      <td>${(e.debit || 0).toFixed(2)}</td>
      <td>${(e.credit || 0).toFixed(2)}</td>
      <td>${e.cumulativeBalance.toFixed(2)}</td>
    </tr>`;
  });

  let tfoot = tbody.parentElement.querySelector("tfoot");
  if (!tfoot) {
    tfoot = document.createElement("tfoot");
    tbody.parentElement.appendChild(tfoot);
  }

  tfoot.innerHTML = `<tr style="background-color:#111827;font-weight:bold;">
    <td colspan="5" style="text-align:right;">الرصيد الختامي</td>
    <td>${cumulativeBalance.toFixed(2)}</td>
  </tr>`;

  renderCash(cumulativeBalance);
}

function renderCash(finalBalance = null) {
  document.getElementById("cashOpening").innerText = (
    cash.opening || 0
  ).toFixed(2);
  document.getElementById("cashIncome").innerText = (cash.income || 0).toFixed(
    2,
  );
  document.getElementById("cashExpenses").innerText = (
    cash.expenses || 0
  ).toFixed(2);

  const final =
    finalBalance !== null
      ? finalBalance
      : (cash.opening || 0) + (cash.income || 0) - (cash.expenses || 0);
  document.getElementById("cashFinal").innerText = final.toFixed(2);
}
