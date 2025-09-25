<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
{
    $cats = Category::all()->map(function ($cat) {
        $cat->image_url = $cat->image 
            ? url('assets/images/' . $cat->image) 
            : null;
        return $cat;
    });

    return response()->json($cats);
}

public function show($id)
{
    $cat = Category::find($id);
    if (!$cat) {
        return response()->json(['message' => 'Category not found'], 404);
    }

    $cat->image_url = $cat->image 
        ? url('assets/images/' . $cat->image) 
        : null;

    return response()->json($cat);
}

}
