<?php

namespace App\Enums;

enum ActivityType: string
{
    case LessonWatch = 'lesson_watch';
    case Notes = 'notes';
    case QuizPass = 'quiz_pass';
    case Assignment = 'assignment';
    case Project = 'project';
    case Capstone = 'capstone';
    case Streak = 'streak';
    case EarlyBonus = 'early_bonus';
    case LatePenalty = 'late_penalty';
}
