<?php

namespace App\Modules\Department\Controllers;

use App\Modules\Department\Models\Department;
use App\Modules\Department\Requests\StoreDepartmentRequest;
use App\Modules\Department\Requests\UpdateDepartmentRequest;
use App\Modules\Department\Resources\DepartmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $departments = Department::all();

        return response()->json([
            'success' => true,
            'data'    => DepartmentResource::collection($departments),
        ]);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = Department::create([
            'name'        => $request->name,
            'slug'        => $request->slug ?? Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'data'    => new DepartmentResource($department),
            'message' => 'Department created successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new DepartmentResource($department),
        ]);
    }

    public function update(UpdateDepartmentRequest $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);
        $department->update($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new DepartmentResource($department),
            'message' => 'Department updated successfully.',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully.',
        ]);
    }
}
