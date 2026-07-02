<?php

namespace App\Enums;

enum CourseStatus: string
{
    case Draft = 'draft';
    case SubmittedForApproval = 'submitted_for_approval';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Published = 'published';
    case Archived = 'archived';
}
