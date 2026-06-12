<template>
  <div>
    <section class="hero">
      <div class="hero-noise" />
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="hero-pill">
            <ShieldCheck :size="14" />
            Deterministic scoring, not AI guesswork
          </span>
          <h1 class="display-xl">
            A resume workspace
            <span>built on objective proof.</span>
          </h1>
          <p class="body-lg">
            Analyze your resume with a repeatable scoring engine, see exactly what needs
            improvement, and build tailored versions you can actually defend.
          </p>
          <div class="hero-actions">
            <NuxtLink to="/login" class="btn btn-primary btn-lg">
              Check my resume
              <ArrowRight :size="17" />
            </NuxtLink>
            <NuxtLink to="/methodology" class="btn btn-secondary btn-lg">
              See how scoring works
            </NuxtLink>
          </div>
          <div class="hero-trust">
            <span>
              <Check :size="14" /> PDF, DOCX, or TXT
            </span>
            <span>
              <Check :size="14" /> Private by default
            </span>
            <span>
              <Check :size="14" /> Open source
            </span>
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
                    <h3>High parse confidence. Five focused improvements.</h3>
                    <p>Verify active ownership in your work history to highlight direct outcomes.</p>
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
                    <strong>State your ownership directly</strong>
                    <p><del>Responsible for managing</del> <ins>Managed</ins> frontend architecture across three products.</p>
                  </div>
                  <span class="point-pill">+2 pts</span>
                </div>
              </div>
            </div>
          </div>
          <div class="floating-card stable-card">
            <Repeat2 :size="18" />
            <div><strong>Same input, same score</strong><span>100/100 repeatability tests</span></div>
          </div>
          <div class="floating-card version-card">
            <GitCompare :size="18" />
            <div><strong>Version 3</strong><span>Score improved 68 → 78</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="proof-strip">
      <div class="container proof-inner">
        <p>Built around how modern hiring systems actually read resumes</p>
        <div>
          <span>Parseability</span>
          <span>Evidence</span>
          <span>Job alignment</span>
          <span>Version control</span>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="section process-section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">How it works</span>
          <h2 class="display-lg">A structured path to a stronger application.</h2>
          <p class="body-lg">
            No mystery score. Every point matches a clear rule, highlights evidence in
            your original document, and provides a direct, verifiable path to improve.
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
          <span class="eyebrow">Two distinct measurements</span>
          <h2 class="display-lg">Quality and job match are not the same thing.</h2>
          <p class="body-lg">
            A well-structured resume can still lack the skills required for a specific role.
            We evaluate quality and alignment independently so you know exactly what
            to optimize.
          </p>
          <NuxtLink to="/methodology" class="text-link">
            Explore the complete methodology
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
            <p>Parseability, completeness, evidence, clarity, consistency, searchability, and mechanics.</p>
            <div class="score-tags">
              <span>Job-independent</span>
              <span>Versioned rules</span>
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
              <span>Role-specific</span>
              <span>No keyword stuffing</span>
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
              <NuxtLink to="/login" class="btn btn-primary btn-sm">Apply safe rewrite</NuxtLink>
            </div>
          </div>
        </div>
        <div class="evidence-copy">
          <span class="eyebrow">Evidence before suggestions</span>
          <h2 class="display-lg">Recommendations linked directly to your text.</h2>
          <p class="body-lg">
            Inspect the exact rule, examine the flagged content, and review the
            proposed change before anything enters your document.
          </p>
          <ul class="feature-list">
            <li>
              <CheckCircle2 /> Exact line-level evidence
            </li>
            <li>
              <CheckCircle2 /> Expected point recovery
            </li>
            <li>
              <CheckCircle2 /> Before-and-after rewrite diffs
            </li>
            <li>
              <CheckCircle2 /> New facts always require confirmation
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section workspace-section">
      <div class="container">
        <div class="section-heading centered">
          <span class="eyebrow">More than one score</span>
          <h2 class="display-lg">Keep the whole search connected.</h2>
          <p class="body-lg">
            One source resume, intentional versions for each job, and a clear
            record of what you submitted.
          </p>
        </div>
        <div class="workspace-grid">
          <article v-for="feature in workspaceFeatures" :key="feature.title" class="workspace-card">
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
          <span class="eyebrow">Built for trust</span>
          <h2 class="display-lg">Your career data belongs to you.</h2>
          <p class="body-lg">
            A resume contains contact info and employment history. Career Studio enforces
            local-first preview storage, zero telemetry logs, and explicit deletion.
          </p>
          <div class="privacy-actions">
            <NuxtLink to="/privacy" class="btn btn-secondary">Read the privacy approach</NuxtLink>
            <NuxtLink to="/open-source" class="btn btn-ghost">Inspect the open-source project</NuxtLink>
          </div>
        </div>
        <div class="privacy-points">
          <div>
            <LockKeyhole /><strong>Private by default</strong><span>All data remains in your browser during preview, and is isolated in account mode.</span>
          </div>
          <div>
            <Trash2 /><strong>Delete means delete</strong><span>Deleting a resume instantly clears source files, extracted content, and exports.</span>
          </div>
          <div>
            <BadgeCheck /><strong>Zero AI hallucinations</strong><span>We never fabricate accomplishments. Unconfirmed facts are highlighted for review.</span>
          </div>
          <div>
            <Code2 /><strong>Open methodology</strong><span>All parser rules and scoring calculations are fully open source on GitHub.</span>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container cta-card">
        <span class="eyebrow">Your next version starts here</span>
        <h2 class="display-lg">Stop wondering what the score means.</h2>
        <p class="body-lg">
          Upload your resume, review the evidence, and make changes you can defend.
        </p>
        <NuxtLink to="/login" class="btn btn-primary btn-lg">
          Check my resume
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
  Check,
  CheckCircle2,
  Code2,
  FileCheck2,
  FileSearch,
  FileUp,
  GitCompare,
  History,
  LockKeyhole,
  PencilLine,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-vue-next'

const steps = [
  {
    number: '01',
    icon: FileUp,
    title: 'Verify extracted data',
    description: 'Upload your PDF, DOCX, or text resume. Inspect exactly what the parser sees before running any rules to prevent extraction errors.',
  },
  {
    number: '02',
    icon: FileSearch,
    title: 'Audit with evidence',
    description: 'Review a versioned, repeatable quality score. Every finding points directly to an exact line in your resume with transparent point breakdowns.',
  },
  {
    number: '03',
    icon: PencilLine,
    title: 'Refine with full agency',
    description: 'Accept evidence-preserving rewrite suggestions or edit directly. Career Studio never invents facts or updates text without your approval.',
  },
]

const workspaceFeatures = [
  {
    icon: History,
    title: 'Immutable version control',
    description: 'Track original, revised, and targeted versions side-by-side. Roll back changes or compare formatting differences at any time.',
  },
  {
    icon: Target,
    title: 'Precise role alignment',
    description: 'Compare your resume structure against any job description. Uncover skill gaps and seniority mismatches without keyword stuffing.',
  },
  {
    icon: GitCompare,
    title: 'Measurable score changes',
    description: 'Instantly see how edits affect your quality score. Distinguish updates to your content from scoring engine upgrades.',
  },
  {
    icon: FileCheck2,
    title: 'Application tracking',
    description: 'Keep a clear record of the exact resume version, target job requirements, and match score for every opportunity.',
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
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.workspace-card {
  padding: 25px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
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
  .privacy-card {
    grid-template-columns: 1fr;
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
  .workspace-grid {
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
