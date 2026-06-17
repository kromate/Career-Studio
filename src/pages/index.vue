<template>
  <div>
    <section class="hero">
      <div class="hero-noise" />
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="hero-pill">
            <HeartHandshake :size="14" />
            Your open-source career workspace
          </span>
          <h1 class="display-xl">
            Make your next career move with evidence, not guesswork.
            <span>Start with a resume that proves your value.</span>
          </h1>
          <p class="body-lg">
            Review your resume, improve it without inventing experience, compare it
            with real roles, and keep every application connected. Career Studio is
            growing into one trusted place for the work behind your career.
          </p>
          <div class="hero-actions">
            <NuxtLink to="/login" class="btn btn-primary btn-lg">
              Check my resume
              <ArrowRight :size="17" />
            </NuxtLink>
            <NuxtLink to="/#vision" class="btn btn-secondary btn-lg">
              Explore the roadmap
            </NuxtLink>
          </div>
          <div class="hero-trust">
            <span><Check :size="14" /> Explainable feedback</span>
            <span><Check :size="14" /> No invented experience</span>
            <span><Check :size="14" /> Built in public</span>
          </div>
        </div>

        <div class="hero-product">
          <div class="browser-frame">
            <div class="browser-bar">
              <div class="browser-dots"><i /><i /><i /></div>
              <span>careerstudio.goalmatic.io/resumes/analysis</span>
              <ShieldCheck :size="14" />
            </div>
            <div class="product-shell">
              <div class="product-sidebar">
                <BrandMark :compact="true" />
                <i v-for="index in 5" :key="index" :class="{ active: index === 2 }" />
              </div>
              <div class="product-main">
                <div class="analysis-top">
                  <ScoreRing :score="78" :size="112" :stroke="9" />
                  <div>
                    <span class="badge badge-green">High parse confidence</span>
                    <h3>Your resume is readable. Five clear next steps.</h3>
                    <p>Make your ownership and outcomes easier for a reviewer to see.</p>
                  </div>
                </div>
                <div class="mini-dimensions">
                  <DimensionBar label="ATS readability" :score="18" :max-score="20" />
                  <DimensionBar label="Evidence & impact" :score="16" :max-score="25" />
                  <DimensionBar label="Clarity & brevity" :score="12" :max-score="15" />
                </div>
                <div class="finding-preview">
                  <span class="finding-icon">
                    <Sparkles :size="17" />
                  </span>
                  <div>
                    <strong>Lead with what you did</strong>
                    <p><del>Responsible for managing</del> <ins>Managed</ins> frontend architecture across three products.</p>
                  </div>
                  <span class="point-pill">+2 pts</span>
                </div>
              </div>
            </div>
          </div>
          <div class="floating-card stable-card">
            <Repeat2 :size="18" />
            <div><strong>Repeatable by design</strong><span>Same resume, same scorer, same result</span></div>
          </div>
          <div class="floating-card version-card">
            <GitCompare :size="18" />
            <div><strong>Progress you can see</strong><span>Version 3 · score improved 68 → 78</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="proof-strip">
      <div class="container proof-inner">
        <p>One profile. Every intentional career move.</p>
        <div>
          <span>Review</span>
          <span>Improve</span>
          <span>Target</span>
          <span>Track</span>
        </div>
      </div>
    </section>

    <section id="products" class="section product-suite-section">
      <div class="container">
        <div class="suite-heading">
          <div>
            <span class="eyebrow">A connected career toolkit</span>
            <h2 class="display-lg">Start with the tools that make every application stronger.</h2>
          </div>
          <p class="body-lg">
            Career Studio keeps your source resume, verified evidence, role targets,
            and application history connected. Build once, then create deliberate
            versions for each opportunity.
          </p>
        </div>
        <div class="suite-grid">
          <article
            v-for="product in products"
            :key="product.title"
            class="suite-card"
            :class="{ featured: product.featured }"
          >
            <div class="suite-card-top">
              <span class="suite-icon">
                <component :is="product.icon" :size="21" />
              </span>
              <small :class="{ live: product.live }">
                {{ product.live ? 'Available now' : product.phase }}
              </small>
            </div>
            <h3>{{ product.title }}</h3>
            <p>{{ product.description }}</p>
            <NuxtLink v-if="product.live" to="/login" class="suite-link">
              {{ product.action }}
              <ArrowRight :size="14" />
            </NuxtLink>
            <span v-else class="suite-link planned">
              Open-source roadmap
            </span>
          </article>
        </div>
        <div class="suite-principle">
          <ShieldCheck :size="19" />
          <p>
            <strong>Automation should earn your trust.</strong>
            Career Studio will prepare, personalize, and organize work before it
            automates submission. You review what represents you.
          </p>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="section process-section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Start here: resume review</span>
          <h2 class="display-lg">Know what to fix. Understand why. Stay in control.</h2>
          <p class="body-lg">
            See how software reads your document, where your evidence could be clearer,
            and how to improve it without changing the truth of your experience.
          </p>
        </div>
        <div class="process-grid">
          <article v-for="step in steps" :key="step.number" class="process-card">
            <span class="step-number">{{ step.number }}</span>
            <span class="process-icon">
              <component :is="step.icon" :size="23" />
            </span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section score-section">
      <div class="container score-grid">
        <div class="score-copy-block">
          <span class="eyebrow">Two questions, two measurements</span>
          <h2 class="display-lg">Is the resume strong? Does it fit this role?</h2>
          <p class="body-lg">
            Resume quality measures how clearly your document communicates your
            experience. Job match compares that evidence with one job description.
            Keeping them separate gives you a more honest picture of what to improve.
          </p>
          <NuxtLink to="/methodology" class="text-link">
            Read how scoring works
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>
        <div class="score-cards">
          <article class="score-type-card quality">
            <span class="score-type-icon">
              <FileCheck2 :size="23" />
            </span>
            <div class="score-number">78<span>/100</span></div>
            <h3>Resume Quality Score</h3>
            <p>Structure, clarity, evidence, consistency, searchability, and mechanics.</p>
            <div class="score-tags">
              <span>Independent of any job</span>
              <span>Published rule version</span>
            </div>
          </article>
          <article class="score-type-card match">
            <span class="score-type-icon">
              <Target :size="23" />
            </span>
            <div class="score-number">86<span>/100</span></div>
            <h3>Job Match Score</h3>
            <p>Required skills, responsibilities, seniority, title, domain, education, and preferred criteria.</p>
            <div class="score-tags">
              <span>One job at a time</span>
              <span>No reward for repetition</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section evidence-section">
      <div class="container evidence-grid">
        <div class="evidence-product card">
          <div class="evidence-toolbar">
            <div>
              <span>Finding 2 of 6</span>
              <strong>Evidence & impact</strong>
            </div>
            <span class="badge badge-amber">Medium priority</span>
          </div>
          <div class="evidence-body">
            <div class="resume-snippet">
              <span>EXPERIENCE</span>
              <strong>Senior Software Engineer · Kromate</strong>
              <p>Led development of a workflow platform used by 2,400 monthly users.</p>
              <p class="flagged">Responsible for managing frontend architecture across three products.</p>
              <p>Worked on Firebase integrations and account security.</p>
            </div>
            <div class="finding-panel">
              <span class="badge badge-purple">impact.weak-phrasing</span>
              <h3>Ownership is hidden by passive phrasing.</h3>
              <p>Say what you did directly. This improves clarity without changing the underlying claim.</p>
              <div class="diff">
                <del>Responsible for managing</del>
                <ins>Managed</ins>
              </div>
              <NuxtLink to="/login" class="btn btn-primary btn-sm">Review this rewrite</NuxtLink>
            </div>
          </div>
        </div>
        <div class="evidence-copy">
          <span class="eyebrow">Specific beats generic</span>
          <h2 class="display-lg">Feedback you can trace back to your own words.</h2>
          <p class="body-lg">
            Every recommendation begins with the exact text that triggered it,
            explains why it matters, and lets you review the change before saving.
          </p>
          <ul class="feature-list">
            <li>
              <CheckCircle2 /> The exact text behind each finding
            </li>
            <li>
              <CheckCircle2 /> A plain-language reason it matters
            </li>
            <li>
              <CheckCircle2 /> A before-and-after comparison
            </li>
            <li>
              <CheckCircle2 /> You approve every saved change
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section id="vision" class="section workspace-section">
      <div class="container">
        <div class="section-heading centered">
          <span class="eyebrow">Where Career Studio is going</span>
          <h2 class="display-lg">One workspace for the work behind your career.</h2>
          <p class="body-lg">
            A career is more than applications. It is a series of decisions,
            conversations, practice sessions, and opportunities to learn from others.
            Career Studio will bring that work together and build it in the open.
          </p>
        </div>
        <div class="workspace-grid">
          <article v-for="feature in workspaceFeatures" :key="feature.title" class="workspace-card">
            <small :class="{ live: feature.live }">{{ feature.live ? 'Available now' : 'On the roadmap' }}</small>
            <span>
              <component :is="feature.icon" :size="22" />
            </span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section privacy-section">
      <div class="container privacy-card">
        <div>
          <span class="eyebrow">Trust is a product feature</span>
          <h2 class="display-lg">Your career is personal. Your data stays under your control.</h2>
          <p class="body-lg">
            Resumes, interview notes, pay information, and workplace experiences are
            sensitive. Every Career Studio feature should collect only what it needs,
            explain how it is used, and give you meaningful control over deletion.
          </p>
          <div class="privacy-actions">
            <NuxtLink to="/privacy" class="btn btn-secondary">Read the privacy approach</NuxtLink>
            <a href="https://github.com/kromate/Career-Studio" class="btn btn-ghost" target="_blank" rel="noreferrer">Inspect the open-source project</a>
          </div>
        </div>
        <div class="privacy-points">
          <div>
            <LockKeyhole /><strong>Private by default</strong><span>Local preview data stays in this browser. Hosted storage must be account-scoped before production use.</span>
          </div>
          <div>
            <Trash2 /><strong>Clear deletion controls</strong><span>Remove a resume and its local versions and analyses from the browser workspace.</span>
          </div>
          <div>
            <BadgeCheck /><strong>No invented career history</strong><span>Suggestions may rephrase your evidence, but new facts always require your confirmation.</span>
          </div>
          <div>
            <Code2 /><strong>Open methods and code</strong><span>Inspect the implementation, challenge decisions, propose features, and contribute on GitHub.</span>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container cta-card">
        <span class="eyebrow">Start with one clear next step</span>
        <h2 class="display-lg">See what your resume communicates today.</h2>
        <p class="body-lg">
          Check the extraction, understand the score, and leave with prioritized
          improvements you can review on your terms.
        </p>
        <NuxtLink to="/login" class="btn btn-primary btn-lg">
          Get my resume review
          <ArrowRight :size="17" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Code2,
  FileCheck2,
  FileSearch,
  FileUp,
  GitCompare,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Mic2,
  Building2,
  Compass,
  LockKeyhole,
  PencilLine,
  Repeat2,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-vue-next'

