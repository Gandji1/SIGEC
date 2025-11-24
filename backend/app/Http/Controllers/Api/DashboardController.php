<?php

namespace App\Http\Controllers\Api;

use App\Domains\Dashboard\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    private DashboardService $dashboardService;

    public function __construct()
    {
        $this->dashboardService = new DashboardService();
        $this->middleware('auth:sanctum');
        $this->middleware('tenant');
    }

    /**
     * KPIs du jour
     */
    public function stats(): JsonResponse
    {
        try {
            $kpis = $this->dashboardService->getTodayKPIs();

            return response()->json([
                'status' => 'success',
                'data' => $kpis,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rapport mensuel
     */
    public function monthlyReport(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->month);
        $year = $request->query('year', now()->year);

        try {
            $report = $this->dashboardService->getMonthlyReport($month, $year);

            return response()->json([
                'status' => 'success',
                'data' => $report,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
