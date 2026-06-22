import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RefactoringManager } from '@/server/refactor/RefactoringManager';

export const dynamic = 'force-dynamic';

const RenameCollectionSchema = z.object({
  action: z.literal('renameCollection'),
  fromNs: z.string().min(1),
  toNs: z.string().min(1),
});

const RenameFieldSchema = z.object({
  action: z.literal('renameField'),
  namespace: z.string().min(1),
  oldKey: z.string().min(1),
  newKey: z.string().min(1),
});

const DeleteFieldSchema = z.object({
  action: z.literal('deleteField'),
  namespace: z.string().min(1),
  key: z.string().min(1),
});

const RefactorAction = z.discriminatedUnion('action', [
  RenameCollectionSchema,
  RenameFieldSchema,
  DeleteFieldSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RefactorAction.parse(body);

    switch (parsed.action) {
      case 'renameCollection':
        await RefactoringManager.renameCollection(parsed.fromNs, parsed.toNs);
        break;
      case 'renameField':
        await RefactoringManager.renameField(parsed.namespace, parsed.oldKey, parsed.newKey);
        break;
      case 'deleteField':
        await RefactoringManager.deleteField(parsed.namespace, parsed.key);
        break;
    }

    return NextResponse.json({ success: true, message: `Refactor operation ${parsed.action} completed successfully.` });

  } catch (err: any) {
    console.error('[RefactorAPI] POST failed:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof z.ZodError
        ? `Validation failed: ${JSON.stringify(err.format())}`
        : err.message
    }, { status: 500 });
  }
}