const steps = [
  {
    number: '01',
    icon: FileUp,
    title: 'See what we see',
    description: 'Upload a PDF, DOCX, or text resume, then confirm the extracted sections and words before any score is calculated.',
  },
  {
    number: '02',
    icon: FileSearch,
    title: 'Get feedback you can trace',
    description: 'Review a repeatable score and prioritized findings tied to exact evidence in your resume.',
  },
  {
    number: '03',
    icon: PencilLine,
    title: 'Build the next version',
    description: 'Edit directly or review evidence-preserving suggestions. Nothing is saved without your approval.',
  },
]

const products = [
  {
    icon: FileCheck2,
    title: 'Resume checker',
    description: 'Score clarity, evidence, structure, consistency, searchability, and mechanics with a published, repeatable method.',
    action: 'Check my resume',
    phase: 'Available now',
    live: true,
    featured: true,
  },
  {
    icon: PencilLine,
    title: 'Resume builder',
    description: 'Turn findings into stronger versions, review every change, and export an ATS-readable document without invented facts.',
    action: 'Improve my resume',
    phase: 'Available now',
    live: true,
    featured: false,
  },
  {
    icon: Target,
    title: 'Job match',
    description: 'Compare one reviewed resume with one role and see supported requirements, evidence gaps, and a separate match score.',
    action: 'Target a role',
    phase: 'Available now',
    live: true,
    featured: false,
  },
  {
    icon: BriefcaseBusiness,
    title: 'Application tracker',
    description: 'Connect saved jobs, tailored resume versions, and application stages so the history of every opportunity stays clear.',
    action: 'Organize my search',
    phase: 'Available now',
    live: true,
    featured: false,
  },
  {
    icon: FileSearch,
    title: 'Cover letter studio',
    description: 'Draft job-specific letters from your approved resume evidence and writing preferences, with every new claim flagged for review.',
    action: '',
    phase: 'Planned next',
    live: false,
    featured: false,
  },
  {
    icon: Send,
    title: 'Application assistant',
    description: 'Prepare application answers and autofill repeated details with a complete audit trail and confirmation before anything is sent.',
    action: '',
    phase: 'Later phase',
    live: false,
    featured: false,
  },
]

