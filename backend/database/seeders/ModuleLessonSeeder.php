<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleLessonSeeder extends Seeder
{
    private const PLACEHOLDER_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');

        $modules = [
            [
                'title' => 'Module 1: Security Foundations',
                'description' => 'Core concepts of cybersecurity: CIA triad, threat actors, and risk basics.',
                'lessons' => [
                    ['title' => 'What Is Cybersecurity?', 'minutes' => 12],
                    ['title' => 'The CIA Triad Explained', 'minutes' => 15],
                    ['title' => 'Common Threat Actors', 'minutes' => 10],
                ],
            ],
            [
                'title' => 'Module 2: Networking Basics',
                'description' => 'Understanding networks, protocols, and where attacks happen.',
                'lessons' => [
                    ['title' => 'How the Internet Works', 'minutes' => 18],
                    ['title' => 'TCP/IP and Ports', 'minutes' => 20],
                ],
            ],
            [
                'title' => 'Module 3: Common Attacks & Defenses',
                'description' => 'Phishing, malware, and the defenses that stop them.',
                'lessons' => [
                    ['title' => 'Phishing and Social Engineering', 'minutes' => 14],
                    ['title' => 'Malware Types and Prevention', 'minutes' => 16],
                    ['title' => 'Firewalls and Antivirus Basics', 'minutes' => 13],
                ],
            ],
            [
                'title' => 'Module 4: Safe Practices',
                'description' => 'Practical habits for staying secure day to day.',
                'lessons' => [
                    ['title' => 'Password Hygiene and MFA', 'minutes' => 11],
                    ['title' => 'Safe Browsing and Email Habits', 'minutes' => 9],
                ],
            ],
        ];

        foreach ($modules as $moduleIndex => $moduleData) {
            $module = Module::create([
                'course_id' => $course->id,
                'title' => $moduleData['title'],
                'description' => $moduleData['description'],
                'order' => $moduleIndex,
            ]);

            foreach ($moduleData['lessons'] as $lessonIndex => $lessonData) {
                Lesson::create([
                    'module_id' => $module->id,
                    'title' => $lessonData['title'],
                    'content' => "Lesson content for \"{$lessonData['title']}\" covering key concepts with examples and a short recap.",
                    'video_url' => self::PLACEHOLDER_VIDEO,
                    'video_start_seconds' => 0,
                    'video_end_seconds' => $lessonData['minutes'] * 60,
                    'estimated_minutes' => $lessonData['minutes'],
                    'order' => $lessonIndex,
                ]);
            }
        }
    }
}
