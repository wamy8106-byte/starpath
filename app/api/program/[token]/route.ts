// app/api/program/[token]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  projectProgramForClient,
  validateProgramToken,
} from "@/lib/program";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenRaw } = await params;
    const tokenResult = validateProgramToken(tokenRaw);

    if (!tokenResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            tokenResult.reason === "missing"
              ? "Missing token"
              : "Malformed token",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("programs")
      .select("token,zodiac,content,is_paid")
      .eq("token", tokenResult.token)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Program not found" },
          { status: 404 }
        );
      }

      console.error("Supabase program lookup failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { success: false, error: "Program lookup failed" },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Program not found" },
        { status: 404 }
      );
    }

    const program = projectProgramForClient(data);
    if (!program) {
      console.error("Program row has malformed content", {
        token: tokenResult.token,
      });
      return NextResponse.json(
        { success: false, error: "Malformed program data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, program }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/program/[token] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
