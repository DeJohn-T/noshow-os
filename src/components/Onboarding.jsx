// components/Onboarding.jsx
import React, { useState, useRef, useEffect } from 'react'
import { extractTextFromPDF } from '../lib/pdfParser'
import { parseResumePDF } from '../lib/ai'

function AnimatedField({ show, delay = 0, children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (show) { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }
    else setVisible(false)
  }, [show, delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(18px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {children}
    </div>
  )
}

function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('')
  function addSkill() {
    const trimmed = input.trim()
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed])
    setInput('')
  }
  function removeSkill(s) { onChange(skills.filter(x => x !== s)) }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: skills.length ? 12 : 0 }}>
        {skills.map(s => (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)',
            color: '#c4bfff', borderRadius: 100, padding: '5px 12px', fontSize: 13,
          }}>
            {s}
            <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,191,255,0.5)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
          placeholder="e.g. Python, React, SQL... then press Enter"
          style={{
            flex: 1, background: 'transparent', color: '#fff', border: 'none',
            borderBottom: '2px solid rgba(255,255,255,0.15)', padding: '10px 0',
            fontSize: 16, outline: 'none', fontFamily: "'Syne', sans-serif",
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'}
          onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'}
        />
        {input.trim() && (
          <button onClick={addSkill} style={{
            background: '#7c6fff', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Syne', sans-serif", alignSelf: 'flex-end', marginBottom: 2,
          }}>Add</button>
        )}
      </div>
    </div>
  )
}

function PDFDrop({ label, hint, onFile, fileName, parsing }) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef(null)
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onFile(f) }}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'rgba(124,111,255,0.8)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12, padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(124,111,255,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s',
        }}
      >
        {parsing ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Parsing PDF...</div>
          : fileName ? <div><div style={{ fontSize: 18, marginBottom: 4 }}>📄</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{fileName}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Click to replace</div></div>
          : <div><div style={{ fontSize: 22, marginBottom: 6, opacity: 0.25 }}>⬆</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{hint}</div></div>}
      </div>
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
    </div>
  )
}