const workspaceFeatures = [
  {
    icon: FileCheck2,
    title: 'Resumes and applications',
    description: 'Show your strongest evidence, tailor it to a role, and track the exact version used for every application.',
    live: true,
  },
  {
    icon: Mic2,
    title: 'Practice interviews',
    description: 'Practice live with peers, exchange structured feedback, and become more comfortable before the real conversation.',
    live: false,
  },
  {
    icon: GraduationCap,
    title: 'Mentors and career conversations',
    description: 'Find people whose experience matches your goal and book focused conversations about the move ahead.',
    live: false,
  },
  {
    icon: Building2,
    title: 'Company and pay insights',
    description: 'Compare anonymous interview experiences, workplace context, and compensation shared by the community.',
    live: false,
  },
  {
    icon: Compass,
    title: 'Career exploration',
    description: 'Connect your skills, interests, and work preferences to roles and realistic paths you may not have considered.',
    live: false,
  },
  {
    icon: MessagesSquare,
    title: 'Peer support',
    description: 'Give and receive useful reviews, share practical experience, and grow alongside people working toward similar goals.',
    live: false,
  },
]
</script>

<style scoped>
.hero {
  overflow: hidden;
  position: relative;
  padding: 78px 0 88px;
  background:
    radial-gradient(circle at 78% 22%, rgba(96, 29, 237, 0.1), transparent 32%),
    linear-gradient(180deg, #fff 0%, #f9fafb 100%);
}

.hero-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: radial-gradient(#98a2b3 0.6px, transparent 0.6px);
  background-size: 20px 20px;
  mask-image: linear-gradient(to bottom, #000, transparent 80%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(500px, 1.05fr);
  align-items: center;
  gap: 56px;
  position: relative;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 20px;
  padding: 7px 11px;
  border: 1px solid #ded3fa;
  border-radius: 8px;
  color: var(--purple-dark);
  font-size: 11px;
  font-weight: 700;
  background: rgba(245, 241, 254, 0.9);
}

.hero-copy h1 span {
  display: block;
  color: var(--purple);
}

.hero-copy .body-lg {
  max-width: 610px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 34px;
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 19px;
  margin-top: 25px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.hero-trust span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.hero-trust svg {
  color: var(--green);
}

.hero-product {
  min-width: 0;
  position: relative;
  perspective: 1200px;
}

.browser-frame {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(16, 24, 40, 0.12);
}

.browser-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 15px;
  height: 43px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  background: #fbfafc;
}

.browser-bar>span {
  overflow: hidden;
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #fff;
}

.browser-dots {
  display: flex;
  gap: 5px;
}

.browser-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d8d3df;
}

.product-shell {
  display: grid;
  grid-template-columns: 62px 1fr;
  min-height: 450px;
  background: #f9fafb;
}

.product-sidebar {
  display: flex;
  align-items: center;
  gap: 17px;
  flex-direction: column;
  padding: 15px 11px;
  border-right: 1px solid var(--line);
  background: #fff;
}

.product-sidebar i {
  display: block;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #f1eff4;
}

.product-sidebar i.active {
  background: var(--purple-soft);
  box-shadow: inset 3px 0 0 var(--purple);
}

.product-main {
  padding: 28px;
}

.analysis-top {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 22px;
}

.analysis-top h3 {
  margin: 12px 0 5px;
  font-size: 16px;
}

.analysis-top p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.mini-dimensions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 28px 0;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
}

