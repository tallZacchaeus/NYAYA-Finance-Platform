<?php

namespace App\Modules\RequestType\Controllers;

use App\Modules\RequestType\Models\RequestType;
use App\Modules\RequestType\Requests\StoreRequestTypeRequest;
use App\Modules\RequestType\Requests\UpdateRequestTypeRequest;
use App\Modules\RequestType\Resources\RequestTypeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class RequestTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = RequestType::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => RequestTypeResource::collection($types),
        ]);
    }

    public function store(StoreRequestTypeRequest $request): JsonResponse
    {
        $type = RequestType::create($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new RequestTypeResource($type),
            'message' => 'Request type created.',
        ], 201);
    }

    public function update(UpdateRequestTypeRequest $request, int $id): JsonResponse
    {
        $type = RequestType::findOrFail($id);
        $type->update($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new RequestTypeResource($type),
            'message' => 'Request type updated.',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $type = RequestType::findOrFail($id);

        // Prevent deleting types that are in use
        $inUse = $type->financeRequests()->exists() || $type->internalRequests()->exists();
        if ($inUse) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a request type that is in use.',
            ], 422);
        }

        $type->delete();

        return response()->json([
            'success' => true,
            'message' => 'Request type deleted.',
        ]);
    }
}
