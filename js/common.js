// تحديث الرصيد في الـ bottom menu
function updateBottomCashBalance() {
  const balanceEl = document.getElementById("cashBalance");
  if (!balanceEl) return; // لو العنصر مش موجود
  balanceEl.innerText = getCashFinal().toFixed(2); // استخدمنا الدالة الجاهزة
}

// بعد تحميل الصفحة
window.addEventListener("DOMContentLoaded", () => {
  loadData();                  // تحميل البيانات أولاً
  updateBottomCashBalance();   // تحديث الرصيد
});