.finding-preview {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4dcff;
  border-radius: 12px;
  background: #fff;
}

.finding-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  color: var(--purple);
  background: var(--purple-soft);
}

.finding-preview strong {
  font-size: 11px;
}

.finding-preview p {
  margin: 5px 0 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.finding-preview del {
  color: var(--red);
  text-decoration-color: #e7a8b1;
}

.finding-preview ins {
  color: var(--green);
  text-decoration: none;
  background: var(--green-soft);
}

.point-pill {
  padding: 4px 7px;
  border-radius: 99px;
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
  background: var(--green-soft);
}

.floating-card {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  z-index: 2;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--purple);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.1);
}

.floating-card strong,
.floating-card span {
  display: block;
}

.floating-card strong {
  color: var(--ink);
  font-size: 10px;
}

.floating-card span {
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
}

.stable-card {
  top: -24px;
  right: -18px;
}

.version-card {
  right: 25px;
  bottom: -28px;
}

.proof-strip {
  border-block: 1px solid var(--line);
  background: #fff;
}

.proof-inner {
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.proof-inner p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.proof-inner div {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.product-suite-section {
  background: #f8f9fb;
}

.suite-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.65fr);
  align-items: end;
  gap: 70px;
  margin-bottom: 42px;
}

.suite-heading h2,
.suite-heading p {
  margin-bottom: 0;
}

