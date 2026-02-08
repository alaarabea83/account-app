let editPurchaseIndex = null;
let deleteCallback = null;

// ===============================
// عند تحميل الصفحة
// ===============================
window.onload = function () {
  loadData();
  renderCustomerSelect();
  renderPurchases();
  loadProductsToSelect();

  document.getElementById("saveInvoiceBtn").onclick = savePurchase;

  document.getElementById("productSelect").addEventListener("change", function(){
    const index = this.value;
    if(index === "") return;
    addRow(index);
    this.value = "";
  });

  document.getElementById("invoiceCustomer").addEventListener("change", function () {
    const index = this.value;
    document.getElementById("customerBalance").value =
      index === "" ? 0 : customers[index]?.balance || 0;
    updateGrandTotal();
  });

  document.getElementById("paidAmount").addEventListener("input", updateRemaining);

  // ===== البحث وعرض الكل =====
  const searchInput = document.getElementById("searchPurchase");
  const searchBtn = document.getElementById("searchBtn");
  const showAllBtn = document.getElementById("showAllBtn");

  searchBtn.onclick = function() {
    const val = searchInput.value.trim().toLowerCase();
    const filtered = purchases.filter(p => p.customer.toLowerCase().includes(val));
    renderPurchases(filtered);
  };

  showAllBtn.onclick = function() {
    searchInput.value = "";
    renderPurchases(purchases);
  };
};


// ===============================
// العملاء
// ===============================
function renderCustomerSelect() {
  const sel = document.getElementById("invoiceCustomer");
  sel.innerHTML =
    `<option value="" disabled selected>اختر الحساب</option>` +
    `<option value="">شراء نقدي</option>` +
    customers.map((c,i)=>`<option value="${i}">${c.name}</option>`).join("");
}

// ===============================
// المنتجات
// ===============================
function loadProductsToSelect(){
  const sel = document.getElementById("productSelect");
  sel.innerHTML =
    `<option value="">اختر منتج</option>` +
    products.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("");
}

// ===============================
// إضافة صف
// ===============================
function addRow(productIndex){
  const tbody = document.querySelector("#invoiceTable tbody");
  const product = products[productIndex];
  if(!product) return;

  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="rowNum"></td>
    <td>${product.name}</td>
    <td><input type="number" class="qty" min="1" value="1"></td>
    <td><input type="number" class="price"></td>
    <td class="total">0</td>
    <td><button class="delBtn">❌</button></td>
  `;

  tbody.appendChild(row);
  updateRowNumbers();

  const qty = row.querySelector(".qty");
  const price = row.querySelector(".price");
  const totalCell = row.querySelector(".total");

  function calc(){
    totalCell.innerText = (qty.value||0)*(price.value||0);
    updateInvoiceTotal();
  }

  qty.oninput = calc;
  price.oninput = calc;

  row.querySelector(".delBtn").onclick = ()=>{
    row.remove();
    updateRowNumbers();
    updateInvoiceTotal();
  };
}

function updateRowNumbers(){
  document.querySelectorAll("#invoiceTable tbody tr")
    .forEach((tr,i)=> tr.querySelector(".rowNum").innerText = i+1);
}

// ===============================
// الحسابات
// ===============================
function updateInvoiceTotal(){
  let total = 0;

  document.querySelectorAll("#invoiceTable tbody tr")
    .forEach(tr=>{
      total += +tr.querySelector(".total").innerText || 0;
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
  document.getElementById("remainingAmount").value = g + p;
}

// ===============================
// حفظ فاتورة
// ===============================
function savePurchase() {
  const rows = document.querySelectorAll("#invoiceTable tbody tr");
  if (!rows.length) return showModal("أضف منتج واحد على الأقل");

  let total = 0;
  let items = [];

  rows.forEach(row=>{
    const name = row.cells[1].innerText;
    const qty = +row.querySelector(".qty").value || 0;
    const price = +row.querySelector(".price").value || 0;
    total += qty * price;
    items.push({name,qty,price});
  });

  const paid = +paidAmount.value || 0;
  const cIndex = invoiceCustomer.value;

  let customerName="نقدي";
  let previousBalance=0;
  let newBalance=total-paid;

  if(cIndex!==""){
    const c = customers[cIndex];
    customerName=c.name;
    previousBalance=c.balance||0;
    newBalance=previousBalance-(total-paid);
    c.balance=newBalance;
  }

  // تحديث المخزون
  items.forEach(item=>{
    const p=products.find(x=>x.name===item.name);
    if(p) p.qty += item.qty;
  });

  cash.expenses += paid;

  const invoiceData={
    customer:customerName,
    items,
    total,
    paid,
    remaining:total-paid,
    previousBalance,
    newBalance,
    date:new Date().toISOString().slice(0,10),
    order:Date.now()
  };

  if(editPurchaseIndex!==null){
    purchases[editPurchaseIndex]=invoiceData;
    editPurchaseIndex=null;
  }else{
    purchases.push(invoiceData);
  }

  saveData();
  updateBottomCashBalance();
  renderPurchases();

  document.querySelector("#invoiceTable tbody").innerHTML="";
  document.querySelectorAll("input").forEach(i=>i.value="");
  invoiceCustomer.value="";

  showModal("تم حفظ الفاتورة بنجاح ✅","نجاح");
}

// ===============================
// عرض الفواتير
// ===============================
function renderPurchases(list = purchases) {
  const tbody = document.querySelector("#purchasesTable tbody");
  tbody.innerHTML = "";

  list.forEach((p, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${p.date}</td>
        <td>${p.customer}</td>
        <td>${p.total}</td>
        <td>${p.paid}</td>
        <td>${p.remaining}</td>
        <td>${p.previousBalance || 0}</td>
        <td>${p.newBalance || 0}</td>

        <td>
          <button class="btn-edit" onclick="editPurchase(${i})">تعديل</button>
          <button class="btn-delete" onclick="confirmDeletePurchase(${p.order})">حذف</button>
        </td>
      </tr>
    `;
  });
}




