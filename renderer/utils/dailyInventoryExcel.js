// renderer/utils/dailyInventoryExcel.js
import ExcelJS from 'exceljs';

/**
 * Standard Daily Food Inventory Items matching the official TAKOTIME Excel template.
 */
export const DAILY_FOOD_TEMPLATE = [
  // Section 1: Fillings & Batter
  { id: 'takoyaki_flour', label: 'TAKOYAKI FLOUR', aliases: ['TAKOYAKI FLOUR', 'BATTER', 'PREMIX', 'FLOUR'] },
  { id: 'cheese', label: 'CHEESE', aliases: ['CHEESE CUBES', 'CHEESE'] },
  { id: 'crab', label: 'CRAB', aliases: ['CRAB STICK', 'CRAB'] },
  { id: 'shrimp', label: 'SHRIMP', aliases: ['SHRIMP', 'PRAWN'] },
  { id: 'squid', label: 'SQUID', aliases: ['SQUID', 'CALAMARI'] },
  { id: 'corn', label: 'CORN', aliases: ['CORN', 'SWEET CORN'] },
  { id: 'ham', label: 'HAM (PER PACK)', aliases: ['HAM'] },
  { isBlank: true, id: 'blank_1' },
  // Section 2: Sauces & Toppings
  { id: 'japanese_mayo', label: 'JAPANESE MAYO', aliases: ['JAPANESE MAYO', 'MAYO', 'MAYONNAISE'] },
  { id: 'takoyaki_sauce', label: 'TAKOYAKI SAUCE', aliases: ['TAKOYAKI SAUCE', 'SAUCE'] },
  { id: 'katsuobushi_flakes', label: 'KATSUOBUSHI FLAKES', aliases: ['KATSUOBUSHI FLAKES', 'BONITO FLAKES', 'BONITO', 'KATSUOBUSHI'] },
  { id: 'green_seaweeds', label: 'GREEN SEAWEEDS', aliases: ['GREEN SEAWEEDS', 'AONORI', 'SEAWEED', 'SEAWEEDS', 'NORI'] },
  { isBlank: true, id: 'blank_2' },
  // Section 3: Dimsum & Dumplings
  { id: 'siomai', label: 'SIOMAI', aliases: ['PORK SIOMAI', 'SIOMAI (RAW)', 'SIOMAI'] },
  { id: 'japanese_siomai', label: 'JAPANESE SIOMAI', aliases: ['JAPANESE SIOMAI'] },
  { id: 'big_siomai', label: 'BIG SIOMAI', aliases: ['BEEF SIOMAI', 'BIG SIOMAI'] },
  { id: 'dumplings', label: 'DUMPLINGS', aliases: ['DUMPLING', 'DUMPLINGS', 'GYOZA'] },
];

/**
 * Intelligently matches a template row to an active system inventory item.
 */
export function findMatchingItem(templateItem, systemItems = []) {
  if (!templateItem || templateItem.isBlank) return null;
  const labelUpper = templateItem.label.toUpperCase();

  // 1. Direct exact name match
  const exact = systemItems.find(i => i && i.name && i.name.trim().toUpperCase() === labelUpper);
  if (exact) return exact;

  // 2. Aliases match
  if (templateItem.aliases && templateItem.aliases.length > 0) {
    for (const alias of templateItem.aliases) {
      const matched = systemItems.find(i => i && i.name && i.name.toUpperCase().includes(alias));
      if (matched) return matched;
    }
  }

  // 3. Fallback word match
  return systemItems.find(i => {
    if (!i || !i.name) return false;
    const nameUpper = i.name.toUpperCase();
    return labelUpper.split(' ').some(w => w.length > 3 && nameUpper.includes(w));
  }) || null;
}

/**
 * Format quantity number cleanly: '0' for zero/null, whole numbers without
 * trailing dot, decimals to two places.
 */
export function formatInventoryValue(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  return num % 1 === 0 ? String(num) : num.toFixed(2);
}

/**
 * Build tabular data for display and export.
 */
