<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * NOTE: certificate *issuance* (detecting course completion and creating a
 * Certificate row) is out of scope for this task - it's a separate,
 * not-yet-built trigger (likely to live alongside course-completion
 * detection logic in a future phase). This controller only exposes
 * read/verify endpoints against whatever Certificate rows already exist.
 */
class CertificateController extends Controller
{
    /**
     * The authenticated student's own certificates.
     */
    public function index(Request $request): JsonResponse
    {
        $certificates = Certificate::query()
            ->where('student_id', $request->user()->id)
            ->with('course')
            ->latest('issued_at')
            ->paginate(15);

        return response()->json($certificates);
    }

    /**
     * Public verification lookup (no auth). Backs a frontend HTML
     * verification page, not a PDF - returns JSON either way.
     */
    public function verify(string $certificateNumber): JsonResponse
    {
        $certificate = Certificate::query()
            ->where('certificate_number', $certificateNumber)
            ->with(['student', 'course'])
            ->first();

        if ($certificate === null) {
            return response()->json([
                'message' => 'No certificate was found for this certificate number.',
                'errors' => [],
                'status_code' => 404,
            ], 404);
        }

        return response()->json([
            'certificate_number' => $certificate->certificate_number,
            'issued_at' => $certificate->issued_at,
            'verification_url' => $certificate->verification_url,
            'student_name' => $certificate->student?->name,
            'course_title' => $certificate->course?->title,
        ]);
    }
}
