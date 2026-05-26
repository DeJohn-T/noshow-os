// components/Onboarding.jsx
import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Contact, FileText, Sparkles, Upload, X } from 'lucide-react'
import { extractTextFromPDF } from '../lib/pdfParser'
import { parseResumePDF } from '../lib/ai'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCHOOLS = [
  'Alabama A&M University','Alabama State University','Arizona State University',
  'Auburn University','Baylor University','Boston College','Boston University',
  'Bowdoin College','Brown University','Carnegie Mellon University',
  'Clark Atlanta University','Clemson University','Columbia University',
  'Cornell University','Dartmouth College','Davidson College','Duke University',
  'Emory University','Fisk University','Florida A&M University',
  'Florida International University','Florida State University',
  'Fordham University','George Mason University','George Washington University',
  'Georgetown University','Georgia Institute of Technology','Georgia State University',
  'Hampton University','Harvard University','Howard University',
  'Indiana University Bloomington','Iowa State University','Jackson State University',
  'Johns Hopkins University','Kent State University','Louisiana State University',
  'Loyola University Chicago','Massachusetts Institute of Technology',
  'Miami University','Michigan State University','Middlebury College',
  'Morgan State University','Morehouse College','New York University',
  'North Carolina A&T State University','North Carolina State University',
  'Northeastern University','Northwestern University','Ohio State University',
  'Penn State University','Princeton University','Purdue University',
  'Rice University','Rutgers University','SMU','Spelman College',
  'Stanford University','Syracuse University','Temple University',
  'Texas A&M University','Texas Southern University','Tufts University',
  'Tulane University','UC Berkeley','UC Davis','UC Irvine','UC Los Angeles',
  'UC San Diego','UC Santa Barbara','University of Alabama',
  'University of Arizona','University of Chicago','University of Cincinnati',
  'University of Colorado Boulder','University of Connecticut',
  'University of Florida','University of Georgia','University of Houston',
  'University of Illinois Urbana-Champaign','University of Iowa',
  'University of Kansas','University of Kentucky','University of Maryland',
  'University of Massachusetts Amherst','University of Miami',
  'University of Michigan','University of Minnesota',
  'University of Mississippi','University of Missouri',
  'University of Nebraska','University of North Carolina Chapel Hill',
  'University of Notre Dame','University of Oregon','University of Pennsylvania',
  'University of Pittsburgh','University of South Carolina',
  'University of Southern California','University of Tennessee',
  'University of Texas at Austin','University of Utah',
  'University of Virginia','University of Washington','University of Wisconsin',
  'Vanderbilt University','Virginia Tech','Wake Forest University',
  'Washington University in St. Louis','Williams College','Xavier University of Louisiana',
  'Yale University',
]

const MAJORS = [
  // Tech / Engineering
  'Computer Science','Data Science','Information Technology','Software Engineering',
  'Computer Engineering','Electrical Engineering','Mechanical Engineering',
  'Civil Engineering','Chemical Engineering','Biomedical Engineering',
  'Industrial Engineering','Aerospace Engineering','Environmental Engineering',
  // Business
  'Business Administration','Finance','Accounting','Marketing','Economics',
  'Entrepreneurship','Management','Supply Chain Management',
  'International Business','Real Estate','Business Analytics',
  'Human Resources Management',
  // Social Sciences / Humanities
  'Communications','Political Science','Psychology','Sociology','History',
  'Philosophy','Anthropology','English','Journalism','Public Relations',
  'Criminal Justice','Social Work',
  // Life Sciences
  'Biology','Chemistry','Biochemistry','Neuroscience','Public Health',
  'Kinesiology','Nutrition','Pre-Medicine',
  // Math / Stats
  'Mathematics','Statistics','Applied Mathematics',
  // Arts / Design
  'Graphic Design','UX Design','Film Studies','Music','Art History',
  'Architecture','Fashion Design','Theatre',
  // Pre-professional
  'Pre-Law','Nursing','Pharmacy','Education','Political Communications',
  'Information Systems',
]

