import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, validationError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = credentialsSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      return apiError("Email or password is incorrect.", 401);
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return apiError("Unable to sign in.", 500);
  }
}
