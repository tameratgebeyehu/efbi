# EFBI privacy decisions

Status: owner decisions recorded; external review pending.

Recorded on 2026-09-12 from the EFBI founder's instructions.

## Accountable owner and contact

- Accountable EFBI owner: **Tamerat Gebeyehu, CEO and Founder**
- Privacy and deletion contact: **efbi.academy@gmail.com**
- Legal status: currently an unregistered educational initiative operated by Tamerat Gebeyehu
- Minimum learner age: 12
- Intended audience: learners aged 12–15 and learners aged 16 or older
- Educational scope: free courses across scholarships, applications, technology, AI, and other practical subjects

These are EFBI product and operating decisions. They are not a legal opinion or an external privacy or safeguarding approval. The current truthful operating description is that Tamerat Gebeyehu runs EFBI as an unregistered initiative. A later reviewer should confirm how that responsibility must be described in the final public notice.

## Ethiopian minor-data boundary

The official English text of Personal Data Protection Proclamation No. 1321/2024 defines a minor as a data subject below 16. Article 11 requires the minor's best interests, parent/guardian/tutor authorization or another applicable lawful condition, reasonable efforts to verify age and authorization, and no marketing, profiling, or merging of a minor's profiles.

Primary source: https://justice.gov.et/wp-content/uploads/2025/04/seasiisia-seusiNse%C2%A1-1321-2016.pdf

## Approved product direction

1. EFBI intends to serve learners aged 12 and older across a broad range of free educational subjects.
2. The signup experience must ask for an age band, not a full date of birth, unless external review shows that more data is necessary.
3. Learners aged 16 or older may use self-registration only after the reviewed privacy notice and required acknowledgements are active.
4. Learners aged 12–15 must use the reviewed parent/guardian/tutor authorization route before EFBI creates an account.
5. Children under 12 are outside the intended enrollment audience and cannot create an account.
6. The under-16 route must use clear, age-appropriate language and keep the child's best interests central.
7. EFBI will not use a minor's personal data for marketing, profiling, or merging profiles.
8. Public certificate-name consent for a learner aged 12–15 requires a separately reviewed guardian authorization path.
9. Public enrollment remains off until the authorization evidence, withdrawal process, security rules, tests, and safeguarding procedure are approved.

## Phase 25A implementation record

- The Join page now uses the approved age bands without collecting a date of birth.
- Under-12 and 12–15 visitors cannot reach an account form.
- The 16+ form requires separate, versioned privacy and learner-safety acknowledgements.
- The learner profile contains only the approved minimum registration fields.
- Firestore rejects under-16 profiles, incomplete acknowledgements, unexpected personal fields, and learning writes from verified sign-ins that have no approved profile.
- These are technical safeguards, not external legal or safeguarding approval. The 12–15 route and public enrollment remain closed.

## Phase 25B implementation record

- A public Privacy & Support page explains what the learner platform saves, why it is used, who can see it, and the special public certificate fields.
- Access, correction, withdrawal/deletion, and safety routes use plain language and the official EFBI privacy address.
- Free-text support messages are not copied into a new Firestore collection.
- Signed-in learners reach the existing protected deletion workflow from the same page; read-only previews do not offer unavailable account controls.
- The footer, Contact page, and learner Account page link to the privacy center.
- Final response procedures, safeguarding ownership, incident escalation, and external review remain pending.

## Phase 25C implementation record

- Admin Studio has a Safety & incidents workspace with immediate, high, and standard response paths.
- The response flow prioritizes learner safety, containment, minimum factual records, need-to-know sharing, recovery, and review.
- The workspace clearly says EFBI operators must not investigate a child's disclosure or decide whether abuse occurred.
- Enrollment controls display the unresolved safeguarding and external-review warning.
- The designated safeguarding lead and trusted backup remain visibly unassigned; the software does not invent approval.
- The development playbook is grounded in the Ministry of Justice proclamation page and UNICEF's child-safeguarding toolkit.

## Decisions still required

- Named safeguarding contact and backup contact
- How EFBI will reasonably verify a guardian's authority without collecting excessive identity data
- How authorization is renewed, withdrawn, challenged, and deleted
- Lawful basis for each data category and operation
- Final retention periods and certificate-verification exception
- Google/Firebase, YouTube, and email transfer/processor assessment
- Incident and safeguarding escalation procedure

Do not convert any pending item into a checkbox approval merely because technical implementation is complete.