export function buildDailyInventoryRows(systemItems = [], selectedDate = '') {
  const matchedItemIds = new Set();

  const rows = DAILY_FOOD_TEMPLATE.map(tRow => {
    if (tRow.isBlank) {
      return { isBlank: true, id: tRow.id, label: '' };
    }
    const matched = findMatchingItem(tRow, systemItems);
    if (matched && matched.itemId !== undefined) {
      matchedItemIds.add(matched.itemId);
    }

    const outVal = matched
      ? (matched.confirmedOut !== null && matched.confirmedOut !== undefined
          ? matched.confirmedOut
          : (matched.suggestedOut || 0))
      : null;

    return {
      isBlank: false,
      id: tRow.id,
      label: tRow.label,
      matchedItem: matched,
      unit: matched?.unit || '',
      stocksNew: matched ? formatInventoryValue(matched.beginningQty) : '',
      stockIn: matched ? formatInventoryValue(matched.stockIn) : '',
      stockOut: matched ? formatInventoryValue(outVal) : '',
      ending: matched ? formatInventoryValue(matched.endingQty) : '',
      date: selectedDate,
    };
  });

  // Additional items in system not matched by template
  const additionalItems = systemItems.filter(i => i && !matchedItemIds.has(i.itemId));

  const extraRows = additionalItems.map(item => {
    const outVal = item.confirmedOut !== null && item.confirmedOut !== undefined
      ? item.confirmedOut
      : (item.suggestedOut || 0);

    return {
      isBlank: false,
      isExtra: true,
      id: `extra_${item.itemId}`,
      label: (item.name || '').toUpperCase(),
      matchedItem: item,
      unit: item.unit || '',
      stocksNew: formatInventoryValue(item.beginningQty),
      stockIn: formatInventoryValue(item.stockIn),
      stockOut: formatInventoryValue(outVal),
      ending: formatInventoryValue(item.endingQty),
      date: selectedDate,
    };
  });

  return { rows, extraRows };
}

/**
 * Export to native, fully-styled .xlsx file using ExcelJS
 * Includes #1B2A4A solid navy headers, white bold text, cell borders,
 * column widths, merged titles, and signature boxes.
 */
