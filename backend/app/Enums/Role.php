<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'super_admin';
    case OrgAdmin = 'org_admin';
    case Teacher = 'teacher';
    case Student = 'student';
}
