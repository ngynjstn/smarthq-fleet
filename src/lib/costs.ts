// the cost model: tunrs appliance health into memory

// two nums per appliance
// emergencyrepair - what an unplanne dfailure cost
// proactiverepair - what a planned failure cost

export type ApplianceType = "REFRIGERATOR" | "WASHER" | "DRYER" | "OVEN";

export type CostProfile = {
    emergencyRepair: number; //usd uplanned 
    proactiveRepair: number; //usd planned/scheduled
};

export const COST_MODEL: Record<ApplianceType, CostProfile> = {
    REFRIGERATOR: { emergencyRepair: 900, proactiveRepair: 250 }, //inc food spoliage
    WASHER: { emergencyRepair: 450, proactiveRepair: 200 },
    DRYER: { emergencyRepair: 400, proactiveRepair: 150 },
    OVEN: { emergencyRepair: 500, proactiveRepair: 220 },
};

//fallback so the math never crashes on an unexpected type from bad data
const DEFAULT_PROFILE: CostProfile = { emergencyRepair: 400, proactiveRepair: 200 };


export function costProfile(type: string): CostProfile {
    return COST_MODEL[type as ApplianceType] ?? DEFAULT_PROFILE;
}

//money saved when an issue is caught early instead of running to failure
export function savingsPerCatch(type: string): number {
    const { emergencyRepair, proactiveRepair } = costProfile(type);
    return emergencyRepair - proactiveRepair;
}

