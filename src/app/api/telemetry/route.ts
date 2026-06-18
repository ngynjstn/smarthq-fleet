import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

//the contract : what a valid telemtry reading must look like
// anything that doesnt match get rejected before it even touches the db
const TelemetrySchema = z.object({
    applianceId: z.string().min(1),
    metric: z.enum(["TEMP_C", "DOOR_OPEN", "POWER_W", "CYCLE_STATE", "VIBRATION_MM_S"]),
    value: z.number(),
});

export async function POST(request: Request) {
    const body = await request.json();
    
    //safeparse returns success or error it never throws
    const parsed = TelemetrySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid telemetry", details: parsed.error.flatten() },
            { status: 400 } // 400 = "you sent me bad data"
        );
    }

    //parsed data is now full typed and guarenteed
    const reading = await prisma.reading.create({data: parsed.data});

    return NextResponse.json(reading, { status: 201 });
}

  