const SKILLS = [
  'Python','JavaScript','TypeScript','React','Node.js','SQL','Java','C++','C#',
  'Go','Swift','Kotlin','HTML','CSS','Tailwind CSS','Next.js','Vue.js','Angular',
  'Flask','Django','FastAPI','GraphQL','REST APIs','AWS','Google Cloud','Azure',
  'Docker','Kubernetes','Git','Machine Learning','Deep Learning','Data Analysis',
  'Data Visualization','Pandas','NumPy','TensorFlow','PyTorch','Excel',
  'PowerPoint','Google Sheets','Tableau','Power BI','Figma','Adobe XD',
  'Photoshop','Illustrator','Canva','Public Speaking','Project Management',
  'Agile','Scrum','Product Management','UX Research','Financial Modeling',
  'Accounting','Valuation','Bloomberg Terminal','Pitch Decks','Market Research',
  'CRM','Salesforce','Content Writing','Copywriting','SEO','Social Media',
  'Email Marketing','Google Analytics','Video Editing','Podcast Production',
  'Spanish','French','Mandarin','Arabic','German','Leadership','Teamwork',
  'Communication','Problem Solving','Critical Thinking','Time Management',
  'Creativity','Research','Negotiation','Sales','Networking',
]

// ─── Autocomplete Input ────────────────────────────────────────────────────────

