<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            // Optional: UserController::store auto-generates a temporary
            // password when this is omitted (see its docblock) — it must
            // NOT be `required` here, or that generation branch is
            // unreachable (validation would reject the request before the
            // controller ever runs). Still validated as a real password
            // when one IS supplied.
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(array_map(fn (Role $role) => $role->value, Role::cases()))],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
        ];
    }
}
