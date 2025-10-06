// lib/lahza.ts
import fetch from 'node-fetch';

const BASE = 'https://api.lahza.io';

export async function lahzaInitialize(opts: {
  amountMinor: number;       // ILS بالأغورة
  email: string;
  currency?: 'ILS'|'USD'|'JOD';
  mobile?: string;
  reference?: string;        // اختياري - لو بدك تولّده انت
  callbackUrl: string;       // يرجع لها المزود بعد الدفع
  metadata?: Record<string, any>;
}) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LAHZA_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:     String(opts.amountMinor), // نص حسب الدوك
      email:      opts.email,
      currency:   opts.currency || 'ILS',
      callback_url: opts.callbackUrl,
      mobile:     opts.mobile,
      reference:  opts.reference,
      metadata:   opts.metadata ? JSON.stringify(opts.metadata) : undefined,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json?.status) {
    throw new Error(json?.message || 'Lahza initialize failed');
  }
  // بيرجع authorization_url + reference
  return json.data; // { authorization_url, access_code, reference }
}
// لاحقاً للتحقق:
export async function lahzaVerify(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    headers: { 'Authorization': `Bearer ${process.env.LAHZA_SECRET_KEY}` }
  });
  const json = await res.json();
  if (!res.ok || !json?.status) throw new Error(json?.message || 'Verify failed');
  return json.data; // فيه status, amount, currency, customer ...الخ
}
