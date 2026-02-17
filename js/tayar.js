// عناصر
const dName = document.getElementById("dName"),
    dPhone = document.getElementById("dPhone"),
    opening = document.getElementById("opening");
const drv = document.getElementById("drv"),
    driversTable = document.getElementById("driversTable");
const cName = document.getElementById("cName"),
    addr = document.getElementById("addr"),
    amt = document.getElementById("amt");
const ordersTable = document.getElementById("ordersTable"),
    filterDate = document.getElementById("filterDate");
const dOrders = document.getElementById("dOrders"),
    dCash = document.getElementById("dCash"),
    dSafe = document.getElementById("dSafe");
const reportTable = document.getElementById("reportTable");

let DB = JSON.parse(
    localStorage.V12DB ||
    `{"drivers":[],"orders":[],"cash":0,"clients":[]}`,
);

// ... مودالات وكده ...

// ==================== حساب رصيد الطيار ====================
function updateDriverBalances() {
    DB.drivers.forEach((d) => {
        d.balance = d.opening || 0; // نبدأ بالرصيد الابتدائي
    });

    DB.orders.forEach((o) => {
        if (o.driver !== null && !o.canceled) {
            DB.drivers[o.driver].balance += o.amount - o.paid;
        }
    });
}

const modal = document.getElementById("modal");
function showModal(text) {
    document.getElementById("modalText").innerText = text;
    modal.style.display = "flex";
}
function show(id) {
    document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}
function save() {
    localStorage.V12DB = JSON.stringify(DB);
    updateDash();
}

// مودالات الطيارين
const editDriverModal = document.getElementById("editDriverModal");
const deleteDriverModal = document.getElementById("deleteDriverModal");
const accountDriverModal = document.getElementById("accountDriverModal");
let editIndex = null,
    deleteIndex = null;

// ==================== DRIVERS ====================
function renderDrivers() {
    updateDriverBalances();
    driversTable.innerHTML = "";

    let totalBalance = 0; // لمجموع الرصيد الحالي

    DB.drivers.forEach((d, i) => {
        totalBalance += d.balance;
        driversTable.innerHTML += `<tr>
      <td>${d.name}</td>
      <td>${d.phone}</td>
      <td class="${d.balance >= 0 ? "green" : "red"}">${d.balance}</td>
      <td><button onclick="openEditDriverModal(${i})">تعديل</button></td>
      <td><button onclick="openDeleteDriverModal(${i})">حذف</button></td>
      <td><button onclick="showAccount(${i})">كشف حساب</button></td>
    </tr>`;
    });

    // صف الإجمالي
    driversTable.innerHTML += `<tr style="font-weight:bold; background:#f0f0f0; color:#111;">
    <td colspan="2">الإجمالي</td>
    <td>${totalBalance}</td>
    <td colspan="3"></td>
  </tr>`;

    fillDrv();
}

function fillDrv() {
    drv.innerHTML = '<option value="">اختر الطيار</option>';
    DB.drivers.forEach((d, j) => {
        drv.innerHTML += `<option value="${j}">${d.name}</option>`;
    });
}

// إضافة طيار
document.getElementById("addDriverBtn").onclick = function () {
    if (!dName.value || !dPhone.value) {
        showModal("اكمل بيانات الطيار");
        return;
    }
    let openingVal = Number(opening.value) || 0;
    DB.drivers.push({
        name: dName.value,
        phone: dPhone.value,
        balance: openingVal, // هذا سيتم إعادة حسابه لاحقًا
        opening: openingVal, // هذا هو الرصيد الابتدائي الحقيقي
    });

    if (openingVal > 0) DB.cash += openingVal;
    dName.value = "";
    dPhone.value = "";
    opening.value = "";
    save();
    renderDrivers();
    showModal("تم إضافة الطيار بنجاح ✅");
};

// تعديل الطيار
function openEditDriverModal(i) {
    editIndex = i;
    document.getElementById("editName").value = DB.drivers[i].name;
    document.getElementById("editPhone").value = DB.drivers[i].phone;
    document.getElementById("editBalance").value = DB.drivers[i].balance;
    editDriverModal.style.display = "flex";
}

