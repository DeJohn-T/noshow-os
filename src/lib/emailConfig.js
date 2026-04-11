// ─── EmailJS Configuration ────────────────────────────────────────────────────
//
// Setup steps (5 min):
//  1. Sign up free at https://www.emailjs.com
//  2. Go to "Email Services" → Add New Service → choose Gmail → connect your account
//  3. Go to "Email Templates" → Create New Template → set:
//       Subject:  Weekly Work Log – Week of {{week_of}}
//       Body:     {{body}}
//       To email: {{to_email}}
//  4. Replace the placeholder values below with your actual IDs
//
// ─────────────────────────────────────────────────────────────────────────────

export const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID'    // e.g. 'service_abc1234'
export const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'   // e.g. 'template_xyz5678'
export const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'    // e.g. 'AbCdEfGhIjKlMnOpQr'

export const SENDER_NAME = 'DeJohn Thompson'

export const RECIPIENTS = [
  'lena@bestomer.com',
  'stephanie@meridianfinllc.com',
  'naharu@meridianfinllc.com',
]
