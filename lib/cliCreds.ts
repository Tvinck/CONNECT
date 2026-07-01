/**
 * Shared Higgsfield CLI credentials manager.
 * Loads credentials from Supabase, runs a lightweight CLI command so the
 * Go binary can auto-refresh the access_token via the refresh_token,
 * then saves any updated tokens back to Supabase.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sets up /tmp credentials directory and returns tmpBase path.
 * Optionally runs `generate list` so the Go binary can refresh an expired token.
 */
export async function setupCredentials(opts: { withRefresh?: boolean } = {}): Promise<string> {
  const tmpBase = os.tmpdir();
  const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
  const configDir2 = path.join(tmpBase, 'higgsfield');
  const credPath1 = path.join(configDir1, 'credentials.json');
  const credPath2 = path.join(configDir2, 'credentials.json');

  fs.mkdirSync(configDir1, { recursive: true });
  fs.mkdirSync(configDir2, { recursive: true });

  // Load latest credentials from Supabase
  const { data } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', 'cli_credentials')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const fallback = JSON.stringify({
    access_token: process.env.HIGGSFIELD_CLI_TOKEN || '',
    refresh_token: process.env.HIGGSFIELD_CLI_REFRESH || ''
  });

  const credsText = data?.video_url || fallback;
  fs.writeFileSync(credPath1, credsText);
  fs.writeFileSync(credPath2, credsText);

  if (opts.withRefresh) {
    // Run a lightweight list command — the Go binary refreshes expired tokens automatically
    try {
      await execAsync(
        'node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate list --json',
        {
          env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase },
          timeout: 20000
        }
      );

      // Read back (Go may have written a new access_token)
      const updatedText = fs.readFileSync(credPath1, 'utf8');
      if (updatedText !== credsText) {
        console.log('[cliCreds] Token refreshed — saving to Supabase');
        await supabase.from('factory_generations').insert({
          prompt: 'cli_credentials',
          video_url: updatedText
        });
      }
    } catch (err: any) {
      // If the refresh itself fails (network, binary error) just log and continue
      console.warn('[cliCreds] Pre-flight refresh failed:', err.stderr || err.message);
    }
  }

  return tmpBase;
}

/**
 * After running a CLI command, call this to persist any token updates the
 * Go binary wrote to the credentials file.
 */
export async function persistRefreshedCredentials(tmpBase: string, credsBefore: string): Promise<void> {
  const credPath = path.join(tmpBase, '.config', 'higgsfield', 'credentials.json');
  try {
    const updated = fs.readFileSync(credPath, 'utf8');
    if (updated !== credsBefore) {
      console.log('[cliCreds] Token updated after command — persisting to Supabase');
      await supabase.from('factory_generations').insert({
        prompt: 'cli_credentials',
        video_url: updated
      });
    }
  } catch {
    // Credentials file not updated — no action needed
  }
}