export async function exportDailyInventoryXlsx({
  systemItems = [],
  selectedDate = '',
  branch = 'MONTALBAN',
  address = 'Rodriguez Highway, Montalban, Rizal',
  preparedBy = '',
  checkedBy = '',
  includeExtras = true,
}) {
  const { rows, extraRows } = buildDailyInventoryRows(systemItems, selectedDate);
  const allRows = includeExtras && extraRows.length > 0
    ? [...rows, { isBlank: true, id: 'extra_blank' }, ...extraRows]
    : rows;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TAKOTIME POS';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Daily Food Inventory', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
    views: [{ showGridLines: true }]
  });

  // Column widths matching the print sheet
  worksheet.columns = [
    { key: 'item', width: 28 },
    { key: 'stocksNew', width: 16 },
    { key: 'stockIn', width: 13 },
    { key: 'stockOut', width: 13 },
    { key: 'ending', width: 16 },
    { key: 'date', width: 15 },
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } },
  };

  // Row 1: Title TAKOTIME
  worksheet.mergeCells('A1:F1');
  const r1 = worksheet.getCell('A1');
  r1.value = 'TAKOTIME';
  r1.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF000000' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 26;

  // Row 2: Subtitle DAILY FOOD INVENTORY
  worksheet.mergeCells('A2:F2');
  const r2 = worksheet.getCell('A2');
  r2.value = 'DAILY FOOD INVENTORY';
  r2.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF000000' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Row 3: Branch and Date
  worksheet.getCell('A3').value = 'BRANCH:';
  worksheet.getCell('A3').font = { name: 'Calibri', size: 10, bold: true };
  worksheet.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells('B3:D3');
  const rBranch = worksheet.getCell('B3');
  rBranch.value = branch;
  rBranch.font = { name: 'Calibri', size: 10, bold: false };
  rBranch.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.getCell('E3').value = 'DATE:';
  worksheet.getCell('E3').font = { name: 'Calibri', size: 10, bold: true };
  worksheet.getCell('E3').alignment = { horizontal: 'right', vertical: 'middle' };

  worksheet.getCell('F3').value = selectedDate;
  worksheet.getCell('F3').font = { name: 'Calibri', size: 10, bold: false };
  worksheet.getCell('F3').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Row 4: Address
  worksheet.getCell('A4').value = 'ADDRESS:';
  worksheet.getCell('A4').font = { name: 'Calibri', size: 10, bold: true };
  worksheet.getCell('A4').alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells('B4:F4');
  const rAddr = worksheet.getCell('B4');
  rAddr.value = address;
  rAddr.font = { name: 'Calibri', size: 10, bold: false };
  rAddr.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(4).height = 20;

  // Row 5: Blank separator
  worksheet.getRow(5).height = 12;

  // Row 6: Table Header with Solid Navy Fill (#1B2A4A) & White Bold Text
  const headers = ['ITEM/FOOD', 'STOCKS (NEW)', 'IN', 'OUT', 'Ending', 'DATE'];
  const headerRow = worksheet.getRow(6);
  headerRow.height = 24;

  headers.forEach((h, idx) => {
    const colIndex = idx + 1;
    const cell = headerRow.getCell(colIndex);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B2A4A' },
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colIndex === 1 ? 'left' : 'center',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1B2A4A' } },
      left: { style: 'thin', color: { argb: 'FF1B2A4A' } },
      bottom: { style: 'thin', color: { argb: 'FF1B2A4A' } },
      right: { style: 'thin', color: { argb: 'FF1B2A4A' } },
    };
  });

  // Rows 7 to N: Table items with exact borders and number formats
  let currentRowNum = 7;
  for (const r of allRows) {
    const row = worksheet.getRow(currentRowNum);
    row.height = r.isBlank ? 18 : 20;

    if (r.isBlank) {
      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.value = '';
        cell.border = thinBorder;
      }
    } else {
      const c1 = row.getCell(1);
      c1.value = r.label;
      c1.font = { name: 'Calibri', size: 10, bold: !r.isExtra };
      c1.alignment = { vertical: 'middle', horizontal: 'left' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = r.stocksNew !== '' ? Number(r.stocksNew) : '';
      c2.font = { name: 'Calibri', size: 10 };
      c2.alignment = { vertical: 'middle', horizontal: 'right' };
      c2.border = thinBorder;
      if (r.stocksNew !== '') c2.numFmt = '0.##';

      const c3 = row.getCell(3);
      c3.value = r.stockIn !== '' ? Number(r.stockIn) : '';
      c3.font = { name: 'Calibri', size: 10 };
      c3.alignment = { vertical: 'middle', horizontal: 'right' };
      c3.border = thinBorder;
      if (r.stockIn !== '') c3.numFmt = '0.##';

      const c4 = row.getCell(4);
      c4.value = r.stockOut !== '' ? Number(r.stockOut) : '';
      c4.font = { name: 'Calibri', size: 10 };
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.border = thinBorder;
      if (r.stockOut !== '') c4.numFmt = '0.##';

      const c5 = row.getCell(5);
      c5.value = r.ending !== '' ? Number(r.ending) : '';
      c5.font = { name: 'Calibri', size: 10, bold: true };
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;
      if (r.ending !== '') c5.numFmt = '0.##';

      const c6 = row.getCell(6);
      c6.value = r.date || selectedDate;
      c6.font = { name: 'Calibri', size: 9 };
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;
    }

    currentRowNum++;
  }

  // Blank row separator before footer
  worksheet.getRow(currentRowNum).height = 14;
  currentRowNum++;

  // Signature Boxes: Prepared By & Checked By
  const sigRow1 = currentRowNum;
  const sigRow2 = currentRowNum + 1;
  worksheet.getRow(sigRow1).height = 24;
  worksheet.getRow(sigRow2).height = 24;

  worksheet.mergeCells(`A${sigRow1}:C${sigRow2}`);
  const prepCell = worksheet.getCell(`A${sigRow1}`);
  prepCell.value = `Prepared By:\n${preparedBy || ''}`;
  prepCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B2A4A' } };
  prepCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

  for (let r = sigRow1; r <= sigRow2; r++) {
    for (let c = 1; c <= 3; c++) {
      worksheet.getCell(r, c).border = {
        top: r === sigRow1 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        bottom: r === sigRow2 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        left: c === 1 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        right: c === 3 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
      };
    }
  }

  worksheet.mergeCells(`D${sigRow1}:F${sigRow2}`);
  const chkCell = worksheet.getCell(`D${sigRow1}`);
  chkCell.value = `Checked By:\n${checkedBy || ''}`;
  chkCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B2A4A' } };
  chkCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

  for (let r = sigRow1; r <= sigRow2; r++) {
    for (let c = 4; c <= 6; c++) {
      worksheet.getCell(r, c).border = {
        top: r === sigRow1 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        bottom: r === sigRow2 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        left: c === 4 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
        right: c === 6 ? { style: 'medium', color: { argb: 'FF1B2A4A' } } : undefined,
      };
    }
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TAKOTIME_DAILY_FOOD_INVENTORY_${selectedDate || 'TODAY'}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to SpreadsheetML XML Spreadsheet (.xls) preserving exact navy colors (#1B2A4A),
 * bold white text, borders, and column widths when opened in Microsoft Excel.
 */
export function exportDailyInventoryFormattedXls({
  systemItems = [],
  selectedDate = '',
  branch = 'MONTALBAN',
  address = 'Rodriguez Highway, Montalban, Rizal',
  preparedBy = '',
  checkedBy = '',
  includeExtras = true,
}) {
  const { rows, extraRows } = buildDailyInventoryRows(systemItems, selectedDate);
  const allRows = includeExtras && extraRows.length > 0
    ? [...rows, { isBlank: true, id: 'extra_blank' }, ...extraRows]
    : rows;

  const rowsXml = allRows.map(r => {
    if (r.isBlank) {
      return `
    <Row ss:Height="16">
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sBlankCell"><Data ss:Type="String"></Data></Cell>
    </Row>`;
    }

    const sNewType = r.stocksNew !== '' ? 'Number' : 'String';
    const sInType = r.stockIn !== '' ? 'Number' : 'String';
    const sOutType = r.stockOut !== '' ? 'Number' : 'String';
    const sEndType = r.ending !== '' ? 'Number' : 'String';

    return `
    <Row ss:Height="18">
      <Cell ss:StyleID="sItemText"><Data ss:Type="String">${r.label}</Data></Cell>
      <Cell ss:StyleID="sNumCell"><Data ss:Type="${sNewType}">${r.stocksNew}</Data></Cell>
      <Cell ss:StyleID="sNumCell"><Data ss:Type="${sInType}">${r.stockIn}</Data></Cell>
      <Cell ss:StyleID="sNumCell"><Data ss:Type="${sOutType}">${r.stockOut}</Data></Cell>
      <Cell ss:StyleID="sEndingCell"><Data ss:Type="${sEndType}">${r.ending}</Data></Cell>
      <Cell ss:StyleID="sDateCell"><Data ss:Type="String">${r.date || selectedDate}</Data></Cell>
    </Row>`;
  }).join('');

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="sTitleMain">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="18" ss:Bold="1" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="sTitleSub">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="13" ss:Bold="1" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="sMetaLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="sMetaVal">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="sMetaDateLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="sMetaDateVal">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="sHeaderLeft">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1B2A4A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
   </Borders>
  </Style>
  <Style ss:ID="sHeaderCenter">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1B2A4A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B2A4A"/>
   </Borders>
  </Style>
  <Style ss:ID="sItemText">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="sNumCell">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="sEndingCell">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="sDateCell">
   <Font ss:FontName="Calibri" ss:Size="9"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="sBlankCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="sSigBox">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1B2A4A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1B2A4A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1B2A4A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1B2A4A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1B2A4A"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Daily Food Inventory">
  <Table ss:DefaultRowHeight="15">
   <Column ss:Width="160"/>
   <Column ss:Width="95"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="95"/>
   <Column ss:Width="90"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="5" ss:StyleID="sTitleMain"><Data ss:Type="String">TAKOTIME</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="5" ss:StyleID="sTitleSub"><Data ss:Type="String">DAILY FOOD INVENTORY</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">BRANCH:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="sMetaVal"><Data ss:Type="String">${branch}</Data></Cell>
    <Cell ss:StyleID="sMetaDateLabel"><Data ss:Type="String">DATE:</Data></Cell>
    <Cell ss:StyleID="sMetaDateVal"><Data ss:Type="String">${selectedDate}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">ADDRESS:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="sMetaVal"><Data ss:Type="String">${address}</Data></Cell>
   </Row>
   <Row ss:Height="10"></Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="sHeaderLeft"><Data ss:Type="String">ITEM/FOOD</Data></Cell>
    <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">STOCKS (NEW)</Data></Cell>
    <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">IN</Data></Cell>
    <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">OUT</Data></Cell>
    <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">Ending</Data></Cell>
    <Cell ss:StyleID="sHeaderCenter"><Data ss:Type="String">DATE</Data></Cell>
   </Row>
   ${rowsXml}
   <Row ss:Height="10"></Row>
   <Row ss:Height="40">
    <Cell ss:MergeAcross="2" ss:StyleID="sSigBox"><Data ss:Type="String">Prepared By:&#10;${preparedBy || ''}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="sSigBox"><Data ss:Type="String">Checked By:&#10;${checkedBy || ''}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TAKOTIME_DAILY_FOOD_INVENTORY_${selectedDate || 'TODAY'}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate self-contained standalone HTML for isolated printing (ONLY the table and headers)
 */
export function generatePrintableHtml({
  systemItems = [],
  selectedDate = '',
  branch = 'MONTALBAN',
  address = 'Rodriguez Highway, Montalban, Rizal',
  preparedBy = '',
  checkedBy = '',
  includeExtras = false,
}) {
  const { rows, extraRows } = buildDailyInventoryRows(systemItems, selectedDate);
  const allRows = includeExtras && extraRows.length > 0
    ? [...rows, { isBlank: true, id: 'extra_blank' }, ...extraRows]
    : rows;

  const rowsHtml = allRows.map((r, idx) => {
    if (r.isBlank) {
      return `
        <tr class="blank-row" key="blank_${idx}">
          <td style="border: 1px solid #475569; padding: 4px; height: 18px;">&nbsp;</td>
          <td style="border: 1px solid #475569; padding: 4px;"></td>
          <td style="border: 1px solid #475569; padding: 4px;"></td>
          <td style="border: 1px solid #475569; padding: 4px;"></td>
          <td style="border: 1px solid #475569; padding: 4px;"></td>
          <td style="border: 1px solid #475569; padding: 4px;"></td>
        </tr>`;
    }
    return `
      <tr key="${r.id || idx}">
        <td style="border: 1px solid #475569; padding: 4px 8px; font-weight: ${r.isExtra ? '500' : '700'}; font-size: 9.5pt;">${r.label}</td>
        <td style="border: 1px solid #475569; padding: 4px 6px; text-align: right; font-family: Consolas, monospace; font-size: 9.5pt; font-weight: 600;">${r.stocksNew}</td>
        <td style="border: 1px solid #475569; padding: 4px 6px; text-align: right; font-family: Consolas, monospace; font-size: 9.5pt; font-weight: 600;">${r.stockIn}</td>
        <td style="border: 1px solid #475569; padding: 4px 6px; text-align: right; font-family: Consolas, monospace; font-size: 9.5pt; font-weight: 600;">${r.stockOut}</td>
        <td style="border: 1px solid #475569; padding: 4px 6px; text-align: right; font-family: Consolas, monospace; font-size: 9.5pt; font-weight: 700;">${r.ending}</td>
        <td style="border: 1px solid #475569; padding: 4px 6px; text-align: center; font-size: 9pt;">${r.date}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TAKOTIME - Daily Food Inventory</title>
  <style>
    @page {
      size: portrait;
      margin: 8mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      background: #ffffff !important;
      color: #000000 !important;
      padding: 10px 14px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet-wrapper {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
    }
    .title-main {
      font-size: 17pt;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.04em;
      line-height: 1.15;
    }
    .title-sub {
      font-size: 12.5pt;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.02em;
      margin-top: 2px;
      margin-bottom: 8px;
    }
    .meta-box {
      font-size: 9.5pt;
      margin-bottom: 8px;
      line-height: 1.45;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-label {
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5pt;
    }
    th {
      background-color: #1B2A4A !important;
      color: #ffffff !important;
      border: 1px solid #1B2A4A !important;
      padding: 5px 6px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-align: center;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    th.th-left {
      text-align: left;
      padding-left: 8px;
    }
    .sig-grid {
      display: flex;
      gap: 20px;
      margin-top: 14px;
    }
    .sig-card {
      flex: 1;
      border: 1.5px solid #1B2A4A;
      border-radius: 4px;
      min-height: 48px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sig-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #1B2A4A;
    }
    .sig-name {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="title-main">TAKOTIME</div>
    <div class="title-sub">DAILY FOOD INVENTORY</div>
    <div class="meta-box">
      <div class="meta-row">
        <div><span class="meta-label">BRANCH: </span><span>${branch}</span></div>
        <div><span class="meta-label">DATE: </span><span>${selectedDate}</span></div>
      </div>
      <div><span class="meta-label">ADDRESS: </span><span>${address}</span></div>
    </div>
    <table>
      <colgroup>
        <col style="width: 30%;" />
        <col style="width: 15%;" />
        <col style="width: 12%;" />
        <col style="width: 12%;" />
        <col style="width: 15%;" />
        <col style="width: 16%;" />
      </colgroup>
      <thead>
        <tr>
          <th class="th-left">ITEM/FOOD</th>
          <th>STOCKS (NEW)</th>
          <th>IN</th>
          <th>OUT</th>
          <th>Ending</th>
          <th>DATE</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="sig-grid">
      <div class="sig-card">
        <div class="sig-title">Prepared By:</div>
        <div class="sig-name">${preparedBy || ''}</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">Checked By:</div>
        <div class="sig-name">${checkedBy || ''}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Isolated Print Trigger: Renders ONLY the Daily Food Inventory table in a hidden iframe
 * ensuring ZERO page elements or app background are included in the print job.
 */
export function printDailyInventorySheet(params) {
  const html = generatePrintableHtml(params);

  // Remove existing print iframe if any
  const existing = document.getElementById('takotime-print-iframe');
  if (existing) {
    try { existing.remove(); } catch {}
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'takotime-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '1000px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error('Iframe print error, falling back to window.print():', printErr);
          window.print();
        }
      }, 250);
    }
  } catch (err) {
    console.error('Failed to write to print iframe:', err);
    window.print();
  }
}
