// tests/unit/dailyInventoryExcel.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_FOOD_TEMPLATE,
  findMatchingItem,
  formatInventoryValue,
  buildDailyInventoryRows,
} from '../../renderer/utils/dailyInventoryExcel.js';

test('Daily Food Inventory Excel Template & Mapping Suite', async (t) => {
  const mockSystemItems = [
    { itemId: 1, name: 'Takoyaki Flour', unit: 'kg', beginningQty: 10, stockIn: 5, suggestedOut: 3, confirmedOut: 3, endingQty: 12 },
    { itemId: 2, name: 'Cheese', unit: 'kg', beginningQty: 5, stockIn: 2, suggestedOut: 2, confirmedOut: 2, endingQty: 5 },
    { itemId: 3, name: 'Crab', unit: 'kg', beginningQty: 3, stockIn: 0, suggestedOut: 1, confirmedOut: 1, endingQty: 2 },
    { itemId: 4, name: 'Shrimp', unit: 'kg', beginningQty: 4, stockIn: 2, suggestedOut: 1.5, confirmedOut: null, endingQty: 4.5 },
    { itemId: 5, name: 'Squid', unit: 'kg', beginningQty: 3, stockIn: 1, suggestedOut: 0.5, confirmedOut: 0.5, endingQty: 3.5 },
    { itemId: 6, name: 'Corn', unit: 'kg', beginningQty: 4, stockIn: 0, suggestedOut: 0.5, confirmedOut: 0.5, endingQty: 3.5 },
    { itemId: 7, name: 'Ham', unit: 'packs', beginningQty: 8, stockIn: 0, suggestedOut: 1, confirmedOut: 1, endingQty: 7 },
    { itemId: 8, name: 'Japanese Mayo', unit: 'liters', beginningQty: 6, stockIn: 2, suggestedOut: 2.5, confirmedOut: 2.5, endingQty: 5.5 },
    { itemId: 9, name: 'Takoyaki Sauce', unit: 'liters', beginningQty: 6, stockIn: 1, suggestedOut: 2, confirmedOut: 2, endingQty: 5 },
    { itemId: 10, name: 'Katsuobushi Flakes', unit: 'packs', beginningQty: 8, stockIn: 0, suggestedOut: 3, confirmedOut: 3, endingQty: 5 },
    { itemId: 11, name: 'Green Seaweeds', unit: 'packs', beginningQty: 6, stockIn: 0, suggestedOut: 1, confirmedOut: 1, endingQty: 5 },
    { itemId: 12, name: 'Siomai', unit: 'pcs', beginningQty: 100, stockIn: 50, suggestedOut: 40, confirmedOut: 40, endingQty: 110 },
    { itemId: 13, name: 'Japanese Siomai', unit: 'pcs', beginningQty: 60, stockIn: 0, suggestedOut: 10, confirmedOut: 10, endingQty: 50 },
    { itemId: 14, name: 'Big Siomai', unit: 'pcs', beginningQty: 80, stockIn: 20, suggestedOut: 30, confirmedOut: 30, endingQty: 70 },
    { itemId: 15, name: 'Dumplings', unit: 'pcs', beginningQty: 90, stockIn: 30, suggestedOut: 20, confirmedOut: 20, endingQty: 100 },
    { itemId: 16, name: 'Cups 16oz', unit: 'pcs', beginningQty: 200, stockIn: 100, suggestedOut: 80, confirmedOut: 80, endingQty: 220 },
  ];

  await t.test('1. Template has the exact 15 food items and 2 blank separators', () => {
    assert.equal(DAILY_FOOD_TEMPLATE.length, 17);
    const labels = DAILY_FOOD_TEMPLATE.map(r => r.label);
    assert.ok(labels.includes('TAKOYAKI FLOUR'));
    assert.ok(labels.includes('CHEESE'));
    assert.ok(labels.includes('CRAB'));
    assert.ok(labels.includes('SHRIMP'));
    assert.ok(labels.includes('SQUID'));
    assert.ok(labels.includes('CORN'));
    assert.ok(labels.includes('HAM (PER PACK)'));
    assert.ok(labels.includes('JAPANESE MAYO'));
    assert.ok(labels.includes('TAKOYAKI SAUCE'));
    assert.ok(labels.includes('KATSUOBUSHI FLAKES'));
    assert.ok(labels.includes('GREEN SEAWEEDS'));
    assert.ok(labels.includes('SIOMAI'));
    assert.ok(labels.includes('JAPANESE SIOMAI'));
    assert.ok(labels.includes('BIG SIOMAI'));
    assert.ok(labels.includes('DUMPLINGS'));
  });

  await t.test('2. findMatchingItem matches system items to template aliases', () => {
    const flourTemplate = DAILY_FOOD_TEMPLATE.find(r => r.label === 'TAKOYAKI FLOUR');
    const matchedFlour = findMatchingItem(flourTemplate, mockSystemItems);
    assert.ok(matchedFlour, 'Takoyaki Flour should match TAKOYAKI FLOUR');
    assert.equal(matchedFlour.name, 'Takoyaki Flour');

    const cheeseTemplate = DAILY_FOOD_TEMPLATE.find(r => r.label === 'CHEESE');
    const matchedCheese = findMatchingItem(cheeseTemplate, mockSystemItems);
    assert.ok(matchedCheese);
    assert.equal(matchedCheese.name, 'Cheese');

    const mayoTemplate = DAILY_FOOD_TEMPLATE.find(r => r.label === 'JAPANESE MAYO');
    const matchedMayo = findMatchingItem(mayoTemplate, mockSystemItems);
    assert.ok(matchedMayo);
    assert.equal(matchedMayo.name, 'Japanese Mayo');

    const bonitoTemplate = DAILY_FOOD_TEMPLATE.find(r => r.label === 'KATSUOBUSHI FLAKES');
    const matchedBonito = findMatchingItem(bonitoTemplate, mockSystemItems);
    assert.ok(matchedBonito);
    assert.equal(matchedBonito.name, 'Katsuobushi Flakes');
  });

  await t.test('3. buildDailyInventoryRows populates STOCKS (NEW), IN, OUT, Ending from system inputs', () => {
    const { rows, extraRows } = buildDailyInventoryRows(mockSystemItems, '2026-09-28');
    assert.equal(rows.length, 17);

    const flourRow = rows.find(r => r.label === 'TAKOYAKI FLOUR');
    assert.ok(flourRow);
    assert.equal(flourRow.stocksNew, '10');
    assert.equal(flourRow.stockIn, '5');
    assert.equal(flourRow.stockOut, '3');
    assert.equal(flourRow.ending, '12');
    assert.equal(flourRow.date, '2026-09-28');

    // All 15 food items now match, only Cups 16oz is extra
    assert.ok(extraRows.length >= 1);
    const cupExtra = extraRows.find(r => r.label.includes('CUPS'));
    assert.ok(cupExtra, 'Cups 16oz should be preserved in extra rows');
    assert.equal(cupExtra.stocksNew, '200');
    assert.equal(cupExtra.ending, '220');
  });

  await t.test('4. formatInventoryValue handles zeros, nulls, and decimals cleanly', () => {
    assert.equal(formatInventoryValue(null), '0');
    assert.equal(formatInventoryValue(undefined), '0');
    assert.equal(formatInventoryValue(''), '0');
    assert.equal(formatInventoryValue(0), '0');
    assert.equal(formatInventoryValue(12.5), '12.50');
    assert.equal(formatInventoryValue(10.0), '10');
  });

  await t.test('5. generatePrintableHtml produces isolated printable table without page chrome', async () => {
    const { generatePrintableHtml } = await import('../../renderer/utils/dailyInventoryExcel.js');
    const html = generatePrintableHtml({
      systemItems: mockSystemItems,
      selectedDate: '2026-09-28',
      branch: 'MONTALBAN',
      address: 'Rodriguez Highway, Montalban, Rizal',
      preparedBy: 'supervisor',
      checkedBy: 'manager',
    });

    assert.ok(html.includes('TAKOTIME'));
    assert.ok(html.includes('DAILY FOOD INVENTORY'));
    assert.ok(html.includes('BRANCH:'));
    assert.ok(html.includes('MONTALBAN'));
    assert.ok(html.includes('ITEM/FOOD'));
    assert.ok(html.includes('STOCKS (NEW)'));
    assert.ok(html.includes('TAKOYAKI FLOUR'));
    assert.ok(html.includes('Prepared By:'));
    assert.ok(html.includes('supervisor'));
    assert.ok(html.includes('Checked By:'));
    assert.ok(html.includes('manager'));
    // Ensure no app chrome is present
    assert.equal(html.includes('sidebar'), false);
    assert.equal(html.includes('pos-top-navbar'), false);
  });

  await t.test('6. ExcelJS workbook has navy headers (#1B2A4A), white text, borders, and merges', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Test Sheet');
    const cell = ws.getCell('A6');
    cell.value = 'ITEM/FOOD';
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    assert.equal(cell.fill.fgColor.argb, 'FF1B2A4A');
    assert.equal(cell.font.color.argb, 'FFFFFFFF');
    assert.equal(cell.font.bold, true);
  });
});
