import { Link } from 'react-router-dom';
import { useCertificates } from '../../api/hooks/useCertificates';
import { Card } from '../../components/Card';

export function Certificates() {
  const { data: certificates, isLoading, error } = useCertificates();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your certificates…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your certificates. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">My Certificates</h1>

      {!certificates || certificates.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No certificates yet — complete a course to earn your first certificate.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <h2 className="text-base font-semibold text-gray-800">
                {certificate.course?.title ?? `Course #${certificate.course_id}`}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Issued {new Date(certificate.issued_at).toLocaleDateString()}
              </p>
              <p className="mt-2 font-mono text-xs text-gray-400">{certificate.certificate_number}</p>
              <Link
                to={`/verify/${certificate.certificate_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View verification page →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
