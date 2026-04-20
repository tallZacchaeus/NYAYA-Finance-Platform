<?php

namespace App\Models;

// Alias to the modular User model so framework internals (auth, factories) resolve correctly.
class User extends \App\Modules\User\Models\User
{
}
