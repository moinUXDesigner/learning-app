import { Link, useParams } from 'react-router-dom';
import { useCertificateVerification } from '../../api/hooks/useCertificates';
import { ApiError } from '../../api/types';

export function CertificateVerify() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const { data, isLoading, error } = useCertificateVerification(certificateNumber);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-900">Certificate Verification</h1>

        {isLoading && <p className="mt-6 text-sm text-gray-500">Checking certificate…</p>}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof ApiError ? error.message : 'No certificate was found for this certificate number.'}
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-3 rounded-lg bg-green-50 px-4 py-4 text-left">
            <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <span aria-hidden>&#10003;</span> Valid certificate
            </p>
            <dl className="space-y-1 text-sm text-gray-700">
              <div>
                <dt className="font-medium text-gray-500">Certificate Number</dt>
                <dd>{data.certificate_number}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Student</dt>
                <dd>{data.student_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Course</dt>
                <dd>{data.course_title ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Issued</dt>
                <dd>{new Date(data.issued_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        )}

        <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to LearnTrack
        </Link>
      </div>
    </div>
  );
}
