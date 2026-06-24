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

  const priorityFilter = req.nextUrl.searchParams.get('priority') || 'all';
  const moduleFilter   = req.nextUrl.searchParams.get('module')   || 'all';
  const statusFilter   = req.nextUrl.searchParams.get('status')   || 'all';

  let query = supabase
    .from('cards')
    .select('*, modules(name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);
  if (moduleFilter   !== 'all') query = query.eq('module_id', moduleFilter);
  if (statusFilter   !== 'all') query = query.eq('column_id', statusFilter);

  const { data: testCases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // All columns — matches exactly what the import expects
  const headers = [
    'Bug ID',
    'Title',
    'Module',
    'Status',
    'Priority',
    'Description',
    'Steps',
    'Expected Result',
    'Actual Result',
    'Notes',
    'Screenshot URL',
    'Created At',
  ];

  const rows = (testCases || []).map((tc: any) => [
    escapeCsv(tc.id),
    escapeCsv(tc.title || ''),
    escapeCsv(tc.modules?.name || ''),
    // Export status as lowercase so re-importing always matches STATUS_MAP correctly
    escapeCsv((tc.column_id || 'open').toLowerCase()),
    escapeCsv(tc.priority || 'medium'),
    escapeCsv(tc.description || ''),
    escapeCsv((tc.steps || []).map((s: any, i: number) => `${s.order || i + 1}. ${s.action}`).join(' | ')),
    escapeCsv(tc.expected_result || ''),
    escapeCsv(tc.actual_result || ''),
    escapeCsv(tc.notes || ''),
    escapeCsv(tc.screenshot_url || ''),
    escapeCsv(tc.created_at || ''),
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