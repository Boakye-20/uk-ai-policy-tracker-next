import { NextResponse } from 'next/server';
import { getPolicies, filterPolicies } from '@/lib/data';

// This prevents static optimization and ensures the route is dynamic
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }
) {
    try {
        const { dept, priority, policyType, sector, aiApplication } = searchParams;

        // Get all policies
        const allPolicies = getPolicies();

        // Apply filters
        const filteredData = filterPolicies(allPolicies, {
            dept: Array.isArray(dept) ? dept[0] : dept,
            priority: Array.isArray(priority) ? priority[0] : priority,
            policyType: Array.isArray(policyType) ? policyType[0] : policyType,
            sector: Array.isArray(sector) ? sector[0] : sector,
            aiApplication: Array.isArray(aiApplication) ? aiApplication[0] : aiApplication
        });

        return NextResponse.json({ data: filteredData });
    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch policies' },
            { status: 500 }
        );
    }
}