// ===============================
// تعديل
// ===============================
function editPurchase(index){
  const inv=purchases[index];
  editPurchaseIndex=index;

  document.querySelector("#invoiceTable tbody").innerHTML="";

  invoiceCustomer.value =
    inv.customer==="نقدي" ? "" :
    customers.findIndex(c=>c.name===inv.customer);

  customerBalance.value=inv.previousBalance;
  paidAmount.value=inv.paid;

  inv.items.forEach(item=>{
    const i=products.findIndex(p=>p.name===item.name);
    addRow(i);

    const r=document.querySelector("#invoiceTable tbody tr:last-child");
    r.querySelector(".qty").value=item.qty;
    r.querySelector(".price").value=item.price;
    r.querySelector(".total").innerText=item.qty*item.price;
  });

  updateInvoiceTotal();
  showModal("تم تحميل الفاتورة للتعديل ✏️","تعديل");
}

// ===============================
// حذف
// ===============================
function confirmDeletePurchase(order){
  showDeleteModal("هل أنت متأكد من حذف الفاتورة؟", () => {
    const i = purchases.findIndex(p => p.order === order);
    if(i === -1) return;

    // تحديث المخزون
    purchases[i].items.forEach(item => {
      const prod = products.find(p => p.name === item.name);
      if(prod) prod.qty -= item.qty;
    });

    // تحديث رصيد العميل
    if(purchases[i].customer !== "نقدي"){
      const cust = customers.find(c => c.name === purchases[i].customer);
      if(cust) cust.balance = purchases[i].previousBalance;
    }

    // تحديث الخزينة
    cash.expenses -= purchases[i].paid;

    purchases.splice(i, 1);
    saveData();
    updateBottomCashBalance();
    renderPurchases();
    showModal("تم حذف الفاتورة بنجاح ✅","نجاح");
  });
}


// ===============================
// مودالات
// ===============================
function showDeleteModal(msg,onConfirm){
  appModal.style.display="flex";
  modalTitle.innerText="تأكيد الحذف";
  modalMessage.innerText=msg;
  modalConfirmBtn.style.display="flex";
  modalCancelBtn.style.display="flex";
  modalOkBtn.style.display="none";
  deleteCallback=onConfirm;
}

modalConfirmBtn.onclick=()=>{ if(deleteCallback) deleteCallback(); closeModal(); }
modalCancelBtn.onclick=closeModal;


function showModal(msg,title="تنبيه"){
  appModal.style.display="flex";
  modalTitle.innerText=title;
  modalMessage.innerText=msg;
  modalConfirmBtn.style.display="none";
  modalCancelBtn.style.display="none";
  modalOkBtn.style.display="flex";
}

modalOkBtn.onclick=closeModal;

function closeModal(){
  appModal.style.display="none";
  deleteCallback=null;
}
