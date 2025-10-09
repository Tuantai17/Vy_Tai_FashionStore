<?php
// tin tuc
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function index(Request $req)
    {
        $q = Article::query();

        if ($kw = $req->query('q')) {
            $q->where(function ($s) use ($kw) {
                $s->where('title', 'like', "%{$kw}%")
                    ->orWhere('summary', 'like', "%{$kw}%")
                    ->orWhere('source', 'like', "%{$kw}%");
            });
        }

        if ($source = $req->query('source')) {
            $q->where('source', $source);
        }

        $q->orderByDesc('published_at')->orderByDesc('id');

        return $q->paginate($req->integer('per_page', 12));
    }

    public function show(string $slug)
    {
        return Article::where('slug', $slug)->firstOrFail();
    }
}
