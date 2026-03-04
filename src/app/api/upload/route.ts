import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            if (!(file instanceof File)) {
                return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
            }

            const blob = await put(filename || file.name, file, {
                access: 'public',
            });

            return NextResponse.json({ success: true, url: blob.url });
        }

        if (!filename) {
            return NextResponse.json({ success: false, error: 'Filename is required' }, { status: 400 });
        }

        if (!request.body) {
            return NextResponse.json({ success: false, error: 'No body provided' }, { status: 400 });
        }

        const blob = await put(filename, request.body, {
            access: 'public',
        });

        return NextResponse.json({ success: true, url: blob.url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
