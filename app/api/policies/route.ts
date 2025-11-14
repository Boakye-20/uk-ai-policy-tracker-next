import { NextResponse } from 'next/server';
import { getPolicies, filterPolicies } from '@/lib/data';

// This prevents static optimization and ensures the route is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Get search params from the URL
        const { searchParams } = new URL(request.url);
        const dept = searchParams.get('dept');
        const priority = searchParams.get('priority');
        const policyType = searchParams.get('policyType');
        const sector = searchParams.get('sector');
        const aiApplication = searchParams.get('aiApplication');

        // Get all policies
        const allPolicies = getPolicies();

        // Apply filters
        const filteredData = filterPolicies(allPolicies, {
            dept,
            priority,
            policyType,
            sector,
            aiApplication
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
