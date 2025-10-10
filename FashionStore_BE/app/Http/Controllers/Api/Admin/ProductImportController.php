<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductsImport;

class ProductImportController extends Controller
{
    public function import(Request $request)
    {
        try {
            // ép FE nào quên header vẫn nhận JSON
            if (!$request->expectsJson()) {
                $request->headers->set('Accept', 'application/json');
            }

            // validate đặt trong try để mình tự trả JSON khi lỗi
            $data = $request->validate([
                'file' => 'required|file|mimes:xlsx,csv,xls|max:20480', // 20MB
                'mode' => 'nullable|in:upsert,create-only,update-only',
            ]);

            $mode   = $data['mode'] ?? 'upsert';
            $import = new ProductsImport($mode);

            // quan trọng: phải là UploadedFile (từ multipart/form-data)
            Excel::import($import, $data['file']);

            return response()->json([
                'message'  => 'Import hoàn tất',
                'inserted' => $import->inserted,
                'updated'  => $import->updated,
                'skipped'  => $import->skipped,
                'errors'   => $import->errors,
            ], 200);
        } catch (ValidationException $e) {
            // 422 JSON gọn gàng
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('[IMPORT ERROR] ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'Import thất bại',
                'error'   => $e->getMessage(),
                'trace'   => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }
}
