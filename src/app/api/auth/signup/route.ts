import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, validationError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = credentialsSchema.parse(await request.json());
    const passwordHash = await hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
      },
      select: { id: true, email: true },
    });

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("An account with this email already exists.", 409);
    }
    return apiError("Unable to create your account.", 500);
  }
}
