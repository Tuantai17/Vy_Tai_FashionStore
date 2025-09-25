<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;

class BrandController extends Controller
{
    // GET /api/brands  → trả danh sách {id, name}
    public function index()
    {
        return Brand::select('id', 'name')
            ->orderBy('name')
            ->get();
    }
}
