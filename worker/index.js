// Mission CTRL - Cloudflare Worker
// Serves the static Astro site from ./dist and handles the contact form at POST /api/contact.

const TO_ADDRESS = 'barnes0003@proton.me';          // must be a verified Email Routing destination
const FROM_ADDRESS = 'website@missionctrl.team';     // must be on the missionctrl.team domain
const FROM_NAME = 'Mission CTRL Website';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return handleContact(request, env);
    }

    // Everything else is the static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const reply = (ok, error, status) =>
    wantsJson
      ? Response.json(ok ? { ok: true } : { ok: false, error }, { status })
      : Response.redirect(new URL(`/contact/?sent=${ok ? 1 : 0}`, request.url).toString(), 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(false, 'Invalid form submission', 400);
  }

  // Trims, limits length, and removes line breaks from single-line fields.
  const field = (name, max, multiline = false) => {
    let v = String(form.get(name) ?? '').trim().slice(0, max);
    if (!multiline) v = v.replace(/[\r\n]+/g, ' ');
    return v;
  };

  // Spam trap: real people never see this field. Pretend success so bots move on.
  if (field('website', 200)) return reply(true, null, 200);

  const name = field('name', 100);
  const email = field('email', 200);
  const phone = field('phone', 40);
  const organization = field('organization', 150);
  const service = field('service', 100);
  const message = field('message', 5000, true);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(false, 'Please fill in your name, a valid email and a message', 400);
  }

  const text = [
    'New message from the missionctrl.team contact form',
    '',
    `Name:         ${name}`,
    `Email:        ${email}`,
    `Phone:        ${phone || '-'}`,
    `Organization: ${organization || '-'}`,
    `Interested in: ${service || '-'}`,
    '',
    'Message:',
    message,
    '',
    '---',
    'Reply to this email to respond directly to the sender.',
  ].join('\n');

  try {
    await env.EMAIL.send({
      from: { email: FROM_ADDRESS, name: FROM_NAME },
      to: TO_ADDRESS,
      replyTo: { email, name },
      subject: `Website inquiry from ${name}${organization ? ` (${organization})` : ''}`,
      text,
    });
    return reply(true, null, 200);
  } catch (err) {
    console.error('Contact form send failed:', err && (err.code || ''), err && err.message);
    return reply(false, 'Sorry, your message could not be sent', 502);
  }
}