document.getElementById("saveEditDriver").onclick = function () {
    let d = DB.drivers[editIndex];
    d.name = document.getElementById("editName").value;
    d.phone = document.getElementById("editPhone").value;
    d.opening = Number(document.getElementById("editBalance").value); // ← الآن يغير الرصيد الابتدائي فقط
    save();
    updateDriverBalances();
    renderDrivers();
    editDriverModal.style.display = "none";
    showModal("تم تعديل بيانات الطيار بنجاح ✅");
};

// حذف الطيار
function openDeleteDriverModal(i) {
    deleteIndex = i;
    deleteDriverModal.style.display = "flex";
}
document.getElementById("confirmDeleteDriver").onclick = function () {
    let idx = deleteIndex;
    DB.orders.forEach((o) => {
        if (o.driver === idx) o.driver = null;
    });
    DB.drivers.splice(idx, 1);
    save();
    renderDrivers();
    deleteDriverModal.style.display = "none";
    showModal("تم حذف الطيار بنجاح ✅");
};

// كشف حساب الطيار
function showAccount(i) {
    let drv = DB.drivers[i];
    let content = "<b>الأوردرات:</b><br>";
    DB.orders.forEach((o) => {
        if (o.driver === i) {
            content += `رقم:${o.orderNum} | عميل:${o.customer} | مبلغ:${o.amount} | حالة:${o.status} | مستلم:${o.paid}<br>`;
        }
    });
    content += `<br><b>رصيد الطيار الحالي: ${drv.balance}</b>`;
    document.getElementById("accountContent").innerHTML = content;
    accountDriverModal.style.display = "flex";
}

// ==================== ORDERS ====================
document.getElementById("addOrderBtn").onclick = function () {
    if (!cName.value || !addr.value || !amt.value || !drv.value) {
        showModal("اكمل بيانات الأوردر");
        return;
    }
    if (!DB.clients.includes(cName.value)) DB.clients.push(cName.value);
    let orderNumber = DB.orders.length
        ? Math.max(...DB.orders.map((o) => o.orderNum)) + 1
        : 1;
    let o = {
        orderNum: orderNumber,
        customer: cName.value,
        address: addr.value,
        amount: Number(amt.value),
        driver: Number(drv.value),
        status: "خرج للتوصيل",
        paid: 0,
        canceled: false,
        date: new Date().toISOString(),
    };
    DB.orders.push(o);
    DB.drivers[o.driver].balance += o.amount;
    cName.value = "";
    addr.value = "";
    amt.value = "";
    drv.value = "";
    save();
    renderOrders();
    showModal("تم إضافة الأوردر بنجاح ✅");
};

function renderOrders() {
    ordersTable.innerHTML = "";
    let date = filterDate.value || new Date().toISOString().slice(0, 10);

    let totalAmount = 0;
    let totalPaid = 0;

    DB.orders.forEach((o) => {
        if (o.date.startsWith(date)) {
            totalAmount += o.amount;
            totalPaid += o.paid;
            ordersTable.innerHTML += `<tr>
        <td>${o.orderNum}</td>
        <td>${o.customer}</td>
        <td>${o.address}</td>
        <td>${o.driver !== null ? DB.drivers[o.driver]?.name : "-"}</td>
        <td>${o.amount}</td>
        <td>
          <select onchange="updateStatus(${o.orderNum},this.value)">
            <option value="خرج للتوصيل" ${o.status === "خرج للتوصيل" ? "selected" : ""}>خرج للتوصيل</option>
            <option value="تم التسليم" ${o.status === "تم التسليم" ? "selected" : ""}>تم التسليم</option>
            <option value="لم يتم التسليم" ${o.status === "لم يتم التسليم" ? "selected" : ""}>لم يتم التسليم</option>
          </select>
        </td>
        <td><input type="number" value="${o.paid}" onchange="updatePaid(${o.orderNum},this.value)"></td>
        <td><button onclick="updateOrder(${o.orderNum})">تحديث</button></td>
        <td><button onclick="cancelOrder(${o.orderNum})" style="background:#EF4444;">إلغاء</button></td>
      </tr>`;
        }
    });

    // صف الإجمالي
    ordersTable.innerHTML += `<tr style="font-weight:bold; background:#f0f0f0; color:#111;">
    <td colspan="4">الإجمالي</td>
    <td>${totalAmount}</td>
    <td></td>
    <td>${totalPaid}</td>
    <td colspan="2"></td>
  </tr>`;
}

