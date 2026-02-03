function renderProfitReport() {
  const tbody = document.querySelector("#profitTable tbody");
  const tfoot = document.querySelector("#profitTable tfoot");

  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  let cumulativeProfit = 0;

  sales
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(invoice => {

      if (from && new Date(invoice.date) < new Date(from)) return;
      if (to && new Date(invoice.date) > new Date(to)) return;

      let totalBuy = 0;
      let totalSell = 0;

      (invoice.items || []).forEach(item => {
        const qty = item.qty || 0;
        const buy = item.buyPrice || 0;
        const sell = item.sellPrice || 0;

        totalBuy += buy * qty;
        totalSell += sell * qty;
      });

      let profit = totalSell - totalBuy;
      if (profit < 0) profit = 0;

      cumulativeProfit += profit;

      tbody.innerHTML += `
        <tr>
          <td>${invoice.date}</td>
          <td>${invoice.customer}</td>
          <td>${totalBuy.toFixed(2)}</td>
          <td>${totalSell.toFixed(2)}</td>
          <td>${profit.toFixed(2)}</td>
          <td>${cumulativeProfit.toFixed(2)}</td>
        </tr>
      `;
    });

  tfoot.innerHTML = `
    <tr>
      <td colspan="5">صافي الربح</td>
      <td>${cumulativeProfit.toFixed(2)}</td>
    </tr>
  `;
}
