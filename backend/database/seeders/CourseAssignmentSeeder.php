<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');
        $teacher1 = User::where('email', 'teacher1@learntrack.test')->firstOrFail();
        $students = User::where('email', 'like', 'student%@learntrack.test')->orderBy('email')->get();

        foreach ($students as $student) {
            CourseAssignment::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher1->id,
                'student_id' => $student->id,
                'batch_id' => null,
                'start_date' => now(),
                'end_date' => now()->copy()->addDays(30),
                'status' => 'active',
            ]);
        }
    }
}
