import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Policy } from '@/types/policy';

export async function GET(request: Request) {
  try {
    // Read the filtered CSV file from the data directory
    const csvPath = path.join(process.cwd(), 'data', 'uk_ai_policy_filtered.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'Data file not found. Please ensure uk_ai_policy_filtered.csv is in the /data folder.' },
        { status: 404 }
      );
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV with explicit type conversion
    const parseResult = Papa.parse<Policy>(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transform: (value, field) => {
        // Convert numeric fields to numbers
        const fieldName = String(field); // Ensure field is treated as a string
        if (['year', 'month', 'quarter', 'days_since_published', 'summary_word_count', 'topics_count'].includes(fieldName)) {
          return value ? Number(value) : 0;
        }
        return value;
      },
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept');
    const priority = searchParams.get('priority');
    const policyType = searchParams.get('policyType');
    const sector = searchParams.get('sector');
    const aiApplication = searchParams.get('aiApplication');

    let filteredData = parseResult.data;

    // Apply filters
    if (dept) {
      filteredData = filteredData.filter((policy) => policy.dept === dept);
    }
    if (priority) {
      filteredData = filteredData.filter((policy) => policy.priority_category === priority);
    }
    if (policyType) {
      filteredData = filteredData.filter((policy) => policy.policy_type === policyType);
    }
    if (sector) {
      filteredData = filteredData.filter((policy) => policy.sector_focus === sector);
    }
    if (aiApplication) {
      filteredData = filteredData.filter((policy) => policy.ai_application === aiApplication);
    }

    return NextResponse.json({
      data: filteredData,
      total: filteredData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error reading policy data:', error);
    return NextResponse.json(
      { error: 'Failed to load policy data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