.suite-heading p {
  color: var(--ink-soft);
}

.suite-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.suite-card {
  display: flex;
  min-height: 268px;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
}

.suite-card.featured {
  border-color: #d8cafa;
  background:
    radial-gradient(circle at 100% 0%, rgba(96, 29, 237, 0.09), transparent 38%),
    #fff;
}

.suite-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
}

.suite-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  color: var(--purple);
  background: var(--purple-soft);
}

.suite-card small {
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  background: var(--surface-soft);
}

.suite-card small.live {
  color: var(--green);
  background: var(--green-soft);
}

.suite-card h3 {
  margin: 0 0 9px;
  font-size: 17px;
}

.suite-card p {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
}

.suite-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  color: var(--purple);
  font-size: 11px;
  font-weight: 750;
}

.suite-link.planned {
  color: var(--muted);
}

.suite-principle {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 15px;
  padding: 18px 20px;
  border: 1px solid #dfd7f2;
  border-radius: 13px;
  color: var(--purple);
  background: var(--purple-soft);
}

.suite-principle p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.55;
}

.suite-principle strong {
  color: var(--ink);
}

.section {
  padding: 96px 0;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 54px;
}

.section-heading.centered {
  margin-inline: auto;
  text-align: center;
}

.process-section {
  background: #fff;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.process-card {
  min-height: 250px;
  position: relative;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #f9fafb;
}

.step-number {
  position: absolute;
  top: 25px;
  right: 25px;
  color: #c8c1d1;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.process-icon,
.workspace-card>span,
.score-type-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  margin-bottom: 30px;
  border-radius: 14px;
  color: var(--purple);
  background: var(--purple-soft);
}

.process-card h3,
.workspace-card h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.process-card p,
.workspace-card p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
}

.score-section {
  background: var(--purple-soft);
}

.score-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  align-items: center;
  gap: 80px;
}

.score-copy-block {
  color: var(--ink);
}

.score-copy-block .body-lg {
  color: var(--ink-soft);
}

.score-copy-block .eyebrow {
  color: var(--purple);
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: var(--purple);
  font-size: 13px;
  font-weight: 700;
}

.score-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.score-type-card {
  min-height: 380px;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--ink);
  background: #fff;
}

.score-type-card.quality {
  border-color: #d7c8fa;
}

.score-type-card.match {
  border-color: #c9e2d8;
}

.score-number {
  margin: 25px 0 20px;
  font-family: var(--font-display);
  font-size: 50px;
  color: var(--purple);
  font-weight: 700;
  letter-spacing: -0.06em;
}

.score-number span {
  color: var(--muted);
  font-size: 15px;
}

.score-type-card h3 {
  margin-bottom: 10px;
  font-size: 19px;
}

.score-type-card p {
  min-height: 90px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
}

.score-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 28px;
}

.score-tags span {
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--ink-soft);
  font-size: 11px;
}

.evidence-section {
  background: #f9fafb;
}

.evidence-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  align-items: center;
  gap: 70px;
}

.evidence-product {
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.evidence-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
}

.evidence-toolbar span,
.evidence-toolbar strong {
  display: block;
}

.evidence-toolbar div>span {
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 11px;
}

.evidence-toolbar div>strong {
  font-size: 12px;
}

.evidence-body {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  min-height: 420px;
}

.resume-snippet {
  padding: 37px;
  border-right: 1px solid var(--line);
  background: #f4f2f7;
}

