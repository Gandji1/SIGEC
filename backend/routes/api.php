<?php

use App\Http\Controllers\Api\AuthController;
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
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

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
    Route::apiResource('transfers', TransferController::class);
    Route::post('/transfers/{transfer}/approve', [TransferController::class, 'approveAndExecute']);
    Route::post('/transfers/{transfer}/cancel', [TransferController::class, 'cancel']);

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
        Route::get('/income-statement', [AccountingController::class, 'incomeStatement']);
        Route::get('/balance-sheet', [AccountingController::class, 'balanceSheet']);
        Route::post('/post-entries', [AccountingController::class, 'postEntry']);
        Route::get('/summary', [AccountingController::class, 'summary']);
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

    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/intent', [PaymentController::class, 'createPaymentIntent']);
        Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
        Route::post('/refund', [PaymentController::class, 'refundPayment']);
    });
});

