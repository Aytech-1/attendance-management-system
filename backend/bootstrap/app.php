<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn (Request $request) => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $status = 500;
                $message = "An unexpected server error occurred.";
                $errors = null;

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $status = 422;
                    $message = "Validation failed. Please fill all required fields correctly.";
                    $errors = $e->errors();
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $status = 401;
                    $message = "Unauthorized. Session expired or invalid credentials.";
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException || $e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
                    $status = 403;
                    $message = "Forbidden. You do not have permission to perform this action.";
                } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    $status = 404;
                    $message = "Requested resource not found.";
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException) {
                    $status = 429;
                    $message = "Too many requests. Please wait a moment before trying again.";
                } elseif ($e instanceof \Illuminate\Database\QueryException || $e instanceof \PDOException) {
                    $status = 409;
                    $rawMsg = $e->getMessage();
                    if (str_contains($rawMsg, 'Duplicate entry') || str_contains($rawMsg, '1062')) {
                        $message = "Record already exists in the system.";
                    } else {
                        $message = "A database integrity constraint issue occurred.";
                    }
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $status = $e->getStatusCode();
                    $message = $e->getMessage() ?: "HTTP Error {$status}";
                } else {
                    $status = 500;
                    $message = "Server error. Please try again later.";
                }

                $payload = [
                    'success' => false,
                    'message' => $message,
                ];

                if (!empty($errors)) {
                    $payload['errors'] = $errors;
                }

                return response()->json($payload, $status);
            }
        });
    })->create();
