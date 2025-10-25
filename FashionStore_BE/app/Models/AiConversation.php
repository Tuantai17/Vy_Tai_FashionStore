<?php

// app/Models/AiConversation.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiConversation extends Model
{
    protected $fillable = ['user_id', 'session_id', 'messages_json'];
}
