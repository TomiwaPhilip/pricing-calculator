import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { validationError } from "@/lib/api";
import { requireApiUser } from "@/lib/request-user";
import { buildSummaryReport } from "@/lib/reports";
import { reportRangeSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const range = reportRangeSchema.parse({
      from: request.nextUrl.searchParams.get("from"),
      to: request.nextUrl.searchParams.get("to"),
    });
    return NextResponse.json(await buildSummaryReport(auth.user.id, range));
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    throw error;
  }
}
