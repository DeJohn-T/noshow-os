// NoShow OS — Demo Seed Script
// Paste this in the browser console while logged into the demo account.
// Then reload the page. Your real account is untouched.

(function () {
  const user = sessionStorage.getItem('nos_session_v1')
  if (!user) { console.error('Not logged in — log in first, then run this.'); return }

  const today = '2026-05-29'

  const contacts = [
    // ── SCHEDULED (upcoming meetings) ───────────────────────────────────────
    {
      id: 1001, name: 'Sofia Patel', role: 'Data Scientist', company: 'Netflix',
      status: 'scheduled', chatDate: '2026-06-03', chatTime: '11:00',
      howWeMet: 'Alumni Network', linkedinUrl: '',
      connectedDate: '2026-05-10',
      notes: 'Works on the recommendation engine team. Really sharp — she reached out after seeing my ML project on GitHub.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: 'Sofia leads ML experiments for content discovery at Netflix. She graduated from CMU a year ahead of me — same program. Great person to talk to about transitioning from research to applied ML in industry.',
      activity: [
        { type: 'connected', date: '2026-05-10' },
        { type: 'meeting_scheduled', date: '2026-05-15' }
      ]
    },
    {
      id: 1002, name: 'Marcus Johnson', role: 'Senior Software Engineer', company: 'Airbnb',
      status: 'scheduled', chatDate: '2026-06-06', chatTime: '2:00',
      howWeMet: 'LinkedIn', linkedinUrl: '',
      connectedDate: '2026-05-18',
      notes: 'Frontend infra engineer. Works on the host experience side. Cold outreach — responded within a day.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-05-18' },
        { type: 'meeting_scheduled', date: '2026-05-20' }
      ]
    },

    // ── FOLLOW UP (need to reach out after meeting) ──────────────────────────
    {
      id: 1003, name: 'James Wu', role: 'Product Manager', company: 'Google',
      status: 'follow up', chatDate: '2026-05-20', chatTime: '',
      howWeMet: 'Networking Event', linkedinUrl: '',
      connectedDate: '2026-05-01',
      notes: 'Met at the tech networking mixer downtown. He works on Google Maps platform. Super down to earth.',
      followUpText: '',
      followUpDate: '2026-05-22', nextAction: 'follow-up',
      brief: 'James has been a PM at Google for 4 years, previously at a Series B startup. Gave a lot of good advice about transitioning from engineering to PM. Mentioned he\'d be happy to refer if a role opens up.',
      activity: [
        { type: 'connected', date: '2026-05-01' },
        { type: 'meeting_scheduled', date: '2026-05-15' },
        { type: 'meeting_completed', date: '2026-05-20' }
      ],
      debrief: { vibe: 'great', note: 'Really solid chat. He gave me a clear roadmap for breaking into PM. Wants to stay in touch.' }
    },
    {
      id: 1004, name: 'Priya Sharma', role: 'Product Lead', company: 'Notion',
      status: 'follow up', chatDate: '2026-05-15', chatTime: '',
      howWeMet: 'Mutual Friend', linkedinUrl: '',
      connectedDate: '2026-04-28',
      notes: 'Referral from my friend Kiran. She\'s been at Notion since early days. Super generous with her time.',
      followUpText: '',
      followUpDate: '2026-05-20', nextAction: 'follow-up',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-28' },
        { type: 'meeting_completed', date: '2026-05-15' }
      ],
      debrief: { vibe: 'good', note: 'Good conversation. She walked me through Notion\'s product culture and what they look for in new grads.' }
    },
    {
      id: 1005, name: 'Chris Martinez', role: 'Senior PM', company: 'Linear',
      status: 'follow up', chatDate: '2026-05-22', chatTime: '',
      howWeMet: 'Twitter / X', linkedinUrl: '',
      connectedDate: '2026-05-08',
      notes: 'Found him through a thread about PM career paths. DM\'d him on X, he responded fast.',
      followUpText: '',
      followUpDate: '', nextAction: '',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-05-08' },
        { type: 'meeting_completed', date: '2026-05-22' }
      ],
      debrief: { vibe: 'great', note: 'Incredible chat. He broke down exactly how Linear hires and what the interview loop looks like.' }
    },

    // ── CIRCLE BACK (reconnect later) ────────────────────────────────────────
    {
      id: 1006, name: 'Maya Richardson', role: 'VP of Engineering', company: 'Stripe',
      status: 'circle back', chatDate: '', chatTime: '',
      howWeMet: 'Career Fair', linkedinUrl: '',
      connectedDate: '2026-04-10',
      notes: 'Met at the spring career fair. She said to reach back out in early June when their new grad process opens.',
      followUpText: 'Hey Maya, great meeting you at the career fair! Reaching back out as June is here — would love to reconnect when timing works.',
      followUpDate: '2026-06-01', nextAction: 'follow-up',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-10' },
        { type: 'follow_up_written', date: '2026-04-12' }
      ]
    },
    {
      id: 1007, name: 'Daniel Kim', role: 'Engineering Manager', company: 'Figma',
      status: 'circle back', chatDate: '2026-05-05', chatTime: '',
      howWeMet: 'Hackathon', linkedinUrl: '',
      connectedDate: '2026-04-20',
      notes: 'Met at the university hackathon — he was a judge. Said to reach out after the semester ends.',
      followUpText: '',
      followUpDate: '2026-06-10', nextAction: '',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-20' },
        { type: 'meeting_completed', date: '2026-05-05' }
      ],
      debrief: { vibe: 'good', note: 'Solid chat. He shared a lot about what it\'s like going from IC to EM. Said to reconnect after finals.' }
    },
    {
      id: 1008, name: 'Kevin Chen', role: 'Software Engineer', company: 'Meta',
      status: 'circle back', chatDate: '', chatTime: '',
      howWeMet: 'Alumni Network', linkedinUrl: '',
      connectedDate: '2026-04-05',
      notes: 'Reached out through the alumni network. Busy with a launch right now — asked me to follow up in a few weeks.',
      followUpText: '',
      followUpDate: '2026-06-05', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-04-05' }]
    },
    {
      id: 1009, name: 'Omar Hassan', role: 'Co-Founder & CEO', company: 'Stealth AI Startup',
      status: 'circle back', chatDate: '2026-05-12', chatTime: '',
      howWeMet: 'Conference', linkedinUrl: '',
      connectedDate: '2026-04-30',
      notes: 'Met at a local AI founders event. Building something in the agent space. Super sharp. Said to keep in touch.',
      followUpText: '',
      followUpDate: '', nextAction: '',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-30' },
        { type: 'meeting_completed', date: '2026-05-12' }
      ],
      debrief: { vibe: 'great', note: 'Wild conversation. He\'s working on something really interesting in autonomous agents. Wants to stay in touch and potentially collaborate.' }
    },
    {
      id: 1010, name: 'Andre Williams', role: 'Engineering Manager', company: 'Amazon',
      status: 'circle back', chatDate: '', chatTime: '',
      howWeMet: 'LinkedIn', linkedinUrl: '',
      connectedDate: '2026-05-02',
      notes: 'Cold DM that worked. He\'s a CMU alum. Offered to chat in June once his team wraps a big project.',
      followUpText: '',
      followUpDate: '2026-06-15', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-02' }]
    },

    // ── SCHEDULE (need to set a date) ────────────────────────────────────────
    {
      id: 1011, name: 'Lauren Torres', role: 'University Recruiter', company: 'Stripe',
      status: 'schedule', chatDate: '', chatTime: '',
      howWeMet: 'Career Fair', linkedinUrl: '',
      connectedDate: '2026-05-14',
      notes: 'Said she\'s actively looking for new grad candidates. Wants to do a quick intro call.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-14' }]
    },
    {
      id: 1012, name: 'Tyler Brooks', role: 'ML Engineer', company: 'OpenAI',
      status: 'schedule', chatDate: '', chatTime: '',
      howWeMet: 'Twitter / X', linkedinUrl: '',
      connectedDate: '2026-05-20',
      notes: 'Responded to my thread about transformer efficiency. Super knowledgeable about infra at scale.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-20' }]
    },
    {
      id: 1013, name: 'Nina Patel', role: 'Software Engineer II', company: 'Uber',
      status: 'schedule', chatDate: '', chatTime: '',
      howWeMet: 'Mutual Friend', linkedinUrl: '',
      connectedDate: '2026-05-22',
      notes: 'Referral from Marcus. She works on the pricing infra team. Happy to chat.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-22' }]
    },
    {
      id: 1014, name: 'Jessica Liu', role: 'Technical Recruiter', company: 'Google',
      status: 'schedule', chatDate: '', chatTime: '',
      howWeMet: 'LinkedIn', linkedinUrl: '',
      connectedDate: '2026-05-25',
      notes: 'Inbound from LinkedIn. She recruits for L3/L4 SWE roles. Wants to screen for a summer start position.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-25' }]
    },
    {
      id: 1015, name: 'Emma Thompson', role: 'Associate', company: 'Sequoia Capital',
      status: 'schedule', chatDate: '', chatTime: '',
      howWeMet: 'Conference', linkedinUrl: '',
      connectedDate: '2026-05-26',
      notes: 'Met at a startup conference. She does scout work and was interested in the side project I pitched.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-26' }]
    },

    // ── INTERESTED (early stage) ─────────────────────────────────────────────
    {
      id: 1016, name: 'Aisha Washington', role: 'Product Manager', company: 'Spotify',
      status: 'interested', chatDate: '', chatTime: '',
      howWeMet: 'Alumni Network', linkedinUrl: '',
      connectedDate: '2026-05-28',
      notes: 'CMU alum, class of \'22. Works on creator tools. Looks like a great person to talk to about PM at a consumer company.',
      followUpText: '', followUpDate: '', nextAction: '',
      brief: '',
      activity: [{ type: 'connected', date: '2026-05-28' }]
    },

    // ── FOLLOWED UP / COMPLETE ───────────────────────────────────────────────
    {
      id: 1017, name: 'David Park', role: 'SWE Intern', company: 'Google',
      status: 'followed up', chatDate: '2026-04-25', chatTime: '',
      howWeMet: 'Class', linkedinUrl: '',
      connectedDate: '2026-04-15',
      notes: 'Classmate who just landed a Google internship. Gave me the full breakdown of the interview process.',
      followUpText: 'Hey David — just wanted to say thank you again for walking me through the whole interview process. The breakdown of the system design round was super helpful. Rooting for you this summer!',
      followUpDate: '', nextAction: 'done',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-15' },
        { type: 'meeting_completed', date: '2026-04-25' },
        { type: 'followed_up', date: '2026-04-28' }
      ],
      debrief: { vibe: 'great', note: 'Super helpful. He walked me through every round in detail. Big W.' }
    },
    {
      id: 1018, name: 'Rachel Green', role: 'UX Researcher', company: 'Apple',
      status: 'complete', chatDate: '2026-04-18', chatTime: '',
      howWeMet: 'LinkedIn', linkedinUrl: '',
      connectedDate: '2026-04-05',
      notes: 'Cold outreach that worked. She talked about what UX research looks like at Apple vs startups.',
      followUpText: 'Rachel — thank you so much for your time and perspective. The insight about approaching research at a large company vs a startup was exactly what I needed. I\'ll definitely keep you posted on how things go!',
      followUpDate: '', nextAction: 'done',
      brief: '',
      activity: [
        { type: 'connected', date: '2026-04-05' },
        { type: 'meeting_completed', date: '2026-04-18' },
        { type: 'followed_up', date: '2026-04-20' }
      ],
      debrief: { vibe: 'good', note: 'Good chat. Not directly relevant to my path but solid perspective on big tech culture.' }
    }
  ]

  const profile = {
    name: 'Alex Chen',
    school: 'Carnegie Mellon University',
    major: 'Computer Science',
    goals: 'Targeting PM and SWE new grad roles at top tech companies. Interested in product infrastructure, developer tools, and AI applications. Open to early-stage startups with strong engineering cultures.',
    skills: ['Python', 'React', 'SQL', 'TypeScript', 'Product Strategy', 'Data Analysis', 'Machine Learning'],
    highlights: [
      'Always be the most prepared person in the room.',
      'Follow up within 24 hours — that\'s how you stay memorable.',
      'Ask about their path, not just their company.',
      'Every connection is one degree closer to the right opportunity.',
      'Quality over quantity — 5 real conversations beat 50 LinkedIn requests.',
      'Your second-degree network is more powerful than your first.',
      'Take notes right after every chat while it\'s fresh.',
      'Ask: "Is there anyone else you\'d suggest I talk to?"',
      'Networking is giving before you ask.'
    ],
    homeConfig: {
      statCards: true, streak: true, networkScore: true,
      upcoming: true, followUp: true, highlights: true,
      circleBack: true, tips: false
    }
  }

  localStorage.setItem(`nos_${user}_contacts_v2`, JSON.stringify(contacts))
  localStorage.setItem(`nos_${user}_profile_v3`, JSON.stringify(profile))

  console.log(`✅ Seeded ${contacts.length} demo contacts for user: ${user}`)
  console.log('Reload the page now.')
})()
