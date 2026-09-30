(function () {
  'use strict';

  // ===== ПАРАМЕТРЫ НПД НА 2026 ГОД =====
  const LIMIT = 2_400_000;       // годовой лимит НПД — 2,4 млн ₽ [citation:6][citation:18]
  const DEDUCTION_MAX = 10_000;  // налоговый вычет — 10 000 ₽ [citation:3][citation:10]
  const RATE_PERSONAL = 0.04;    // 4% с доходов от физлиц [citation:2][citation:7]
  const RATE_LEGAL = 0.06;       // 6% с доходов от юрлиц и ИП [citation:2][citation:7]

  const $ = (id) => document.getElementById(id);

  const fmt = (n) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 2,
    }).format(n);

  const fmtNum = (n) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n);

  function calculate() {
    const personal = Math.max(0, Number($('incomePersonal').value.replace(/\s/g, '')) || 0);
    const legal = Math.max(0, Number($('incomeLegal').value.replace(/\s/g, '')) || 0);
    const usedDeduction = Math.min(
      DEDUCTION_MAX,
      Math.max(0, Number($('usedDeduction').value.replace(/\s/g, '')) || 0)
    );

    const totalIncome = personal + legal;

    if (totalIncome === 0) {
      $('result').hidden = true;
      $('warning').hidden = true;
      return;
    }

    const remainingDeduction = Math.max(0, DEDUCTION_MAX - usedDeduction);

    const taxPersonalFull = personal * RATE_PERSONAL;
    const taxLegalFull = legal * RATE_LEGAL;

    let deductionApplied = 0;
    let taxPersonal = taxPersonalFull;
    let taxLegal = taxLegalFull;

    if (remainingDeduction > 0) {
      const savingPersonal = personal * 0.01;
      const savingLegal = legal * 0.02;
      const potentialSaving = savingPersonal + savingLegal;
      const actualSaving = Math.min(remainingDeduction, potentialSaving);

      if (potentialSaving > 0) {
        const sharePersonal = savingPersonal / potentialSaving;
        const shareLegal = savingLegal / potentialSaving;
        taxPersonal = taxPersonalFull - actualSaving * sharePersonal;
        taxLegal = taxLegalFull - actualSaving * shareLegal;
        deductionApplied = actualSaving;
      }
    }

    const totalTax = taxPersonal + taxLegal;

    if (totalIncome > LIMIT) {
      $('warning').hidden = false;
      $('warning').innerHTML =
        `⚠️ Доход <b>${fmt(totalIncome)}</b> превышает годовой лимит НПД ` +
        `<b>${fmt(LIMIT)}</b>. Вы теряете статус самозанятого с месяца превышения. ` +
        `Расчёт ниже — справочный, до момента превышения.`;
    } else {
      $('warning').hidden = true;
    }

    const html = `
      <h3>Результат расчёта (НПД 2026)</h3>
      <table>
        <tr><td>Доход от физлиц</td><td>${fmt(personal)}</td></tr>
        <tr><td>Доход от юрлиц/ИП</td><td>${fmt(legal)}</td></tr>
        <tr><td>Общий доход</td><td>${fmt(totalIncome)}</td></tr>
        <tr><td>Налог с физлиц (4%)</td><td>${fmt(taxPersonal)}</td></tr>
        <tr><td>Налог с юрлиц (6%)</td><td>${fmt(taxLegal)}</td></tr>
        ${
          deductionApplied > 0
            ? `<tr><td>Применён вычет</td><td>−${fmt(deductionApplied)}</td></tr>
               <tr><td>Остаток вычета</td><td>${fmt(
                 Math.max(0, remainingDeduction - deductionApplied)
               )}</td></tr>`
            : ''
        }
        <tr><td>Итого налог к уплате</td><td>${fmt(totalTax)}</td></tr>
      </table>
      <p style="margin:.75rem 0 0;font-size:.85rem;color:#6b7280">
        Эффективная ставка: ${fmtNum((totalTax / totalIncome) * 100)}%
      </p>
    `;

    $('result').innerHTML = html;
    $('result').hidden = false;
  }

  ['incomePersonal', 'incomeLegal', 'usedDeduction'].forEach((id) => {
    const el = $(id);
    el.addEventListener('input', () => {
      const raw = el.value.replace(/\D/g, '');
      if (raw === '') { el.value = ''; return; }
      el.value = Number(raw).toLocaleString('ru-RU');
    });
  });

  $('calculate').addEventListener('click', calculate);

  document.querySelectorAll('.calc input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') calculate();
    });
  });

  $('year').textContent = new Date().getFullYear();
})();
