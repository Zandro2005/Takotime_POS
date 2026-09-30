# TAKOTIME! POS — Comprehensive User Manual & Operations Guide

> **Official Operating Guide for TAKOTIME! Point-of-Sale & Store Management System**  
> *Applicable for: Staff, Lead Staff (Admin Staff), Store Administrator (Admin), and Franchise Owner (Cloud Admin)*

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [User Roles & Permissions Matrix](#2-user-roles--permissions-matrix)
3. [Role 1: Staff (Cashier & Crew Guide)](#3-role-1-staff-cashier--crew-guide)
   - [3.1 Logging In & Quick PIN Access](#31-logging-in--quick-pin-access)
   - [3.2 Opening a Shift (Starting Float)](#32-opening-a-shift-starting-float)
   - [3.3 Order Taking & Menu Navigation](#33-order-taking--menu-navigation)
   - [3.4 Senior Citizen & PWD Discounts](#34-senior-citizen--pwd-discounts)
   - [3.5 Payment Processing (Cash & GCash)](#35-payment-processing-cash--gcash)
   - [3.6 Thermal Receipt & Queue Management](#36-thermal-receipt--queue-management)
   - [3.7 Petty Cash Out Movements](#37-petty-cash-out-movements)
   - [3.8 Closing Shift & Cash Drawer Reconciliation](#38-closing-shift--cash-drawer-reconciliation)
   - [3.9 Terminal Lock & Security](#39-terminal-lock--security)
4. [Role 2: Admin Staff (Lead Staff / Shift Manager Guide)](#4-role-2-admin-staff-lead-staff--shift-manager-guide)
   - [4.1 Navigating the Store Hub](#41-navigating-the-store-hub)
   - [4.2 Voiding Orders with Audit Reasons](#42-voiding-orders-with-audit-reasons)
   - [4.3 Daily Inventory Management](#43-daily-inventory-management)
   - [4.4 Printable Daily Inventory Count Sheets](#44-printable-daily-inventory-count-sheets)
   - [4.5 Shift & Sales Reports Auditing](#45-shift--sales-reports-auditing)
5. [Role 3: Admin (Store Owner / General Administrator Guide)](#5-role-3-admin-store-owner--general-administrator-guide)
   - [5.1 Executive Store Dashboard](#51-executive-store-dashboard)
   - [5.2 Multi-Timeframe Sales Analytics & Excel/PDF Reports](#52-multi-timeframe-sales-analytics--excelpdf-reports)
   - [5.3 Menu Catalog & Recipe BOM (Bill of Materials)](#53-menu-catalog--recipe-bom-bill-of-materials)
   - [5.4 Staff Account Management & Access Controls](#54-staff-account-management--access-controls)
   - [5.5 Store Settings, Custom Promos & Receipts](#55-store-settings-custom-promos--receipts)
   - [5.6 Database Backups & Data Integrity](#56-database-backups--data-integrity)
6. [Role 4: Cloud Admin (Franchise Owner / Remote Admin Guide)](#6-role-4-cloud-admin-franchise-owner--remote-admin-guide)
   - [6.1 Read-Only Philosophy & Architecture](#61-read-only-philosophy--architecture)
   - [6.2 Executive Cloud Dashboard](#62-executive-cloud-dashboard)
   - [6.3 Product Mix & Category Share Analytics](#63-product-mix--category-share-analytics)
   - [6.4 Remote Order Ledger & Receipt Inspection](#64-remote-order-ledger--receipt-inspection)
   - [6.5 Live Inventory Depletion & Waste Audits](#65-live-inventory-depletion--waste-audits)
   - [6.6 Shift Cash Reconciliations & Void Auditing](#66-shift-cash-reconciliations--void-auditing)
   - [6.7 Cloud Sync Health & Database Diagnostics](#67-cloud-sync-health--database-diagnostics)
7. [Troubleshooting, Offline Resiliency & FAQ](#7-troubleshooting-offline-resiliency--faq)

---

## 1. System Overview & Architecture

**TAKOTIME! POS** is an enterprise-grade commercial Point-of-Sale and Inventory Management application developed specifically for Japanese street food food-stall and quick-service operations.

### Key Architectural Highlights
- **Offline-First Reliability**: Runs completely offline using an ultra-fast local SQLite database in Write-Ahead-Logging (WAL) mode. The store never halts sales even during full internet outages.
- **Automated Recipe BOM (Bill of Materials)**: Every takoyaki, siomai, and beverage sold automatically deducts exact quantities of flour, batter, seafood, sauces, toppings, and cups in real time.
- **Cash Drawer Balancing**: Tracks starting floats, cash sales, GCash payments, and paid-out cash movements with strict end-of-shift variance calculation.
- **Bi-Directional Cloud Synchronization**: Transparently pushes completed shifts, sales logs, and inventory snapshots to Firebase Realtime Database when online, while keeping local operations 100% autonomous.

---

## 2. User Roles & Permissions Matrix

The system enforces strict role-based access control (RBAC). When any user logs in, the application automatically routes to their dedicated interface shell:

| Feature / Capability | Staff (Cashier) | Admin Staff (Lead Staff) | Admin (Store Owner) | Cloud Admin (Franchise Owner) |
| :--- | :---: | :---: | :---: | :---: |
| **Interface Shell** | `POS Terminal` | `Store Hub` | `Admin Portal` | `Cloud Admin Shell` |
| **Open & Close Own Cashier Shift** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Take Orders & Issue Receipts** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Apply Senior / PWD Discounts** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Record Cash Paid-Out (Petty Cash)** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Void Orders (with Audit Reason)** | ❌ No | ✅ Yes | ✅ Yes | ❌ View Void Logs |
| **Daily Inventory Worksheet & Counts** | ❌ No | ✅ Yes | ✅ Yes | ❌ View Inventory |
| **Print Daily Count Worksheets** | ❌ No | ✅ Yes | ✅ Yes | ❌ View Ledger |
| **View Shift & Sales Reports** | ❌ Own Shift | ✅ Store Reports | ✅ Store Reports | ✅ Store Reports |
| **Export Reports to Excel (.csv)** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Print Executive Sales Reports (PDF)** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Manage Menu & Recipe Ingredients** | ❌ No | ❌ No | ✅ Yes | ❌ View Mix |
| **Create & Edit Staff Accounts** | ❌ No | ❌ No | ✅ Yes | ❌ Read-Only |
| **Configure Store Settings & Promos** | ❌ No | ❌ No | ✅ Yes | ❌ Read-Only |
| **Manage Database Backups** | ❌ No | ❌ No | ✅ Yes | ❌ View Status |
| **Live Remote Cloud Telemetry** | ❌ No | ❌ No | ❌ Store Local | ✅ Yes |

---

## 3. Role 1: Staff (Cashier & Crew Guide)

*Target Users: Front-line Cashiers, Kitchen Crew, Part-time Staff.*  
*Primary Screen: Full-Screen POS Terminal.*

```
+-----------------------------------------------------------------------------------+
| TAKOTIME! POS - CASHIER TERMINAL                                  [Lock] [Logout] |
| Current Shift: #1 (Staff: Maria) • Starting Float: ₱1,000.00                       |
+-----------------------------------+-----------------------------------------------+
| CATEGORIES:                       | CURRENT ORDER: (Queue #01)                    |
| [Takoyaki] [Siomai] [Beverages]   | --------------------------------------------- |
|                                   | 1x Classic Octopus (8 pcs)            ₱85.00  |
| PRODUCTS:                         |    • Extra Bonito Flakes              +₱10.00 |
| [ 8 pcs Octopus - ₱85 ]           | 1x Calamansi Juice (16oz)             ₱30.00  |
| [ 4 pcs Octopus - ₱45 ]           | --------------------------------------------- |
| [ 8 pcs Crab & Cheese - ₱95 ]     | Subtotal:                             ₱125.00 |
| [ 4 pcs Pork Siomai - ₱40 ]       | [ ] Senior / PWD Discount (20%)       - ₱0.00 |
|                                   | TOTAL DUE:                            ₱125.00 |
|                                   | [ CASH - ₱ ]  [ GCASH - Ref # ]   [ PRINT ]   |
+-----------------------------------+-----------------------------------------------+
```

### 3.1 Logging In & Quick PIN Access
1. Open the application.
2. Select your account from the user selector or type your username.
3. Enter your **4-Digit Staff PIN** on the numeric keypad (or type your account password).
4. Click **Log In**. The POS Terminal will load automatically.

### 3.2 Opening a Shift (Starting Float)
Before processing orders at the start of a business day or shift:
1. If no shift is active, the system automatically displays the **Open Shift Modal**.
2. Count the physical cash in the cash drawer (the opening float / change fund, standard: `₱1,000.00`).
3. Enter the exact starting amount into the **Starting Cash** input field.
4. Click **Open Shift**. The cash drawer register is now active and tracked.

### 3.3 Order Taking & Menu Navigation
1. **Select Category**: Tap on **Takoyaki**, **Siomai**, or **Drinks** from the top category pills.
2. **Add Items to Order**: Tap any product card (e.g., *Classic Octopus Takoyaki*).
3. **Choose Portion / Variant**: Select the size (e.g., *4 pcs* or *8 pcs*).
4. **Choose Flavors & Modifiers**:
   - Optional sauce or topping add-ons (e.g., *Extra Japanese Mayo*, *Extra Bonito Flakes*).
5. **Adjust Quantity**: Use the `+` or `-` buttons in the cart to increment or remove items.

### 3.4 Senior Citizen & PWD Discounts
Philippine statutory discounts are built directly into the cart:
1. Check the **Senior / PWD Discount (20%)** checkbox in the cart summary.
2. Enter the Customer's **ID Number** and **Customer Name** in the prompt modal for statutory audit compliance.
3. The system automatically deducts 20% from the eligible portion of the bill and displays the discounted net total.

### 3.5 Payment Processing (Cash & GCash)
#### A. Cash Payment
1. Tap the **Cash** payment tab.
2. Tap one of the **Quick Cash buttons** (e.g., `₱100`, `₱200`, `₱500`, `₱1,000`, or `Exact`) or enter the cash amount tendered by the customer.
3. The screen instantly computes the exact **Change Due** in large green figures.
4. Complete the transaction by pressing **Charge Cash**.

#### B. GCash / E-Wallet Payment
1. Ask the customer to scan the store's official GCash QR Code displayed at the counter.
2. Tap the **GCash** payment button.
3. Enter the **GCash Reference Number** (last 4 to 12 digits of the transaction SMS/receipt).
4. Click **Confirm GCash Payment**.

### 3.6 Thermal Receipt & Queue Management
- Upon completing an order:
  - An incremental **Queue Number** (e.g., `Q#01`, `Q#02`) is automatically assigned for customer callout.
  - An order receipt preview displays the complete breakdown (store header, date/time, items, payment method, cashier name, and barcode/queue number).
  - Tap **Print Receipt** (or enable auto-print) to trigger the counter thermal printer.

### 3.7 Petty Cash Out Movements
If money is taken from the cash drawer during operating hours (e.g., buying tube ice, mineral water, emergency market ingredients):
1. Click **Drawer Cash Movement** (or **Cash Out**) button on the top right.
2. Enter the **Amount Paid Out** (e.g., `₱150.00`).
3. Enter the mandatory **Reason / Description** (e.g., `Purchased 3 bags tube ice`).
4. Tap **Confirm Cash Out**. This ensures your cash drawer will balance perfectly at end of day.

### 3.8 Closing Shift & Cash Drawer Reconciliation
At the end of your shift:
1. Tap the **Close Shift** button on the top right header.
2. The Cash Reconciliation modal appears:
   - System displays **Starting Float**, **Total Cash Sales**, and **Cash Deductions**.
   - System calculates the **Expected Drawer Cash**:
     $$\text{Expected Cash} = \text{Starting Cash} + \text{Cash Sales} - \text{Cash Paid Out}$$
3. Perform physical cash count of the drawer and enter the **Counted Cash Amount**.
4. The system calculates the **Variance**:
   - `₱0.00` = Balanced (Perfect reconciliation).
   - Negative amount = Cash Shortage.
   - Positive amount = Cash Overage.
5. If there is a variance, enter an explanation in the notes field.
6. Click **Confirm & Close Shift**. The shift summary receipt is generated, and the terminal locks for the next cashier.

### 3.9 Terminal Lock & Security
- Whenever stepping away from the counter:
  - Tap the **Lock Screen** icon (padlock) on the header.
  - The terminal locks immediately, preventing unauthorized orders.
  - To resume, enter your 4-digit PIN.

---

## 4. Role 2: Admin Staff (Lead Staff / Shift Manager Guide)

*Target Users: Store Supervisors, Lead Cashiers, Kitchen Supervisors.*  
*Primary Screen: Store Hub Shell.*

```
+-----------------------------------------------------------------------------------+
| TAKOTIME! STORE HUB                     [POS Terminal] [Daily Inventory] [Reports]|
| Branch: Montalban • User: Lead Staff (Supervisor)                 [Lock] [Logout] |
+-----------------------------------------------------------------------------------+
```

### 4.1 Navigating the Store Hub
Admin Staff users have a dedicated top navigation bar allowing seamless switching between:
1. **POS Terminal**: For taking orders, processing sales, and opening/closing shifts.
2. **Daily Inventory**: For tracking raw ingredients, deliveries, usage, and stock counts.
3. **Shift & Sales Reports**: For reviewing shift summaries, cash accounting, and daily sales.

### 4.2 Voiding Orders with Audit Reasons
Unlike regular staff, Admin Staff have authority to void mistakenly rung orders:
1. Navigate to the POS Terminal or Recent Orders tab.
2. Select the order to void.
3. Click **Void Order**.
4. Select or type the mandatory audit reason:
   - *Customer cancelled order*
   - *Wrong variant selected*
   - *Payment error / duplicate order*
   - *Kitchen spill / remake*
5. Confirm voiding. The order status updates to `VOID`, total sales reconcile, and ingredients deducted by the recipe are automatically restored to inventory.

### 4.3 Daily Inventory Management
The Daily Inventory screen manages all tracked raw materials (Takoyaki Flour, Octopus, Crabsticks, Squid Bits, Cheese Cubes, Japanese Mayo, Bonito Flakes, Takoyaki Sauce, Siomai Wrappers, etc.).

The ledger tracks the complete inventory equation:
$$\text{Ending Stock} = \text{Beginning Stock} + \text{Stock In} - \text{Usage (Theoretical Out)} - \text{Wastage}$$

1. **Beginning Stock**: Carried over automatically from previous day's closing count.
2. **Stock In (+)**: Tap **Record Delivery / Stock In** when commissary supplies arrive. Enter the quantity and unit (kg, packs, liters).
3. **Suggested / Theoretical Out**: Calculated automatically by the recipe BOM engine based on menu items sold today.
4. **Confirmed Ending Stock**: Input physical count during evening stocktake.
5. **Wastage / Shrinkage**: Enter any spoiled, dropped, or expired ingredients with notes.
6. **Threshold Alerts**:
   - 🟢 **Safe**: Current stock is safely above minimum threshold.
   - 🟡 **Warning**: Stock is approaching minimum operating level.
   - 🔴 **Critical Low**: Stock is below required threshold. Restock immediately!

### 4.4 Printable Daily Inventory Count Sheets
To perform physical audits and stock count verification:
1. Navigate to **Daily Inventory**.
2. Click the **Print Count Sheet** button on the top right toolbar.
3. A clean, non-scrollable, printable worksheet preview opens with:
   - Store Name and Branch Header.
   - Audit Date and Printed Timestamp.
   - Clean tabular columns: `Item Name`, `Unit`, `Beginning`, `Stock In`, `Physical Count`, `Variance / Notes`.
   - Dedicated signature block for **Opening Staff** and **Closing Supervisor**.
4. Click **Print Worksheet** to print directly to your A4 or letter paper printer, or save as PDF.

### 4.5 Shift & Sales Reports Auditing
1. Navigate to **Shift & Sales Reports**.
2. View real-time shift performance:
   - Total Gross Sales, Discounts Given, Net Sales.
   - Cash vs. GCash payment volume split.
   - Complete Cash Accounting (Starting Cash, Cash In, Cash Out, Expected Drawer, Counted Ending Cash, Variance).
3. Click **Export to Excel (.csv)** to save a spreadsheet report for store files.

---

## 5. Role 3: Admin (Store Owner / General Administrator Guide)

*Target Users: Store Owners, Franchise General Managers, System Administrators.*  
*Primary Screen: Full Admin Portal with Collapsible Modern Navigation.*

```
+------------------------------------------------------------------------------------+
| [Logo] TAKOTIME! Admin Portal                                      [LIVE METRICS]  |
+----------------------+-------------------------------------------------------------+
| OVERVIEW             | EXECUTIVE DASHBOARD                                         |
| > Dashboard          | +-----------------+ +-----------------+ +-----------------+ |
|   POS Terminal       | | TODAY'S SALES   | | COMPLETED ORDERS| | CASH IN DRAWER  | |
|   Daily Inventory    | | ₱5,120.00       | | 36 Orders       | | ₱4,430.00       | |
|   Shift Reports      | +-----------------+ +-----------------+ +-----------------+ |
|   Menu & Recipes     |                                                             |
|                      | SALES PERFORMANCE (7D / 15D / 30D / 6M / 1Y)   [Excel][Print]|
| ACCOUNT              | [  |||   ||||   |||||   ||||   ||||||   |||||   ||||||||  ] |
|   Staff Accounts     |                                                             |
|   Store Settings     | ACTIVE SHIFT LEDGER             TODAY'S BEST SELLING ITEMS  |
|   Sign Out           | • Cashier: Maria                1. Octopus (8pcs) - 42 sold |
|                      | • Expected: ₱4,430.00           2. Siomai (4pcs)  - 35 sold |
+----------------------+-------------------------------------------------------------+
```

### 5.1 Executive Store Dashboard
The Admin Dashboard gives owners full command of daily business vitals at a single glance:
- **4 Spacious Executive KPI Cards**:
  - **Today's Net Sales**: Gross sales minus discounts, displayed in high-contrast financial typography.
  - **Completed Orders**: Real-time order count with average ticket calculation.
  - **Cash Drawer On Duty**: Expected cash currently sitting in the register with cashier attribution.
  - **Inventory Health**: Real-time safety indicator showing total ingredients monitored and count of low-stock items.

### 5.2 Multi-Timeframe Sales Analytics & Excel/PDF Reports
The Sales Performance card features interactive visualization:
1. **Timeframe Selection**: Toggle between **7 Days**, **15 Days**, **30 Days**, **Semi-Annually (6 Months)**, and **Annually (1 Year)**.
2. **Carousel & Swipe Navigation**: Swipe or click **Earlier** / **Recent** to navigate through periods with smooth paging.
3. **Interactive Bar Inspection**: Hover over any bar to inspect date, revenue, and order volume.
4. **Excel Export**: Click **Excel** to download a formatted `.csv` report of historical period performance.
5. **Print / Save as PDF**: Click **Print / PDF** to launch the executive report preview modal and generate hardcopy reports.

### 5.3 Menu Catalog & Recipe BOM (Bill of Materials)
Under **Menu & Recipes**, the administrator configures the culinary and pricing engine:
1. **Categories & Products**:
   - Create new categories (e.g., *Special Takoyaki*, *Dimsum Specialties*, *Coolers*).
   - Add products with custom descriptions, prices, portion sizes, and images.
2. **Recipe BOM Configuration**:
   - For every product variant (e.g., *Octopus Takoyaki 8 pcs*), configure the recipe ingredients:
     - `Takoyaki Batter Mix`: `0.15 kg`
     - `Diced Octopus`: `0.04 kg`
     - `Bonito Flakes`: `0.005 kg`
     - `Takoyaki Sauce`: `0.02 L`
     - `Paper Boat Tray`: `1 pc`
   - *Result*: When cashier sells an 8-piece Octopus Takoyaki, the system depletes all 5 raw ingredients automatically in real time!

### 5.4 Staff Account Management & Access Controls
Under **Staff Accounts**:
1. **Create New User**:
   - Click **Add Staff Member**.
   - Enter Full Name, Username, Login Password, and 4-Digit Quick PIN.
   - Assign Role: `Staff` (Cashier), `Admin Staff` (Lead Staff), or `Admin`.
2. **Account Security**:
   - Reset forgotten PINs or passwords.
   - Deactivate accounts of departed staff.
   - *Failsafe Protection*: The system strictly prevents deactivating the primary administrator account to eliminate accidental lockout.

### 5.5 Store Settings, Custom Promos & Receipts
Under **Store Settings**:
1. **Store Identity**: Configure Official Store Name, Branch Name (e.g., `Montalban Branch`), and contact number.
2. **Receipt Customization**: Set custom header message and footer tagline (e.g., *Thank you for dining with TAKOTIME! Please come again.*).
3. **Promotional Banner**: Customize promotional banners shown to cashiers during peak shifts.

### 5.6 Database Backups & Data Integrity
1. **Automatic WAL Backups**: The system automatically executes backups every time a shift closes.
2. **Manual Backup**: Tap **Create Instant Backup** to generate a timestamped SQLite database archive in the `backups/` directory.

---

## 6. Role 4: Cloud Admin (Franchise Owner / Remote Admin Guide)

*Target Users: Franchise Owners, Remote Executives, Multi-Store Auditors.*  
*Primary Screen: Executive Cloud Shell (`RemoteCloudShell`).*

```
+------------------------------------------------------------------------------------+
| [Logo] TAKOTIME! Cloud Admin                     [LIVE TELEMETRY]  [Refresh][Logout]|
+----------------------+-------------------------------------------------------------+
| STORE ANALYTICS      | EXECUTIVE CLOUD DASHBOARD                                   |
| > Overview           | • Branch: Montalban • Live Synced                           |
|   Menu & Products    |                                                             |
|   Orders             | [ ₱5,120.00 Net ] [ 36 Orders ] [ ₱4,430 Drawer ] [ Safe ]  |
|   Inventory          |                                                             |
|                      | SALES PERFORMANCE ANALYTICS                    [Excel][Print]|
| AUDIT & SYSTEM       | [ 7D ] [ 15D ] [ 30D ] [ Semi-Annual ] [ Annual ]           |
|   Shifts & Cash      |                                                             |
|   Cloud Sync         | PAYMENT METHODS SPLIT           PEAK OPERATING HOURS        |
|   Sign Out           | • Cash:  ₱3,580 (70%)           • 12:00 - 14 orders         |
|                      | • GCash: ₱1,200 (30%)           • 17:00 - 16 orders (Peak)  |
+----------------------+-------------------------------------------------------------+
```

### 6.1 Read-Only Philosophy & Architecture
The Cloud Admin shell is architected as a **purely view-only analytical command center**:
- **Zero Risk of Operational Tampering**: Remote users cannot inadvertently change store prices, add unauthorized staff, or alter active cash registers.
- **Uncluttered & High-Impact**: Clean, executive data presentation without confusing forms or wall-of-text descriptions.
- **Identical Visual Design**: Built using the exact same design language, collapsible sidebar, and spacious widget sizing as the store's Admin Panel.

### 6.2 Executive Cloud Dashboard
- **Live Store Telemetry Badge**: Real-time green indicator verifying store sync timestamp and active date.
- **4 Prominent Metric Widgets**: Today's Net Sales, Completed Orders, Cash Drawer on Duty, and Inventory Safety.
- **Interactive Multi-Timeframe Chart**: Monitor store revenue across 7 Days, 15 Days, 30 Days, 6 Months, or 1 Year with swipe support and Excel export.
- **Payment Method Split**: Live visual bar comparing Cash vs. GCash revenue volumes.
- **Peak Operating Hours Density**: Identifies peak counter rush hours (e.g., 12:00 lunch rush and 17:00 evening rush) to assist in staffing allocations.
- **Today's Best Selling Items**: Real-time sales leaderboards showing units sold and revenue contribution per item.

### 6.3 Product Mix & Category Share Analytics
Under **Menu & Products**:
- **Category Volume & Revenue Cards**: Real-time market share percentages for Takoyaki, Siomai, and Drinks.
- **Itemized Product Mix Table**: Filter items by category or keyword to see exact unit volumes, retail prices, and overall share of revenue.
- **One-Click CSV Export**: Download the complete product mix breakdown directly to Microsoft Excel.

### 6.4 Remote Order Ledger & Receipt Inspection
Under **Orders**:
- Complete, searchable history of all orders rung at the store today.
- View Queue numbers, exact timestamps, cashier attribution, payment method, items summary, and total cost.
- **Order Inspector Modal**: Click **Inspect** on any order to open an authentic digital thermal receipt view detailing variant options, individual add-on prices, and GCash reference numbers.

### 6.5 Live Inventory Depletion & Waste Audits
Under **Inventory**:
- **4 Big Audit Widgets**: Tracked Ingredients count, Low Stock Alerts, Theoretical Consumption total, and Net Shrinkage/Wastage recorded.
- **Ingredient Inventory Ledger**: Live breakdown of Beginning inventory, Commissary Stock-In, Recipe BOM Suggested Out, Confirmed Physical Out, and Net Wastage.
- Filter by **Low Stock Only** to instantly flag stock risks.

### 6.6 Shift Cash Reconciliations & Void Auditing
Under **Shifts & Cash**:
- **Active Shift Cash Drawer Reconciliation**: Audit the 5-point cash formula in real time:
  $$\text{Starting Float} + \text{Cash Sales} - \text{Cash Drops/Out} = \text{Expected Drawer Cash}$$
- **Voided Orders Log**: Full transparency into every order voided by store supervisors, including cashier name, exact time, monetary amount, and mandatory audit reason.

### 6.7 Cloud Sync Health & Database Diagnostics
Under **Cloud Sync**:
- Real-time diagnostic monitors for Firebase Realtime Database connectivity.
- SQLite WAL mode integrity check status.
- Automated backup frequency schedule (every 6 hours / on shift close).
- Event audit log detailing recent cloud synchronization push and pull payloads.

---

## 7. Troubleshooting, Offline Resiliency & FAQ

### Q1: What happens if the store's internet connection disconnects?
**Answer**: Absolutely nothing stops! The store cashiers can continue taking orders, printing receipts, voiding items, and managing inventory normally. All transactions are written locally to the high-speed SQLite database. As soon as internet connectivity returns, the background sync bridge automatically pushes all queued orders and summaries to the cloud with zero duplicate records.

### Q2: A cashier made a mistake on an order. Can regular staff void it?
**Answer**: No. Regular staff accounts cannot void orders to protect the store from unauthorized cash cancellations. An **Admin Staff (Lead Staff)** or **Admin (Owner)** must review the error, tap **Void Order**, and record the official audit reason.

### Q3: What should we do if the physical cash count does not match expected drawer cash?
**Answer**:
1. Check the **Petty Cash Out** records to verify if any staff purchased ice or supplies without logging it.
2. Check GCash payments to ensure no GCash transaction was accidentally rung as Cash.
3. If an overage or shortage remains, input the actual physical counted cash. The system logs the variance permanently in the shift audit ledger for owner review.

### Q4: How do we print the Daily Inventory Count Sheet for kitchen staff?
**Answer**:
Log in as **Admin Staff** or **Admin**, click **Daily Inventory**, and tap the **Print Count Sheet** button. This opens the dedicated printable worksheet with signature lines ready for physical clipboard counting.

### Q5: Can the Franchise Owner accidentally change menu prices from the Cloud Admin portal?
**Answer**: No. The Cloud Admin portal is strictly read-only and designed specifically for auditing, analytics, and telemetry monitoring without risking unintentional changes to active store operations.

---

*TAKOTIME! POS System Documentation • Maintained by Antigravity Engineering Team*
