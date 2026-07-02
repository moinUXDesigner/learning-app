<?php

namespace App\Exceptions;

use App\Enums\CourseStatus;
use Exception;

/**
 * Thrown by CourseWorkflowService when an attempted course status
 * transition is not part of the allowed workflow graph, or the acting
 * user is not authorized to perform the transition.
 */
class InvalidCourseTransitionException extends Exception
{
    public static function forTransition(CourseStatus $from, CourseStatus $to): self
    {
        return new self("Cannot transition course from {$from->value} to {$to->value}.");
    }

    public static function unauthorized(CourseStatus $from, CourseStatus $to): self
    {
        return new self("Not authorized to transition course from {$from->value} to {$to->value}.");
    }
}
