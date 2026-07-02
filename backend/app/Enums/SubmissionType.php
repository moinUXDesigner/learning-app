<?php

namespace App\Enums;

enum SubmissionType: string
{
    case File = 'file';
    case Text = 'text';
    case Screenshot = 'screenshot';
    case Url = 'url';
    case GithubLink = 'github_link';
}
