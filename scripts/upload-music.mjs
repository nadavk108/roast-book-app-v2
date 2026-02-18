#!/usr/bin/env node
/**
 * Uploads the background music file to Supabase Storage.
 * Run: node scripts/upload-music.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local manually
function loadEnv() {
  const envPath = new URL('../.env.local', import.meta.url).pathname;
  if (!existsSync(envPath)) throw new Error('.env.local not found');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const MP3_PATH = '/Users/I754385/Downloads/producesplatinum-vlog-hip-hop-483574.mp3';
const STORAGE_PATH = 'assets/background_music.mp3';
const BUCKET = 'roast-books';

async function upload() {
  // Update bucket to allow audio files
  console.log('Updating bucket to allow audio MIME types...');
  const { error: bucketError } = await supabase.storage.updateBucket(BUCKET, {
    public: true,
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav',
    ],
  });
  if (bucketError) {
    console.error('❌ Bucket update failed:', bucketError.message);
    process.exit(1);
  }
  console.log('✅ Bucket updated');

  console.log(`\nUploading ${MP3_PATH} → ${BUCKET}/${STORAGE_PATH} ...`);
  const fileBuffer = readFileSync(MP3_PATH);
  const sizeMb = (fileBuffer.length / 1024 / 1024).toFixed(1);
  console.log(`File size: ${sizeMb}MB`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, fileBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
  console.log('\n✅ Upload complete!');
  console.log('\nAdd this to .env.local and Vercel:');
  console.log(`VIDEO_BACKGROUND_MUSIC_URL=${data.publicUrl}`);
}

upload();
