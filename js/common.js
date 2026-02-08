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


function showConfirm(message, onConfirm) {
  document.getElementById("modalTitle").innerText = "تأكيد الحذف";
  document.getElementById("modalMessage").innerText = message;

  document.getElementById("modalOkBtn").style.display = "none";
  document.getElementById("modalConfirmBtn").style.display = "inline-block";
  document.getElementById("modalCancelBtn").style.display = "inline-block";

  document.getElementById("appModal").style.display = "flex";

  document.getElementById("modalConfirmBtn").onclick = () => {
    closeModal();
    onConfirm();
  };

  document.getElementById("modalCancelBtn").onclick = closeModal;
}
