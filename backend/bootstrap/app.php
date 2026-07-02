<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureUserBelongsToOrganization;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
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
         * EnsureFrontendRequestsAreStateful is the ONLY thing needed here.
         * For requests it recognizes as "from frontend" (matching
         * SANCTUM_STATEFUL_DOMAINS), it internally runs its OWN nested
         * pipeline of EncryptCookies -> AddQueuedCookiesToResponse ->
         * StartSession -> ValidateCsrfToken before calling next(). Also
         * prepending those same three classes here (as an earlier revision
         * of this file did) made them run TWICE per request: the second
         * EncryptCookies pass tried to decrypt a cookie value that the
         * first pass had already decrypted, threw, and silently nulled the
         * cookie out — so StartSession's second pass never found a valid
         * incoming session ID and created a brand new session on every
         * single request, permanently desyncing the CSRF token the client
         * held from the one the (fresh) session expected. Do not re-add
         * EncryptCookies/StartSession/ValidateCsrfToken here.
         */
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
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