export function Onboarding({ onComplete, existingProfile }) {
  const [name, setName] = useState(existingProfile?.name || '')
  const [school, setSchool] = useState(existingProfile?.school || '')
  const [major, setMajor] = useState(existingProfile?.major || '')
  const [goals, setGoals] = useState(existingProfile?.goals || '')
  const [skills, setSkills] = useState(existingProfile?.skills || [])
  const [resumeName, setResumeName] = useState(existingProfile?.resumeName || '')
  const [resumeText, setResumeText] = useState(existingProfile?.resumeText || '')
  const [resumeParsed, setResumeParsed] = useState(existingProfile?.resumeParsed || null)
  const [parsingResume, setParsingResume] = useState(false)
  const [step, setStep] = useState(0)
  const [animOut, setAnimOut] = useState(false)

  function goNext() { setAnimOut(true); setTimeout(() => { setStep(s => s + 1); setAnimOut(false) }, 180) }
  function goBack() { setAnimOut(true); setTimeout(() => { setStep(s => s - 1); setAnimOut(false) }, 180) }

  async function handleResumeFile(file) {
    setResumeName(file.name)
    setParsingResume(true)
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
    onComplete({ name: name.trim(), school: school.trim(), major: major.trim(), goals: goals.trim(), skills, resumeName, resumeText, resumeParsed })
  }

  const inputStyle = {
    width: '100%', background: 'transparent', color: '#fff', border: 'none',
    borderBottom: '2px solid rgba(255,255,255,0.15)', padding: '10px 0',
    fontSize: 20, outline: 'none', fontFamily: "'Syne', sans-serif", transition: 'border-color 0.2s',
  }
  const btnPrimary = { background: '#7c6fff', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }
  const btnSecondary = { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }

  const stepStyle = { opacity: animOut ? 0 : 1, transform: animOut ? 'translateY(14px)' : 'none', transition: 'all 0.18s ease' }

  const steps = [
    // Step 0: Name
    <div key="name" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Welcome</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>What should<br />we call you?</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginBottom: 44 }}>Your personal networking workspace.</div>
      <AnimatedField show={true} delay={100}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && goNext()} placeholder="Your name..." style={inputStyle}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={!!name.trim()} delay={50}>
        <button onClick={goNext} style={{ ...btnPrimary, marginTop: 36 }}>Continue →</button>
      </AnimatedField>
    </div>,

    // Step 1: School + Major — animated reveal as you type
    <div key="school" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Background</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 44 }}>Where are<br />you studying?</div>
      <AnimatedField show={true} delay={100}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>School</div>
        <input autoFocus value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. LSU, Howard, UT Austin..." style={{ ...inputStyle, marginBottom: 32 }}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={school.length > 1} delay={80}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Major</div>
        <input value={major} onChange={e => setMajor(e.target.value)} onKeyDown={e => e.key === 'Enter' && goNext()} placeholder="e.g. Computer Science, Finance..." style={{ ...inputStyle, marginBottom: 40 }}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={school.length > 1} delay={120}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={goBack} style={btnSecondary}>← Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue →</button>
        </div>
      </AnimatedField>
    </div>,

    // Step 2: Goal
    <div key="goals" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Your focus</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>What are you<br />working toward?</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 44 }}>Be specific — this personalizes everything.</div>
      <AnimatedField show={true} delay={100}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your goal</div>
        <input autoFocus value={goals} onChange={e => setGoals(e.target.value)} onKeyDown={e => e.key === 'Enter' && goals.trim() && goNext()}
          placeholder="e.g. Land a SWE internship at a top tech company" style={{ ...inputStyle, fontSize: 16, marginBottom: 0 }}
          onFocus={e => e.target.style.borderBottomColor = '#7c6fff'} onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'} />
      </AnimatedField>
      <AnimatedField show={goals.length > 3} delay={80}>
        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          <button onClick={goBack} style={btnSecondary}>← Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue →</button>
        </div>
      </AnimatedField>
    </div>,

    // Step 3: Skills
    <div key="skills" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Your skills</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>What do you<br />bring to the table?</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>Type a skill and press Enter. Add as many as you want.</div>
      <AnimatedField show={true} delay={100}>
        <SkillsInput skills={skills} onChange={setSkills} />
      </AnimatedField>
      <AnimatedField show={true} delay={200}>
        <div style={{ display: 'flex', gap: 12, marginTop: 44 }}>
          <button onClick={goBack} style={btnSecondary}>← Back</button>
          <button onClick={goNext} style={btnPrimary}>Continue →</button>
        </div>
      </AnimatedField>
    </div>,

    // Step 4: Resume
    <div key="resume" style={stepStyle}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Almost done</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>Upload your<br />resume</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>Personalizes job matches and prep briefs. You can skip this.</div>
      <AnimatedField show={true} delay={100}>
        <PDFDrop hint="Drop your resume PDF here" onFile={handleResumeFile} fileName={resumeName} parsing={parsingResume} />
        {resumeParsed && !resumeParsed.error && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(74,222,128,0.8)' }}>✓ Parsed successfully — your skills have been updated</div>
        )}
      </AnimatedField>
      <AnimatedField show={true} delay={200}>
        <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
          <button onClick={goBack} style={btnSecondary}>← Back</button>
          <button onClick={finish} disabled={parsingResume} style={{ ...btnPrimary, opacity: parsingResume ? 0.5 : 1 }}>
            {resumeName ? "Let's go ✦" : 'Skip & finish →'}
          </button>
        </div>
      </AnimatedField>
    </div>,
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #0f1923 0%, #142030 50%, #0f1923 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: "'Syne', sans-serif", color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, opacity: 0.02, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(124,111,255,1) 1px, transparent 0)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 56 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height: 3, borderRadius: 2, flex: i === step ? 4 : 1, background: i <= step ? '#7c6fff' : 'rgba(255,255,255,0.08)', transition: 'all 0.35s ease' }} />
          ))}
        </div>
        <div style={{ fontSize: 30, marginBottom: 28 }}>☕</div>
        {steps[step]}
      </div>
    </div>
  )
}
