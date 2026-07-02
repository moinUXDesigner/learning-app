import { Link } from 'react-router-dom';
import { useStudentCourses } from '../../api/hooks/useCourses';
import { Card } from '../../components/Card';

export function MyCourses() {
  const { data: courses, isLoading, error } = useStudentCourses();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your courses…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your courses. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">My Courses</h1>

      {!courses || courses.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">You haven&apos;t been assigned any courses yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} to={`/student/course-detail/${course.id}`}>
              <Card className="h-full transition hover:border-indigo-300 hover:shadow-md">
                <h2 className="text-base font-semibold text-gray-800">{course.title}</h2>
                {course.category && (
                  <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {course.category}
                  </span>
                )}
                <p className="mt-2 line-clamp-3 text-sm text-gray-500">{course.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{course.difficulty_level ?? 'N/A'}</span>
                  {course.duration_days && <span>{course.duration_days} days</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
