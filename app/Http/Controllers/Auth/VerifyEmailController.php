<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $user = $request->user();
        
        $redirectRoute = $user->isUserAdmin() || $user->isDbStorageAdmin() || $user->isSuperadmin() 
            ? route('admin.dashboard', absolute: false) 
            : route('myDocuments', absolute: false);
        
        if ($user->hasVerifiedEmail()) {
            return redirect()->intended($redirectRoute . '?verified=1');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect()->intended($redirectRoute . '?verified=1');
    }
}