function AutocompleteInput({ value, onChange, onEnter, placeholder, suggestions, label, style, autoFocus }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [focused, setFocused] = useState(false)

  const filtered = value.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 7)
    : []

  function pick(s) { onChange(s) }

  function handleKey(e) {
    if (filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Tab') { e.preventDefault(); pick(filtered[activeIdx]); return }
    }
    if (e.key === 'Enter') { e.preventDefault(); if (onEnter) onEnter() }
  }

  return (
    <div style={{ position: 'relative' }}>
      {label && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>}
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={e => { onChange(e.target.value); setActiveIdx(0) }}
        onKeyDown={handleKey}
        onFocus={e => { setFocused(true); e.target.style.borderBottomColor = '#7c6fff' }}
        onBlur={e => { setTimeout(() => setFocused(false), 150); e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)' }}
        placeholder={placeholder}
        style={style}
      />
      {focused && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#141e2e', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 12, overflow: 'hidden', zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
          {filtered.map((s, i) => (
            <div key={s} onMouseDown={() => pick(s)} style={{
              padding: '10px 16px', fontSize: 14, cursor: 'pointer',
              background: i === activeIdx ? 'rgba(124,111,255,0.15)' : 'transparent',
              color: i === activeIdx ? '#c4bfff' : 'rgba(255,255,255,0.75)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              {s}
              {i === activeIdx && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Tab ↹</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skills Input with autocomplete ───────────────────────────────────────────

function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [focused, setFocused] = useState(false)

  const suggestions = input.trim().length > 0
    ? SKILLS.filter(s => s.toLowerCase().startsWith(input.toLowerCase()) && !skills.includes(s)).slice(0, 6)
    : []

  function addSkill(val) {
    const s = (val || input).trim()
    if (s && !skills.includes(s)) onChange([...skills, s])
    setInput(''); setActiveIdx(0)
  }

  function handleKey(e) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Tab') { e.preventDefault(); addSkill(suggestions[activeIdx]); return }
    }
    if (e.key === 'Enter') { e.preventDefault(); addSkill(suggestions[activeIdx] || input) }
    if (e.key === 'Backspace' && input === '' && skills.length > 0) onChange(skills.slice(0, -1))
  }

  const inputStyle = {
    flex: 1, background: 'transparent', color: '#fff', border: 'none',
    borderBottom: '2px solid rgba(255,255,255,0.15)', padding: '10px 0',
    fontSize: 16, outline: 'none', fontFamily: "'Syne', sans-serif",
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: skills.length ? 16 : 0 }}>
        {skills.map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', color: '#c4bfff', borderRadius: 100, padding: '5px 12px', fontSize: 13 }}>
            {s}
            <button onClick={() => onChange(skills.filter(x => x !== s))} aria-label={`Remove ${s}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,191,255,0.5)', lineHeight: 1, padding: 0 }}><X size={13} strokeWidth={1.8} aria-hidden="true" /></button>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKey}
            onFocus={e => { setFocused(true); e.target.style.borderBottomColor = '#7c6fff' }}
            onBlur={e => { setTimeout(() => setFocused(false), 150); e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)' }}
            placeholder={skills.length === 0 ? 'Type a skill - suggestions appear as you type' : 'Add another...'}
            style={inputStyle}
          />
          {input.trim() && (
            <button onClick={() => addSkill()} style={{ background: '#7c6fff', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif", alignSelf: 'flex-end', marginBottom: 2 }}>Add</button>
          )}
        </div>
        {focused && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#141e2e', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 12, overflow: 'hidden', zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
            {suggestions.map((s, i) => (
              <div key={s} onMouseDown={() => addSkill(s)} style={{
                padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                background: i === activeIdx ? 'rgba(124,111,255,0.15)' : 'transparent',
                color: i === activeIdx ? '#c4bfff' : 'rgba(255,255,255,0.75)',
                display: 'flex', justifyContent: 'space-between',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                {s}
                {i === activeIdx && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Tab ↹ or Enter</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
        Tab to autocomplete · Enter to add · Backspace to remove last
      </div>
    </div>
  )
}

// ─── Other components (unchanged) ─────────────────────────────────────────────

function AnimatedField({ show, delay = 0, children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (show) { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }
    else setVisible(false)
  }, [show, delay])
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(18px)', transition: 'opacity 0.4s ease, transform 0.4s ease', pointerEvents: visible ? 'auto' : 'none' }}>
      {children}
    </div>
  )
}

function PDFDrop({ hint, onFile, fileName, parsing }) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef(null)
  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onFile(f) }}
        onClick={() => ref.current?.click()}
        style={{ border: `2px dashed ${dragging ? 'rgba(124,111,255,0.8)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(124,111,255,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}
      >
        {parsing ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Parsing PDF...</div>
          : fileName ? <div><FileText size={18} style={{ marginBottom: 4 }} aria-hidden="true" /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{fileName}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Click to replace</div></div>
          : <div><Upload size={22} style={{ marginBottom: 6, opacity: 0.25 }} aria-hidden="true" /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{hint}</div></div>}
      </div>
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
    </div>
  )
}

// ─── Main Onboarding ───────────────────────────────────────────────────────────

export function Onboarding({ onComplete, existingProfile }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [name, setName] = useState(existingProfile?.name || '')
  const [school, setSchool] = useState(existingProfile?.school || '')
  const [notInCollege, setNotInCollege] = useState(existingProfile?.school === 'Not enrolled')
  const [major, setMajor] = useState(existingProfile?.major || '')
  const [goals, setGoals] = useState(existingProfile?.goals || '')
  const [skills, setSkills] = useState(existingProfile?.skills || [])
  const [resumeName, setResumeName] = useState(existingProfile?.resumeName || '')
  const [resumeText, setResumeText] = useState(existingProfile?.resumeText || '')
  const [resumeParsed, setResumeParsed] = useState(existingProfile?.resumeParsed || null)
  const [parsingResume, setParsingResume] = useState(false)
  const [step, setStep] = useState(0)
  const [animOut, setAnimOut] = useState(false)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function goNext() { setAnimOut(true); setTimeout(() => { setStep(s => s + 1); setAnimOut(false) }, 180) }
  function goBack() { setAnimOut(true); setTimeout(() => { setStep(s => s - 1); setAnimOut(false) }, 180) }

  async function handleResumeFile(file) {
    setResumeName(file.name); setParsingResume(true)
    try {
      const text = await extractTextFromPDF(file)
      setResumeText(text)
      try {
        const raw = await parseResumePDF(text)
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
        setResumeParsed(parsed)
        if (parsed.skills?.length) setSkills(prev => [...new Set([...prev, ...parsed.skills.slice(0, 6)])])
      } catch { setResumeParsed(null) }
    } catch { setResumeText('') }
    setParsingResume(false)
  }

  function finish() {
    onComplete({
      name: name.trim(),
      school: notInCollege ? 'Not enrolled' : school.trim(),
      major: notInCollege ? '' : major.trim(),
      goals: goals.trim(),
      skills, resumeName, resumeText, resumeParsed,
    })
  }

  const inputStyle = {
    width: '100%', background: 'transparent', color: '#fff', border: 'none',
    borderBottom: '2px solid rgba(255,255,255,0.15)', padding: '10px 0',
    fontSize: 20, outline: 'none', fontFamily: "'Syne', sans-serif", transition: 'border-color 0.2s',
  }
  const btnPrimary = { background: '#7c6fff', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif", width: isMobile ? '100%' : 'auto' }
  const btnSecondary = { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, cursor: 'pointer', fontFamily: "'Syne', sans-serif", width: isMobile ? '100%' : 'auto' }
  const stepStyle = { opacity: animOut ? 0 : 1, transform: animOut ? 'translateY(14px)' : 'none', transition: 'all 0.18s ease' }
  const headlineStyle = { fontSize: isMobile ? 32 : 38, fontWeight: 800, lineHeight: 1.08, marginBottom: 10 }
  const navRowStyle = { display: 'flex', gap: 12, flexDirection: isMobile ? 'column-reverse' : 'row' }

  const canContinueSchool = notInCollege || school.trim().length > 1

  const steps = [
    // Step 0: Name
    <div key="name" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Welcome</div>
      <div style={headlineStyle}>What should<br />we call you?</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginBottom: 44 }}>Show up prepared. Every time.</div>
      <AnimatedField show={true} delay={100}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && goNext()} placeholder="Your name..."
          style={inputStyle} onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={!!name.trim()} delay={50}>
        <button onClick={goNext} style={{ ...btnPrimary, marginTop: 36 }}>Continue <ArrowRight size={16} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></button>
      </AnimatedField>
    </div>,

    // Step 1: School + Major
    <div key="school" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Background</div>
      <div style={{ ...headlineStyle, marginBottom: isMobile ? 30 : 44 }}>Where are<br />you studying?</div>

      <AnimatedField show={true} delay={100}>
        {notInCollege ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 12, marginBottom: 32 }}>
            <span style={{ fontSize: 15, color: '#c4bfff', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={15} strokeWidth={2.2} aria-hidden="true" /> Not currently enrolled</span>
            <button onClick={() => { setNotInCollege(false); setSchool('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,191,255,0.5)', fontSize: 13, fontFamily: "'Syne', sans-serif" }}>undo</button>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <AutocompleteInput
              label="School"
              value={school}
              onChange={setSchool}
              suggestions={SCHOOLS}
              placeholder="Start typing your school..."
              autoFocus
              style={{ ...inputStyle, fontSize: 18 }}
            />
            <button
              onClick={() => { setNotInCollege(true); setSchool(''); setMajor('') }}
              style={{ marginTop: 14, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: "'Syne', sans-serif' " }}>
              Not currently enrolled <ArrowRight size={14} strokeWidth={1.8} style={{ verticalAlign: -2, marginLeft: 5 }} aria-hidden="true" />
            </button>
          </div>
        )}
      </AnimatedField>

      <AnimatedField show={!notInCollege && school.length > 1} delay={80}>
        <AutocompleteInput
          label="Major / Minor"
          value={major}
          onChange={setMajor}
          onEnter={goNext}
          suggestions={MAJORS}
          placeholder="Start typing your major..."
          style={{ ...inputStyle, fontSize: 18, marginBottom: 40 }}
        />
      </AnimatedField>

      <AnimatedField show={canContinueSchool} delay={120}>
        <div style={{ ...navRowStyle, marginTop: notInCollege ? 8 : 40 }}>
          <button onClick={goBack} style={btnSecondary}><ArrowLeft size={15} strokeWidth={1.8} style={{ verticalAlign: -3, marginRight: 5 }} aria-hidden="true" />Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue <ArrowRight size={16} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></button>
        </div>
      </AnimatedField>
    </div>,

    // Step 2: Goal
    <div key="goals" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Your focus</div>
      <div style={headlineStyle}>What are you<br />working toward?</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 44 }}>Be specific - this personalizes everything.</div>
      <AnimatedField show={true} delay={100}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your goal</div>
        <input autoFocus value={goals} onChange={e => setGoals(e.target.value)} onKeyDown={e => e.key === 'Enter' && goals.trim() && goNext()}
          placeholder="e.g. Land a SWE internship at a top tech company" style={{ ...inputStyle, fontSize: 16 }}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={goals.length > 3} delay={80}>
        <div style={{ ...navRowStyle, marginTop: 40 }}>
          <button onClick={goBack} style={btnSecondary}><ArrowLeft size={15} strokeWidth={1.8} style={{ verticalAlign: -3, marginRight: 5 }} aria-hidden="true" />Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue <ArrowRight size={16} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></button>
        </div>
      </AnimatedField>
    </div>,

    // Step 3: Skills
    <div key="skills" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Your skills</div>
      <div style={headlineStyle}>What do you<br />bring to the table?</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>Start typing - suggestions appear automatically.</div>
      <AnimatedField show={true} delay={100}>
        <SkillsInput skills={skills} onChange={setSkills} />
      </AnimatedField>
      <AnimatedField show={true} delay={200}>
        <div style={{ ...navRowStyle, marginTop: 44 }}>
          <button onClick={goBack} style={btnSecondary}><ArrowLeft size={15} strokeWidth={1.8} style={{ verticalAlign: -3, marginRight: 5 }} aria-hidden="true" />Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue <ArrowRight size={16} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></button>
        </div>
      </AnimatedField>
    </div>,

    // Step 4: Resume
    <div key="resume" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Almost done</div>
      <div style={headlineStyle}>Upload your<br />resume</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>Personalizes job matches and prep briefs. You can skip this.</div>
      <AnimatedField show={true} delay={100}>
        <PDFDrop hint="Drop your resume PDF here" onFile={handleResumeFile} fileName={resumeName} parsing={parsingResume} />
        {resumeParsed && !resumeParsed.error && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(74,222,128,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={2.2} aria-hidden="true" /> Parsed successfully - your skills have been updated</div>
        )}
      </AnimatedField>
      <AnimatedField show={true} delay={200}>
        <div style={{ ...navRowStyle, marginTop: 36 }}>
          <button onClick={goBack} style={btnSecondary}><ArrowLeft size={15} strokeWidth={1.8} style={{ verticalAlign: -3, marginRight: 5 }} aria-hidden="true" />Back</button>
          <button onClick={finish} disabled={parsingResume} style={{ ...btnPrimary, opacity: parsingResume ? 0.5 : 1 }}>
            {resumeName ? <>Let's go <Sparkles size={15} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></> : <>Skip and finish <ArrowRight size={16} strokeWidth={1.8} style={{ verticalAlign: -3, marginLeft: 6 }} aria-hidden="true" /></>}
          </button>
        </div>
      </AnimatedField>
    </div>,
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f1923 0%, #142030 50%, #0f1923 100%)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))' : '2rem', fontFamily: "'Syne', sans-serif", color: '#fff', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, opacity: 0.02, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(124,111,255,1) 1px, transparent 0)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: isMobile ? 38 : 56 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height: 3, borderRadius: 2, flex: i === step ? 4 : 1, background: i <= step ? '#7c6fff' : 'rgba(255,255,255,0.08)', transition: 'all 0.35s ease' }} />
          ))}
        </div>
        <Contact size={30} style={{ marginBottom: 28, color: '#7c6fff' }} aria-hidden="true" />
        {steps[step]}
      </div>
    </div>
  )
}
