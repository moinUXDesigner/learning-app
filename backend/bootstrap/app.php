<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureUserBelongsToOrganization;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        /*
         * Sanctum's SPA cookie-session mode requires the actual session
         * to be started (and cookies encrypted/queued, and CSRF
         * validated) on API requests, not just the "mark this request as
         * stateful" middleware — those three are normally only present in
         * the `web` group. EnsureFrontendRequestsAreStateful only flags
         * the request as eligible for cookie auth; without StartSession
         * the session store is never attached to the request at all
         * (Auth::attempt()/session()->regenerate() would throw
         * "Session store not set on request."). So the api group needs
         * this superset for stateful auth to function end-to-end.
         */
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
            EncryptCookies::class,
            StartSession::class,
            ValidateCsrfToken::class,
        ]);

        $middleware->alias([
            'org.scope' => EnsureUserBelongsToOrganization::class,
            'role' => EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        /*
         * Normalize every exception thrown while handling an API (or
         * otherwise JSON-expecting) request into a single
         * {message, errors, status_code} JSON shape, matching the shape
         * already used by EnsureRole/EnsureUserBelongsToOrganization.
         */
        $wantsJson = fn (Request $request): bool => $request->is('api/*') || $request->expectsJson();

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            return response()->json([
                'message' => $e->getMessage() ?: 'This action is unauthorized.',
                'errors' => [],
                'status_code' => 403,
            ], 403);
        });

        $exceptions->render(function (ValidationException $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            return response()->json([
                'message' => $e->getMessage() ?: 'The given data was invalid.',
                'errors' => $e->errors(),
                'status_code' => 422,
            ], 422);
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            return response()->json([
                'message' => 'The requested resource was not found.',
                'errors' => [],
                'status_code' => 404,
            ], 404);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            return response()->json([
                'message' => $e->getMessage() ?: 'The requested resource was not found.',
                'errors' => [],
                'status_code' => 404,
            ], 404);
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            $status = $e->getStatusCode();

            return response()->json([
                'message' => $e->getMessage() ?: 'An error occurred.',
                'errors' => [],
                'status_code' => $status,
            ], $status);
        });

        $exceptions->render(function (\Throwable $e, Request $request) use ($wantsJson) {
            if (! $wantsJson($request)) {
                return null;
            }

            if (app()->hasDebugModeEnabled()) {
                return null;
            }

            return response()->json([
                'message' => 'Server error.',
                'errors' => [],
                'status_code' => 500,
            ], 500);
        });
    })->create();
