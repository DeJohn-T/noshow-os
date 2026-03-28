// lib/ai.js
// In dev, Vite proxies /api/anthropic/v1/messages → Anthropic directly
// In production (Vercel), /api/anthropic is a serverless function
const API = import.meta.env.DEV
  ? '/api/anthropic/v1/messages'
  : '/api/anthropic'

export async function callClaude(system, user, maxTokens = 1000) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  if (data.content?.[0]) return data.content[0].text
  throw new Error('No response')
}

export async function parseLinkedInPDF(pdfText) {
  return callClaude(
    `You are the highly intelligent LinkedIn PDF profile parser. Autofill linkedin link box with the link displayed in the downloaded profile. You never make up information. You extract it. You interpret and understand it. You never have any grammatical errors. Extract all professional info and return ONLY valid JSON:
{
    "summary":"4-5 sentence professional summary. You talk proper and educated. You are a professional.",
    "locations":["City, State or Remote."],
    "companies":["Role at Company (dates)."],
    "education":["Degree, School, 'Class of 'Year. Include ALL schools: primary degree, study abroad, exchange programs, bootcamps."],
    "organizations":["organization or club name"],
    "skills":["skill"],
    "interests":["interest"]
    "Honors":["honor or award, year, awarding organization"],
    "publications":["publication name, publication type (article, book, etc), year"],
    "linkedinUrl":"https://linkedin.com/in/their-handle (extract from the PDF if present)",
    "email":"their email if listed",
    "website":"personal website or portfolio URL if listed"

}

Instructions: 
- For summary: Write a detailed and specific summary that captures the essence of the person's professional background, key achievements, notable companies they've worked at, and relevant skills. Do not be generic or vague. Do not just list things, synthesize them into a coherent narrative that highlights what makes this person unique and impressive.
- For locations: prioritize most recent or relevant locations. If it gives an area instead of a city, list the area, city and state. For example, if it says 'Bay Area', write 'Bay Area, San Francisco, CA'. You will always be specfic about the location. If it says 'Remote', write 'Remote'. If it says 'United States', write 'United States'. Do not just write 'United States' for every profile, be specific unless you certainly cant.
- For companies: Do not list more than 6 different companies. Group companies together, any change of roles within the same company, will all be grouped together. For EACH role at a company, include 1-2 key achievements or responsibilities. You NEVER use more than2 sentences maximum for their experience description. You Must always show more than 5 work experiences, if not applicable, list all they have if any.
-For education: List ALL education experiences — do not skip any, including study abroad programs, exchange programs, community college, bootcamps, or certifications. For each one, include the degree or program type, school name, and year. Write graduation year as 'Class of YEAR'. If currently a student, write 'Expected graduation YEAR'. Never omit an institution just because it seems less prestigious or is a study abroad/exchange program.
- For organizations: List any relevant organizations or clubs they are a part of. This can include professional organizations, clubs, or any other relevant groups. You will prioritize the most recent or relevant ones. Look under 'Activities and societies' in the education section.
- For skills: List the top 6 skills that are most relevant to the person's current role and industry. If the person has a lot of skills, prioritize the ones that are most impressive and relevant. If the person has a lot of skills but they are not very relevant or impressive, you will list the most relevant and impressive ones even if they are not at the top of the list. You will not list more than 6 skills. You will not use the top 3 that is listed in the document.
- For interests: List any relevant interests that are mentioned in the profile. This can include hobbies, passions, or any other relevant interests.
- For honors: List any honors or awards that are mentioned in the profile. Include the name of the honor, the year it was awarded, and the organization that awarded it.
- For publications: List any publications that are mentioned in the profile. Include the name of the publication, the type of publication (article, book, etc), and the year it was published.
- For linkedinUrl: Extract the LinkedIn profile URL exactly as shown in the PDF. It is usually near the top of the document. Return the full URL starting with https://linkedin.com/in/ or https://www.linkedin.com/in/.
- For email: Extract any email address listed in the profile, usually in the contact info section.
- For website: Extract any personal website, portfolio, or blog URL listed in the profile.




Ignore page numbers, footers, navigation. For organizations, look for 'Activities and societies' listed under education sections. Return ONLY the JSON object.`,
    pdfText.slice(0, 8000), 1200
  )
}

export async function parseResumePDF(pdfText) {
  return callClaude(
    `You are a resume parser. Extract info and return ONLY valid JSON:
{"summary":"2-3 sentence candidate summary",
"experience":["Role at Company - key achievement"],
"education":["Degree, School, Year"],
"skills":["skill"],
"projects":["Project - description"],
"strengths":["strength"]}
Return ONLY the JSON object. No markdown.`,
    pdfText.slice(0, 8000), 1500
  )
}

