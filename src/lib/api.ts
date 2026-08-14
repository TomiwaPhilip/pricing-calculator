import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function validationError(error: ZodError) {
  return apiError(
    error.issues[0]?.message ?? "Please correct the highlighted fields.",
    400,
    error.flatten(),
  );
}
