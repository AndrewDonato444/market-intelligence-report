/**
 * Report templates API — list and create templates.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
} from "@/lib/services/report-templates";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await getTemplates(userId);
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name: string; marketId: string; config: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || !body.marketId) {
    return NextResponse.json(
      { error: "name and marketId are required" },
      { status: 400 }
    );
  }

  const template = await createTemplate(userId, {
    name: body.name,
    marketId: body.marketId,
    config: body.config as {
      sections?: string[];
      dateRange?: { start: string; end: string };
      customPrompts?: Record<string, string>;
    },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }

  return NextResponse.json(template, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("id");
  if (!templateId) {
    return NextResponse.json(
      { error: "Template ID is required" },
      { status: 400 }
    );
  }

  await deleteTemplate(userId, templateId);
  return NextResponse.json({ success: true });
}
