import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  escapeCsv,
  getDefaultExportConfig,
  normalizeExportConfig,
  getExportHeaders,
  formatExportRow,
  cardRowToTestCase,
  getModuleNameFromCardRow,
  getTesterNameFromCardRow,
} from '@/lib/export-columns';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const priorityFilter = req.nextUrl.searchParams.get('priority');
  const moduleFilter   = req.nextUrl.searchParams.get('module');
  const statusFilter   = req.nextUrl.searchParams.get('status');
  const idsParam       = req.nextUrl.searchParams.get('ids');
  const dateFrom       = req.nextUrl.searchParams.get('dateFrom');
  const dateTo         = req.nextUrl.searchParams.get('dateTo');

  const { data: projectRow } = await supabase
    .from('projects')
    .select('export_config')
    .eq('id', projectId)
    .maybeSingle();

  const exportConfig = projectRow?.export_config
    ? normalizeExportConfig(projectRow.export_config)
    : getDefaultExportConfig();

  let query = supabase
    .from('cards')
    .select('*, modules(name), testers(name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (priorityFilter && priorityFilter !== 'all') {
    const priorities = priorityFilter.split(',').map(p => p.trim()).filter(Boolean);
    if (priorities.length > 0) query = query.in('priority', priorities);
  }
  if (moduleFilter && moduleFilter !== 'all') {
    const modulesArr = moduleFilter.split(',').map(m => m.trim()).filter(Boolean);
    if (modulesArr.length > 0) query = query.in('module_id', modulesArr);
  }
  if (statusFilter && statusFilter !== 'all') {
    const statuses = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in('column_id', statuses);
  }
  if (idsParam) {
    const idsArray = idsParam.split(',').map(id => id.trim()).filter(Boolean);
    if (idsArray.length > 0) {
      query = query.in('id', idsArray);
    }
  }
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo)   query = query.lte('created_at', dateTo);

  const textParam = req.nextUrl.searchParams.get('text');
  if (textParam && textParam.trim()) {
    const escaped = textParam.trim().replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const { data: testCases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = getExportHeaders(exportConfig);

  const rows = (testCases || []).map((row: Record<string, unknown>) => {
    const tc = cardRowToTestCase(row);
    const moduleName = getModuleNameFromCardRow(row);
    const testerName = getTesterNameFromCardRow(row);
    return formatExportRow(tc, exportConfig, 'csv', { moduleName, testerName }).map(escapeCsv);
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  

  return new NextResponse('\uFEFF' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bug-list-${projectId}.csv"`,
    },
  });
}
