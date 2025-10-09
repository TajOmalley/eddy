import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return instructions to download from GitHub releases
    // In production, you would serve the actual Electron app binary
    const downloadInfo = {
      message: 'Download the LearnCanvas desktop app',
      downloadUrl: 'https://github.com/your-username/learncanvas/releases/latest',
      instructions: [
        '1. Download the latest release for your operating system',
        '2. Install and run the LearnCanvas desktop app',
        '3. Return to this page and click "Begin Learning" again'
      ]
    };

    return NextResponse.json(downloadInfo);

  } catch (error) {
    console.error('Error providing download info:', error);
    return NextResponse.json({ error: 'Failed to get download information' }, { status: 500 });
  }
}
