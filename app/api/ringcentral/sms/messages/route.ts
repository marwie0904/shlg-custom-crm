import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/ringcentral/sms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const phoneNumber = searchParams.get("phoneNumber") || undefined;
    const direction = searchParams.get("direction") as "Inbound" | "Outbound" | undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const perPage = searchParams.get("perPage") ? parseInt(searchParams.get("perPage")!) : undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;

    const result = await getMessages({
      phoneNumber,
      direction,
      dateFrom,
      dateTo,
      perPage,
      page,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[RingCentral SMS Messages] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
