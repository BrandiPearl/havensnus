import { NextResponse } from "next/server";

const RATES_URL = "https://open.er-api.com/v6/latest/AUD";

export const revalidate = 21600;

export async function GET() {
  try {
    const res = await fetch(RATES_URL, { next: { revalidate: 21600 } });
    if (!res.ok) {
      return NextResponse.json({ base: "AUD", rates: { AUD: 1 } }, { status: 200 });
    }
    const data = (await res.json()) as { rates?: Record<string, number> };
    const nzd = data.rates?.NZD;
    return NextResponse.json({
      base: "AUD",
      rates: nzd ? { AUD: 1, NZD: nzd } : { AUD: 1 },
    });
  } catch {
    return NextResponse.json({ base: "AUD", rates: { AUD: 1 } }, { status: 200 });
  }
}
