import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('KEY:', key ? key.substring(0, 15) + '...' : 'undefined');

const supabase = createClient(url, key);

async function run() {
  try {
    console.log('Testing users select...');
    const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
    if (userError) {
      console.error('Error fetching users:', userError.message);
    } else {
      console.log('Users count:', users.length);
    }

    console.log('Testing trades select...');
    const { data: trades, error: tradeError } = await supabase.from('trades').select('*').limit(1);
    if (tradeError) {
      console.error('Error fetching trades:', tradeError.message);
    } else {
      console.log('Trades count:', trades.length);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
