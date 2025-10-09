import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First, try to communicate with an already running Electron app
    // Electron app now uses port 3001 by default
    const electronPort = 3001;
    
    try {
      const response = await fetch(`http://localhost:${electronPort}/api/launch-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Launch] Found running Electron app on port ${electronPort}`);
        return NextResponse.json({ 
          success: true, 
          message: 'Learning overlay launched successfully',
          projectId: result.projectId,
          port: electronPort
        });
      }
    } catch (error) {
      console.log(`[Launch] No running Electron app found on port ${electronPort}`);
    }

    // If no running Electron app found, launch a new one
    try {
      console.log(`[Launch] No running Electron app found, launching new instance for project ${projectId}`);
      
      // Get the project root directory
      const projectRoot = process.cwd();
      
      // Try different approaches to launch Electron
      let electronProcess;
      
      // Method 1: Try using the test:learning script (which works)
      try {
        electronProcess = spawn('npm', ['run', 'test:learning'], {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore',
          shell: true, // Use shell on Windows
          env: {
            ...process.env,
            LAUNCH_PROJECT_ID: projectId,
            LAUNCH_USER_ID: userId,
            LAUNCH_TIMESTAMP: new Date().toISOString()
          }
        });
        
        electronProcess.unref();
        console.log('[Launch] Launched via test:learning script');
      } catch (error) {
        console.log('[Launch] test:learning script failed, trying direct electron path');
        
        // Method 2: Try direct electron path with the correct entry point
        const electronPath = path.join(projectRoot, 'node_modules', '.bin', 'electron.cmd');
        const electronExe = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
        const mainFile = path.join(projectRoot, 'src', 'index.js');
        
        if (require('fs').existsSync(electronPath)) {
          electronProcess = spawn(electronPath, [mainFile, '--project-id', projectId, '--user-id', userId], {
            cwd: projectRoot,
            detached: true,
            stdio: 'ignore',
            shell: true,
            env: {
              ...process.env,
              LAUNCH_PROJECT_ID: projectId,
              LAUNCH_USER_ID: userId,
              LAUNCH_TIMESTAMP: new Date().toISOString()
            }
          });
        } else if (require('fs').existsSync(electronExe)) {
          electronProcess = spawn(electronExe, [mainFile, '--project-id', projectId, '--user-id', userId], {
            cwd: projectRoot,
            detached: true,
            stdio: 'ignore',
            shell: true,
            env: {
              ...process.env,
              LAUNCH_PROJECT_ID: projectId,
              LAUNCH_USER_ID: userId,
              LAUNCH_TIMESTAMP: new Date().toISOString()
            }
          });
        } else {
          throw new Error('Electron executable not found');
        }
        
        electronProcess.unref();
        console.log('[Launch] Launched via direct electron path');
      }

      // Give the app a moment to start up
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try to communicate with the newly launched app
      console.log('[Launch] Attempting to communicate with newly launched Electron app...');
      try {
        const response = await fetch(`http://localhost:${electronPort}/api/launch-project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            userId,
            timestamp: new Date().toISOString()
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[Launch] Successfully communicated with Electron app on port ${electronPort}`);
          return NextResponse.json({ 
            success: true, 
            message: 'Learning overlay launched successfully',
            projectId: result.projectId,
            port: electronPort
          });
        }
      } catch (error) {
        console.log(`[Launch] Could not communicate with Electron app on port ${electronPort}:`, error.message);
      }

      // If we still can't communicate, return success anyway since we launched the app
      return NextResponse.json({ 
        success: true, 
        message: 'Electron app launched - overlay should appear shortly',
        projectId,
        note: 'The learning overlay should appear on your desktop. If it doesn\'t, try clicking "Begin Learning" again.'
      });

    } catch (error) {
      console.error('[Launch] Error launching Electron app:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to launch Electron app',
        error: error.message,
        instructions: 'Please run "npm run test:learning" in your terminal to start the Electron app manually.',
        fallback: 'You can also manually start the Electron app and then click "Begin Learning" again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error launching overlay:', error);
    return NextResponse.json({ error: 'Failed to launch overlay' }, { status: 500 });
  }
}