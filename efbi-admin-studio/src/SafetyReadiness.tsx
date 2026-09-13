const responseSteps = [
  { number: '01', title: 'Stop and assess', detail: 'Identify whether someone may be in immediate danger, whether an account is compromised, or whether learner information was exposed. Do not investigate a child’s disclosure yourself.' },
  { number: '02', title: 'Contain safely', detail: 'Pause the affected account, workflow, content, or enrollment path when that can prevent more harm. Do not delete evidence.' },
  { number: '03', title: 'Protect the learner', detail: 'Keep communication calm and private. Ask only for the minimum facts and never request passwords or identity documents.' },
  { number: '04', title: 'Record minimum facts', detail: 'Record when it was noticed, what system or learner was affected, actions taken, and who handled it. Avoid copying unrelated personal details.' },
  { number: '05', title: 'Escalate', detail: 'Pass the concern to the safeguarding lead and backup. EFBI operators must not decide whether abuse occurred; the right trained or local authority must assess it.' },
  { number: '06', title: 'Recover and review', detail: 'Verify the risk is contained, restore only safe services, inform affected people when appropriate, and record how recurrence will be prevented.' },
]

const readiness = [
  { label: 'Accountable owner', value: 'Tamerat Gebeyehu', state: 'ready' },
  { label: 'Official privacy inbox', value: 'efbi.academy@gmail.com', state: 'ready' },
  { label: 'Safeguarding lead', value: 'Not assigned', state: 'blocked' },
  { label: 'Backup contact', value: 'Not assigned', state: 'blocked' },
  { label: 'External review', value: 'Not completed', state: 'blocked' },
  { label: '12–15 enrollment', value: 'Closed', state: 'safe' },
]

export default function SafetyReadiness() {
  return <section className="safety-workspace">
    <header className="workspace-title"><div><p className="eyebrow">Phase 25 · Safety operations</p><h1>Safeguarding & incident readiness</h1><p>Use this page to respond calmly, protect learners, and see what still blocks public enrollment.</p></div><span className="security-badge safety-badge--blocked">Launch blocked</span></header>

    <section className="safety-readiness-grid" aria-label="Safeguarding readiness">
      {readiness.map((item) => <article key={item.label} className={`safety-readiness-card safety-readiness-card--${item.state}`}><small>{item.label}</small><strong>{item.value}</strong><span>{item.state === 'ready' ? 'Named' : item.state === 'safe' ? 'Protected state' : 'Launch blocker'}</span></article>)}
    </section>

    <aside className="safety-blocker">
      <div><strong>Do not open enrollment for ages 12–15.</strong><p>The safeguarding lead, trusted backup, authorization route, withdrawal process, and external review are not complete.</p></div>
      <span>Closed by design</span>
    </aside>

    <section className="incident-priority">
      <div className="section-heading"><div><p className="eyebrow">First decision</p><h2>Choose the response priority.</h2></div><p>When uncertain, protect the learner and use the higher priority until the facts are clearer.</p></div>
      <div className="incident-priority-grid">
        <article className="incident-priority-card incident-priority-card--urgent"><span>Urgent</span><h3>Someone may be in immediate danger.</h3><p>Contact a trusted adult or the appropriate local emergency service. EFBI email is not an emergency service. Preserve the minimum evidence and escalate.</p></article>
        <article className="incident-priority-card incident-priority-card--high"><span>High</span><h3>Data, accounts, or learner safety may be compromised.</h3><p>Contain the affected feature, account, content, or enrollment path; preserve evidence; and begin the incident record immediately.</p></article>
        <article className="incident-priority-card"><span>Standard</span><h3>No immediate harm is apparent.</h3><p>Handle ordinary privacy access, correction, content, and support questions through the official EFBI inbox and approved workflow.</p></article>
      </div>
    </section>

    <section className="incident-steps">
      <div className="section-heading"><div><p className="eyebrow">Response checklist</p><h2>Follow these steps in order.</h2></div><p>Do not promise an outcome or legal deadline that has not been reviewed.</p></div>
      <ol>{responseSteps.map((step) => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></li>)}</ol>
    </section>

    <section className="incident-record">
      <div><p className="eyebrow">Minimum incident record</p><h2>Record facts, not a second copy of the learner’s life.</h2><p>Keep only the incident time, reporter route, affected system or learner identifier, short factual description, containment actions, assigned handler, decisions, communications, recovery check, and closure date.</p></div>
      <ul><li>Never record a password or verification code.</li><li>Do not copy identity documents into notes.</li><li>Keep private reviewer concerns away from learner-visible feedback.</li><li>Do not delete evidence while an incident is active.</li></ul>
    </section>

    <aside className="safety-boundary"><strong>Development boundary</strong><p>This checklist is usable guidance, not proof of external legal or safeguarding approval. Notification duties, response deadlines, named contacts, and escalation destinations still require review before enrollment opens.</p></aside>
  </section>
}