function updateStatus(num, newStatus) {
    let o = DB.orders.find((x) => x.orderNum === num);
    if (o) {
        o.status = newStatus;
        save();
        renderOrders();
        showModal("تم تحديث حالة الأوردر ✅");
    }
}
function updatePaid(num, value) {
    let o = DB.orders.find((x) => x.orderNum === num);
    if (o) {
        o.paid = Number(value); // نحدث قيمة المستلم فقط
        save();
        renderDrivers(); // ← هيحسب الرصيد تلقائيًا
        renderOrders();
        updateDash();
        showModal("تم تحديث المستلم ✅");
    }
}

function cancelOrder(num) {
    let o = DB.orders.find((x) => x.orderNum === num);
    if (o && !o.canceled) {
        o.canceled = true;
        if (o.driver !== null) DB.drivers[o.driver].balance -= o.amount;
        DB.cash -= o.paid;
        save();
        renderOrders();
        showModal("تم إلغاء الأوردر وإلغاء أثره المالي ✅");
    }
}

// ==================== DASHBOARD ====================
function updateDash() {
    let today = new Date().toISOString().slice(0, 10);
    dOrders.innerText = DB.orders.filter(
        (o) => o.date.startsWith(today) && !o.canceled,
    ).length;
    dCash.innerText = DB.orders
        .filter((o) => o.date.startsWith(today) && !o.canceled)
        .reduce((a, b) => a + b.paid, 0);
    dSafe.innerText = DB.cash;
}

// ==================== REPORTS ====================
function dailyReport() {
    let date =
        document.getElementById("rDate").value ||
        new Date().toISOString().slice(0, 10);
    reportTable.innerHTML = "";
    DB.orders.forEach((o) => {
        if (o.date.startsWith(date) && !o.canceled) {
            reportTable.innerHTML += `<tr>
<td>${o.orderNum}</td>
<td>${o.customer}</td>
<td>${o.address}</td>
<td>${o.driver !== null ? DB.drivers[o.driver]?.name : "-"}</td>
<td>${o.amount}</td>
<td>${o.status}</td>
<td>${o.paid}</td>
</tr>`;
        }
    });
    showModal(`تم إنشاء تقرير يوم ${date} ✅`);
}

function monthlyReport() {
    let date =
        document.getElementById("rDate").value ||
        new Date().toISOString().slice(0, 7);
    reportTable.innerHTML = "";
    DB.orders.forEach((o) => {
        if (o.date.startsWith(date) && !o.canceled) {
            reportTable.innerHTML += `<tr>
<td>${o.orderNum}</td>
<td>${o.customer}</td>
<td>${o.address}</td>
<td>${o.driver !== null ? DB.drivers[o.driver]?.name : "-"}</td>
<td>${o.amount}</td>
<td>${o.status}</td>
<td>${o.paid}</td>
</tr>`;
        }
    });
    showModal(`تم إنشاء تقرير لشهر ${date} ✅`);
}

// ==================== AUTOCOMPLETE ====================
function autocompleteClient() {
    const list = document.getElementById("clientList");
    list.innerHTML = "";
    const val = cName.value.toLowerCase();
    if (!val) {
        list.classList.remove("show"); // نخفي القائمة إذا الحقل فارغ
        return;
    }
    DB.clients.forEach((c) => {
        if (c.toLowerCase().includes(val)) {
            const li = document.createElement("li");
            li.innerText = c;
            li.onclick = () => {
                cName.value = c;
                list.innerHTML = "";
                list.classList.remove("show"); // نخفي بعد الاختيار
            };
            list.appendChild(li);
        }
    });
    if (list.children.length)
        list.classList.add("show"); // نعرض فقط لو فيه عناصر
    else list.classList.remove("show");
}

// ==================== FILTER ====================
function resetFilter() {
    filterDate.value = new Date().toISOString().slice(0, 10);
    renderOrders();
}

// ==================== INIT ====================
window.onload = function () {
    renderDrivers();
    renderOrders();
    updateDash();
    fillDrv();
};