.resume-snippet>span {
  display: block;
  margin-bottom: 22px;
  padding-bottom: 7px;
  border-bottom: 1px solid #3b3545;
  font-family: Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.resume-snippet>strong {
  display: block;
  margin-bottom: 17px;
  font-family: Arial, sans-serif;
  font-size: 11px;
}

.resume-snippet p {
  margin-bottom: 12px;
  padding: 6px 8px;
  font-family: Arial, sans-serif;
  font-size: 11px;
  line-height: 1.5;
}

.resume-snippet p::before {
  margin-right: 7px;
  content: '•';
}

.resume-snippet .flagged {
  border-left: 3px solid var(--amber);
  background: #fff1ca;
}

.finding-panel {
  padding: 30px 25px;
}

.finding-panel h3 {
  margin: 19px 0 10px;
  font-size: 18px;
}

.finding-panel>p {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.diff {
  display: grid;
  gap: 6px;
  margin: 22px 0;
  padding: 13px;
  border-radius: 10px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  background: var(--surface-soft);
}

.diff del {
  color: var(--red);
}

.diff ins {
  color: var(--green);
  text-decoration: none;
}

.feature-list {
  display: grid;
  gap: 15px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 600;
}

.feature-list svg {
  width: 19px;
  flex: 0 0 auto;
  color: var(--green);
}

.workspace-section {
  background: #fff;
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.workspace-card {
  padding: 25px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
}

.workspace-card small {
  display: inline-flex;
  margin-bottom: 18px;
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 750;
  text-transform: uppercase;
  background: var(--surface-soft);
}

.workspace-card small.live {
  color: var(--green);
  background: var(--green-soft);
}

.workspace-card>span {
  width: 43px;
  height: 43px;
  margin-bottom: 24px;
}

.privacy-section {
  padding-top: 40px;
  background: #fff;
}

.privacy-card {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 70px;
  padding: 52px;
  border: 1px solid #ded3fa;
  border-radius: 16px;
  background: var(--purple-soft);
}

.privacy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
}

.privacy-points {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.privacy-points>div {
  padding: 19px;
  border: 1px solid rgba(217, 210, 235, 0.8);
  border-radius: 10px;
  background: #fff;
}

.privacy-points svg {
  margin-bottom: 18px;
  color: var(--purple);
}

.privacy-points strong,
.privacy-points span {
  display: block;
}

.privacy-points strong {
  margin-bottom: 7px;
  font-family: var(--font-display);
  font-size: 13px;
}

.privacy-points span {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.cta-section {
  padding: 100px 0;
  background: #fff;
}

.cta-card {
  padding: 72px 40px;
  border-radius: 18px;
  color: #fff;
  text-align: center;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.12), transparent 22%),
    radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.1), transparent 26%),
    #212028;
}

.cta-card .eyebrow {
  color: #bca5f8;
}

.cta-card .body-lg {
  max-width: 650px;
  margin: 0 auto 30px;
  color: #bcb6c9;
}

@media (max-width: 1050px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    max-width: 720px;
  }

  .hero-product {
    width: min(100%, 720px);
    margin-inline: auto;
  }

  .score-grid,
  .evidence-grid,
  .privacy-card,
  .suite-heading {
    grid-template-columns: 1fr;
  }

  .suite-heading {
    gap: 20px;
  }

  .suite-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .workspace-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .hero {
    padding: 65px 0 80px;
  }

  .hero-grid {
    gap: 55px;
  }

  .hero-product {
    width: 110%;
    margin-left: -5%;
  }

  .stable-card {
    right: 6px;
  }

  .version-card {
    display: none;
  }

  .product-shell {
    grid-template-columns: 48px 1fr;
  }

  .product-main {
    padding: 18px 14px;
  }

  .product-sidebar {
    padding-inline: 7px;
  }

  .product-sidebar i {
    width: 26px;
    height: 26px;
  }

  .analysis-top {
    gap: 12px;
  }

  .analysis-top :deep(.score-ring) {
    transform: scale(0.8);
  }

  .mini-dimensions {
    grid-template-columns: 1fr;
    margin: 18px 0;
  }

  .proof-inner {
    align-items: flex-start;
    flex-direction: column;
    padding-block: 24px;
  }

  .proof-inner div {
    gap: 15px;
  }

  .section {
    padding: 75px 0;
  }

  .process-grid,
  .score-cards,
  .workspace-grid,
  .suite-grid {
    grid-template-columns: 1fr;
  }

  .evidence-body {
    grid-template-columns: 1fr;
  }

  .resume-snippet {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .privacy-card {
    padding: 35px 24px;
  }

  .privacy-points {
    grid-template-columns: 1fr;
  }

  .cta-card {
    padding: 60px 22px;
  }
}
</style>
