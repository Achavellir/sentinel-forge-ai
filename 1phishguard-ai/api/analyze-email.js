import {
  PLAN_LIMITS,
  authenticate,
  getEnv,
  getSupabaseAdmin,
  readJson,
  send,
} from './_utils.js';

const SYSTEM_PROMPT =
  'You are 1PhishGuard AI, an elite cybersecurity AI. Analyze emails for phishing, social engineering, and scam signals. Return JSON only.';

function normalizeResult(raw) {
  const verdict = String(raw.verdict || 'SUSPICIOUS').toUpperCase();
  const riskScore = Math.min(Math.max(Number(raw.riskScore ?? raw.risk_score ?? 50), 0), 100);
  return {
    verdict: ['SAFE', 'SUSPICIOUS', 'PHISHING'].includes(verdict) ? verdict : 'SUSPICIOUS',
    riskScore,
    verdictTitle: raw.verdictTitle || raw.verdict_title || `${verdict.charAt(0)}${verdict.slice(1).toLowerCase()} email`,
    summary: raw.summary || 'The email contains signals that require review.',
    signals: Array.isArray(raw.signals)
      ? raw.signals.slice(0, 8).map((signal) => ({
          name: signal.name || 'Threat signal',
          description: signal.description || 'Signal detected during analysis.',
          severity: signal.severity || 'medium',
          icon: signal.icon || 'alert',
        }))
      : [],
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations
      : ['Verify sender identity out of band before taking action.'],
    attackType: raw.attackType || raw.attack_type || 'Unknown',
  };
}

function parseClaudeJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude returned non-JSON content.');
    return JSON.parse(match[0]);
  }
}

function heuristicFallback(emailText, focus) {
  const lower = emailText.toLowerCase();
  const risky = [
    ['Urgent language', /urgent|immediately|final notice|act now|within 24 hours/.test(lower)],
    ['Credential request', /password|login|verify your account|reset credentials/.test(lower)],
    ['Payment request', /wire|invoice|bank account|gift card|payment/.test(lower)],
    ['Suspicious link', /http|bit\.ly|tinyurl|login.*\.com/.test(lower)],
    ['Attachment lure', /attachment|attached|document|docuSign|pdf/.test(lower)],
  ].filter(([, present]) => present);
  const score = Math.min(95, risky.length * 18 + (lower.includes('spoof') ? 14 : 0));
  const verdict = score >= 70 ? 'PHISHING' : score >= 35 ? 'SUSPICIOUS' : 'SAFE';
  return normalizeResult({
    verdict,
    riskScore: score,
    verdictTitle: verdict === 'SAFE' ? 'No obvious phishing signal' : 'Phishing indicators detected',
    summary: `Heuristic development fallback analyzed the email with focus: ${focus}. Configure ANTHROPIC_API_KEY for Claude analysis.`,
    attackType: risky.length ? 'Credential theft or payment fraud' : 'None detected',
    signals: risky.map(([name]) => ({
      name,
      description: `${name} appears in the submitted email content.`,
      severity: verdict === 'PHISHING' ? 'high' : 'medium',
      icon: 'alert',
    })),
    recommendations:
      verdict === 'SAFE'
        ? ['Continue normal handling while keeping standard security awareness practices.']
        : ['Do not click links or open attachments.', 'Verify the sender through a trusted channel.', 'Report the message to security.'],
  });
}

async function callClaude(emailText, focus) {
  const apiKey = getEnv('ANTHROPIC_API_KEY', 'VITE_ANTHROPIC_API_KEY');
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') throw new Error('Anthropic API key is missing.');
    return heuristicFallback(emailText, focus);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            'Analyze the email below for phishing risk.',
            `Scan focus: ${focus}`,
            'Return JSON with this exact shape:',
            '{"verdict":"SAFE|SUSPICIOUS|PHISHING","riskScore":0,"verdictTitle":"","summary":"","signals":[{"name":"","description":"","severity":"low|medium|high|critical","icon":""}],"recommendations":[""],"attackType":""}',
            'Email:',
            emailText,
          ].join('\n\n'),
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Anthropic request failed.');
  }

  const text = data.content?.map((part) => part.text || '').join('\n') || '';
  return normalizeResult(parseClaudeJson(text));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supabase = getSupabaseAdmin();
    const user = await authenticate(req, supabase);
    const { emailText, focus = 'Full Analysis' } = await readJson(req);

    if (!emailText || String(emailText).trim().length < 20) {
      return send(res, 400, { error: 'Paste at least 20 characters of email content.' });
    }
    if (String(emailText).length > 50000) {
      return send(res, 400, { error: 'Email content is too long. Limit scans to 50,000 characters.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, scans_used, scans_limit')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    if (profile.plan === 'free' && profile.scans_used >= profile.scans_limit) {
      return send(res, 403, { error: 'Free scan limit reached. Upgrade to continue scanning.' });
    }

    const result = await callClaude(String(emailText), focus);
    const emailPreview = String(emailText).replace(/\s+/g, ' ').trim().slice(0, 180);

    const { error: insertError } = await supabase.from('scans').insert({
      user_id: user.id,
      email_preview: emailPreview,
      verdict: result.verdict,
      risk_score: result.riskScore,
      result_json: result,
    });
    if (insertError) throw insertError;

    if (profile.plan === 'free') {
      await supabase.rpc('increment_scan_count', { user_id: user.id });
    } else if (!PLAN_LIMITS[profile.plan]) {
      await supabase.from('profiles').update({ scans_limit: 5, plan: 'free' }).eq('id', user.id);
    }

    return send(res, 200, { result });
  } catch (err) {
    console.error('Analyze email error:', err);
    return send(res, 500, { error: err.message });
  }
}
