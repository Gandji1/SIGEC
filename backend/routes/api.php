<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\ChartOfAccountsController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toISOString(),
    ]);
});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Tenant Management routes (Super Admin only)
    Route::middleware('role:super_admin')->prefix('tenants')->group(function () {
        Route::get('/', [TenantController::class, 'index']);
        Route::post('/', [TenantController::class, 'store']);
        Route::get('/{tenant}', [TenantController::class, 'show']);
        Route::put('/{tenant}', [TenantController::class, 'update']);
        Route::delete('/{tenant}', [TenantController::class, 'destroy']);
        Route::post('/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::post('/{tenant}/activate', [TenantController::class, 'activate']);
    });

    // User Management routes (Owner/Manager)
    Route::middleware('role:owner,manager')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/assign-role', [UserController::class, 'assignRole']);
    });

    // Dashboard routes (NEW)
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/monthly-report', [DashboardController::class, 'monthlyReport']);
    });

    // Expenses routes (NEW)
    Route::prefix('expenses')->group(function () {
        Route::post('/', [ExpenseController::class, 'store']);
        Route::get('/', [ExpenseController::class, 'index']);
    });

    // Reports routes (NEW - enriched)
    Route::prefix('reports')->group(function () {
        Route::get('/sales-journal', [ReportController::class, 'salesJournal']);
        Route::get('/purchases-journal', [ReportController::class, 'purchasesJournal']);
        Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
        Route::get('/trial-balance', [ReportController::class, 'trialBalance']);
        Route::get('/sales-journal/export', [ReportController::class, 'exportSalesXlsx']);
    });

    // Warehouse routes (NEW)
    Route::prefix('warehouses')->group(function () {
        Route::get('/', [WarehouseController::class, 'index']);
        Route::post('/', [WarehouseController::class, 'store']);
        Route::get('/{warehouse}', [WarehouseController::class, 'show']);
        Route::put('/{warehouse}', [WarehouseController::class, 'update']);
        Route::delete('/{warehouse}', [WarehouseController::class, 'destroy']);
        Route::get('/{warehouse}/stock-value', [WarehouseController::class, 'stockValue']);
        Route::get('/{warehouse}/movements', [WarehouseController::class, 'movements']);
    });

    // Inventory routes (NEW)
    Route::prefix('inventories')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::post('/', [InventoryController::class, 'store']);
        Route::get('/{inventory}', [InventoryController::class, 'show']);
        Route::delete('/{inventory}', [InventoryController::class, 'destroy']);
        Route::post('/{inventory}/start', [InventoryController::class, 'start']);
        Route::post('/{inventory}/items', [InventoryController::class, 'addItem']);
        Route::post('/{inventory}/complete', [InventoryController::class, 'complete']);
        Route::post('/{inventory}/validate', [InventoryController::class, 'validate']);
        Route::get('/{inventory}/summary', [InventoryController::class, 'summary']);
        Route::post('/{inventory}/import-csv', [InventoryController::class, 'importCSV']);
        Route::get('/{inventory}/export-csv', [InventoryController::class, 'exportCSV']);
    });

    // Inventory Reconciliation routes (NEW - Iteration 3)
    Route::prefix('inventory-counts')->group(function () {
        Route::post('/start', [InventoryReconciliationController::class, 'start']);
        Route::post('/{count}/items', [InventoryReconciliationController::class, 'recordItem']);
        Route::post('/{count}/complete', [InventoryReconciliationController::class, 'complete']);
        Route::get('/{count}/summary', [InventoryReconciliationController::class, 'summary']);
        Route::get('/{count}/variances', [InventoryReconciliationController::class, 'variances']);
        Route::post('/{count}/cancel', [InventoryReconciliationController::class, 'cancel']);
        Route::get('/{count}/report', [InventoryReconciliationController::class, 'report']);
    });

    // Product routes
    Route::apiResource('products', ProductController::class);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::get('/products/barcode/{barcode}', [ProductController::class, 'byBarcode']);

    // Sale routes
    Route::apiResource('sales', SaleController::class);
    Route::post('/sales/{sale}/complete', [SaleController::class, 'complete']);
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);
    Route::get('/sales/report', [SaleController::class, 'report']);

    // Purchase routes
    Route::apiResource('purchases', PurchaseController::class);
    Route::post('/purchases/{purchase}/add-item', [PurchaseController::class, 'addItem']);
    Route::delete('/purchases/{purchase}/items/{item}', [PurchaseController::class, 'removeItem']);
    Route::post('/purchases/{purchase}/confirm', [PurchaseController::class, 'confirm']);
    Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive']);
    Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
    Route::get('/purchases/report', [PurchaseController::class, 'report']);

    // Transfer routes
    Route::prefix('transfers')->group(function () {
        Route::get('/', [TransferController::class, 'index']);
        Route::post('/', [TransferController::class, 'store']);
        Route::get('/pending', [TransferController::class, 'pending']);
        Route::get('/statistics', [TransferController::class, 'statistics']);
        Route::get('/{transfer}', [TransferController::class, 'show']);
        Route::post('/{transfer}/approve', [TransferController::class, 'approve']);
        Route::post('/{transfer}/execute', [TransferController::class, 'execute']);
        Route::post('/{transfer}/cancel', [TransferController::class, 'cancel']);
    });

    // Stock routes
    Route::apiResource('stocks', StockController::class, ['only' => ['index', 'show']]);
    Route::post('/stocks/adjust', [StockController::class, 'adjust']);
    Route::post('/stocks/reserve', [StockController::class, 'reserve']);
    Route::post('/stocks/release', [StockController::class, 'release']);
    Route::post('/stocks/transfer', [StockController::class, 'transfer']);
    Route::get('/stocks/low-stock', [StockController::class, 'lowStock']);
    Route::get('/stocks/summary', [StockController::class, 'summary']);

    // Customer routes
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/statistics', [CustomerController::class, 'statistics']);

    // Supplier routes
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('/suppliers/{supplier}/statistics', [SupplierController::class, 'statistics']);

    // Chart of Accounts routes
    Route::prefix('chart-of-accounts')->group(function () {
        Route::post('/initialize', [ChartOfAccountsController::class, 'initialize']);
        Route::get('/', [ChartOfAccountsController::class, 'index']);
        Route::get('/summary', [ChartOfAccountsController::class, 'summary']);
        Route::get('/business-types', [ChartOfAccountsController::class, 'getBusinessTypes']);
        Route::get('/by-type/{type}', [ChartOfAccountsController::class, 'getByType']);
        Route::get('/by-subtype/{subtype}', [ChartOfAccountsController::class, 'getBySubType']);
        Route::get('/{id}', [ChartOfAccountsController::class, 'show']);
        Route::put('/{id}', [ChartOfAccountsController::class, 'update']);
    });

    // Accounting routes
    Route::prefix('accounting')->group(function () {
        Route::get('/ledger', [AccountingController::class, 'ledger']);
        Route::get('/trial-balance', [AccountingController::class, 'trialBalance']);
        Route::get('/balance', [AccountingController::class, 'trialBalance']); // Alias
        Route::get('/journals', [AccountingController::class, 'ledger']); // Alias
        Route::get('/income-statement', [AccountingController::class, 'incomeStatement']);
        Route::get('/balance-sheet', [AccountingController::class, 'balanceSheet']);
        Route::post('/post-entries', [AccountingController::class, 'postEntry']);
        Route::get('/summary', [AccountingController::class, 'summary']);
    });

    // Report routes aliases
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'salesJournal']); // Alias
    });

    // Export routes
    Route::prefix('export')->group(function () {
        Route::get('/sales/excel', [ExportController::class, 'salesToExcel']);
        Route::get('/sales/pdf', [ExportController::class, 'salesToPdf']);
        Route::get('/purchases/excel', [ExportController::class, 'purchasesToExcel']);
        Route::get('/purchases/pdf', [ExportController::class, 'purchasesToPdf']);
        Route::get('/sales/{sale}/invoice', [ExportController::class, 'generateInvoicePdf']);
        Route::get('/sales/{sale}/receipt', [ExportController::class, 'generateReceiptPdf']);
        Route::get('/accounting/report', [ExportController::class, 'exportAccountingReport']);
    });

    // Payment routes (PSP - Fedapay/Kakiapay)
    Route::prefix('payments')->group(function () {
        Route::post('/initialize', [PaymentController::class, 'initialize']);
        Route::post('/verify', [PaymentController::class, 'verify']);
        Route::get('/{reference}/status', [PaymentController::class, 'status']);
    });
});

// Public PSP webhook routes
Route::post('/payments/fedapay/callback', [PaymentController::class, 'fedapayCallback']);
Route::post('/payments/kakiapay/callback', [PaymentController::class, 'kakiapayCallback']);