export async function generateBrief(contact, parsedProfile, resume, profileSkills) {
  const profileCtx = parsedProfile && !parsedProfile.error
    ? `Their profile: ${parsedProfile.summary || ''}. Companies: ${(parsedProfile.companies || []).join(', ')}. Skills: ${(parsedProfile.skills || []).join(', ')}.`
    : `Role: ${contact.role || 'unknown'}, Company: ${contact.company || 'unknown'}`

  const resumeCtx = resume?.parsed && !resume.parsed.error
    ? `\nYOUR background: ${resume.parsed.summary}. Experience: ${(resume.parsed.experience || []).slice(0, 3).join('; ')}. Skills: ${(resume.parsed.skills || []).join(', ')}.`
    : ''

  const skillsCtx = profileSkills?.length > 0 ? `\nYour skills: ${profileSkills.join(', ')}.` : ''

  return callClaude(
    `You are a professional highly skilled networking coach. Write a coffee chat prep brief in plain text with these exact headers:

BACKGROUND
2-sentence summary of who this person is.;

MUTUAL GROUND
- (Shared schools, cities, industries, interests, or experiences between you and them — these are your easiest icebreakers)

THEIR CAREER STORY
2-3 sentences on the pattern of how they've moved through their career. What have they optimized for? What drives them? Read between the lines of their experience.

GOALS for THIS CHAT
1-2 sentences on what the user should aim to get out of this coffee chat based on the person's background and interests.;

QUESTIONS TO ASK
1.
2.
3.
4.
5.

WHAT TO HIGHLIGHT ABOUT YOU
- (2-3 things from your background that resonate with this person)

CONVERSATION STARTERS
(1-2 specific angles based on their background)

Be specific. No markdown, no asterisks.`,
    `Contact: ${contact.name}, ${contact.role || ''} at ${contact.company || ''}\n${profileCtx}${resumeCtx}${skillsCtx}`
  )
}

export async function generateFollowUp(contact, resume) {
  const resumeCtx = resume?.parsed && !resume.parsed.error ? ` My background: ${resume.parsed.summary}.` : ''
  return callClaude(
    `Write a warm, genuine 3-4 sentence follow-up message after a coffee chat. Sound like a real human. No subject line, no "Dear".`,
    `Chat with: ${contact.name}, ${contact.role || ''} at ${contact.company || ''}. Notes: ${contact.notes || 'Good conversation.'}.${resumeCtx}`
  )
}

export async function generateQuotes(profile) {
  const raw = await callClaude(
    `Generate 8 short, genuine motivational quotes for an ambitious college student focused on networking and career growth. NOT cheesy or corporate. Think real mentor wisdom — the kind of thing a senior engineer or VP would say over coffee. Each quote should be a completely different angle: career strategy, relationship building, personal growth, hustle mindset, resilience, curiosity, authenticity, long-game thinking. Return ONLY a JSON array of 8 strings. No markdown.`,
    `Student: ${profile?.name || ''}, ${profile?.major || ''} at ${profile?.school || ''}. Goal: ${profile?.goals || ''}.`,
    600
  )
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return Array.isArray(parsed) ? parsed : [raw]
  } catch {
    return [raw]
  }
}

export async function analyzeResume(resume, profile) {
  const ctx = resume?.parsed && !resume.parsed.error
    ? `Summary: ${resume.parsed.summary || ''}. Experience: ${(resume.parsed.experience || []).join('; ')}. Skills: ${(resume.parsed.skills || []).join(', ')}. Education: ${(resume.parsed.education || []).join(', ')}. Projects: ${(resume.parsed.projects || []).join('; ')}.`
    : resume?.text?.slice(0, 3000) || ''
  const profileCtx = profile ? `Student: ${profile.name}, ${profile.major} at ${profile.school}. Goal: ${profile.goals}.` : ''
  return callClaude(
    `You are a resume expert for college students. Analyze this resume and return ONLY valid JSON:
{
  "score": 78,
  "scoreLabel": "Good",
  "summary": "2-3 sentence honest overall impression",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": [
    {"issue": "short description", "fix": "specific actionable fix"},
    {"issue": "short description", "fix": "specific actionable fix"},
    {"issue": "short description", "fix": "specific actionable fix"}
  ],
  "atsKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "quickWins": ["quick win 1", "quick win 2", "quick win 3"]
}
score should be 0-100. scoreLabel: "Needs Work" (<50), "Decent" (50-69), "Good" (70-84), "Strong" (85-100).
Be specific and honest. Reference actual content from their resume, not generic advice.`,
    `${profileCtx}\n${ctx}`,
    1200
  )
}

export async function generateJobRecs(profile, resume, skills) {
  const resumeCtx = resume?.parsed && !resume.parsed.error
    ? `Resume: ${resume.parsed.summary}. Skills from resume: ${(resume.parsed.skills || []).join(', ')}. Experience: ${(resume.parsed.experience || []).slice(0, 2).join('; ')}.`
    : ''
  const skillsCtx = skills?.length > 0 ? `Additional skills: ${skills.join(', ')}.` : ''

  return callClaude(
    `You are a career advisor for college students. Generate 10 realistic internship/job recommendations.
Return ONLY a valid JSON array of 10 objects:
[{"title":"job title","company":"real well-known company","location":"City or Remote","type":"Internship or Full-time","description":"1-2 sentences what they'd do","whyMatch":"1 sentence why this fits them","searchUrl":"https://www.linkedin.com/jobs/search/?keywords=TITLE&location=LOCATION","match":"Strong or Good or Reach"}]
No markdown. ONLY the JSON array.`,
    `Student: ${profile?.name || ''}, ${profile?.major || ''} at ${profile?.school || ''}. Goal: ${profile?.goals || ''}.${resumeCtx ? '\n' + resumeCtx : ''}${skillsCtx ? '\n' + skillsCtx : ''}`,
    2000
  )
}
