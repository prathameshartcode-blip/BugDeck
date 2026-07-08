import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function escapeCsv(val: string): string {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const priorityFilter = req.nextUrl.searchParams.get('priority');
  const moduleFilter   = req.nextUrl.searchParams.get('module');
  const statusFilter   = req.nextUrl.searchParams.get('status');
  const idsParam       = req.nextUrl.searchParams.get('ids');

  let query = supabase
    .from('cards')
    .select('*, modules(name)')
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

  const { data: testCases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // All columns — matches exactly what the import expects
  const headers = [
    'Created At',
    'Module',
    'Title',
    'Description',
    'Steps',
    'Expected Result',
    'Status',
    'Screenshot URL',
    'Priority',
    'Actual Result',
    'Notes',
  ];

  const rows = (testCases || []).map((tc: any) => [
    escapeCsv(tc.created_at || ''),
    escapeCsv(tc.modules?.name || ''),
    escapeCsv(tc.title || ''),
    escapeCsv(tc.description || ''),
    escapeCsv((tc.steps || []).map((s: any, i: number) => `${s.order || i + 1}. ${s.action}`).join(' | ')),
    escapeCsv(tc.expected_result || ''),
    // Export status as lowercase so re-importing always matches STATUS_MAP correctly
    escapeCsv((tc.column_id || 'open').toLowerCase()),
    escapeCsv(tc.screenshot_url || ''),
    escapeCsv(tc.priority || 'medium'),
    escapeCsv(tc.actual_result || ''),
    escapeCsv(tc.notes || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // UTF-8 BOM so Excel opens it correctly
  return new NextResponse('\uFEFF' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bug-list-${projectId}.csv"`,
    },
  });
}