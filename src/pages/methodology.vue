<template>
  <div class="info-page">
    <section class="info-hero">
      <div class="container narrow">
        <span class="eyebrow">Scoring methodology</span>
        <h1 class="display-lg">A score you can inspect, repeat, and challenge.</h1>
        <p class="body-lg">
          Career Studio does not pretend there is one universal ATS score. It uses
          published, deterministic checks to measure document readability, resume
          quality, and alignment with one supplied job description.
        </p>
        <div class="method-meta">
          <span><GitBranch :size="15" /> Resume scorer v1.0.0</span>
          <span><RefreshCcw :size="15" /> Reproducible by design</span>
          <span><BotOff :size="15" /> No LLM-generated numbers</span>
        </div>
      </div>
    </section>

    <section class="info-section">
      <div class="container narrow">
        <div class="two-score-intro">
          <div>
            <span class="score-label">01</span>
            <h2>Resume Quality Score</h2>
            <p>Job-independent checks covering the document itself and the evidence it communicates.</p>
          </div>
          <div>
            <span class="score-label">02</span>
            <h2>Job Match Score</h2>
            <p>A separate comparison against one supplied job description and its explicit criteria.</p>
          </div>
        </div>

        <h2 class="heading-lg section-title">Resume Quality Score dimensions</h2>
        <div class="dimension-table card">
          <div v-for="dimension in qualityDimensions" :key="dimension.label" class="dimension-row">
            <div>
              <span class="dimension-dot" :style="{ background: dimension.color }" />
              <strong>{{ dimension.label }}</strong>
            </div>
            <p>{{ dimension.description }}</p>
            <span>{{ dimension.points }} points</span>
          </div>
        </div>

        <div class="principle-block">
          <span class="principle-icon"><Repeat2 /></span>
          <div>
            <h2>What “same resume, same score” means</h2>
            <p>
              The app normalizes the extracted text into a canonical resume,
              applies a declared parser, rule set, and skills taxonomy, then
              stores those versions with every analysis. The same canonical
              input and versions return the same rule results and score.
            </p>
            <ol>
              <li>Normalize text and preserve section and bullet boundaries.</li>
              <li>Hash the canonical content.</li>
              <li>Evaluate deterministic rules with bounded points.</li>
              <li>Store each rule, its evidence, and earned points.</li>
              <li>Use AI only for explanations and optional rewrite suggestions.</li>
            </ol>
          </div>
        </div>

        <h2 class="heading-lg section-title">Job Match Score dimensions</h2>
        <div class="dimension-table card">
          <div v-for="dimension in matchDimensions" :key="dimension.label" class="dimension-row">
            <div>
              <span class="dimension-dot" :style="{ background: dimension.color }" />
              <strong>{{ dimension.label }}</strong>
            </div>
            <p>{{ dimension.description }}</p>
            <span>{{ dimension.points }} points</span>
          </div>
        </div>

        <div class="limitations">
          <h2>What this score cannot promise</h2>
          <div class="limitations-grid">
            <div v-for="item in limitations" :key="item.title">
              <XCircle :size="19" />
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="info-cta">
          <h2>See the methodology applied to your resume.</h2>
          <p>Every result includes its parser, scorer, and taxonomy versions.</p>
          <NuxtLink to="/login" class="btn btn-primary btn-lg">Review my resume</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { BotOff, GitBranch, RefreshCcw, Repeat2, XCircle } from 'lucide-vue-next'

const qualityDimensions = [
  { label: 'ATS readability', points: 20, color: '#601ded', description: 'Extractable text, recognizable structure, contact fields, dates, and simple experience bullets.' },
  { label: 'Completeness', points: 15, color: '#3869cf', description: 'Expected resume sections appropriate to a professional application.' },
  { label: 'Evidence & impact', points: 25, color: '#158564', description: 'Clear actions, ownership, outcomes, scale, and role context.' },
  { label: 'Clarity & brevity', points: 15, color: '#9a52c7', description: 'Focused bullets, concise voice, varied phrasing, and useful length.' },
  { label: 'Consistency', points: 10, color: '#ce7c13', description: 'Date, punctuation, heading, and formatting conventions.' },
  { label: 'Searchability', points: 10, color: '#297b8f', description: 'Explicit skills, recognizable titles, and professional profile links.' },
  { label: 'Mechanics', points: 5, color: '#c1394b', description: 'Placeholders, corrupted characters, and readability hazards.' },
]

const matchDimensions = [
  { label: 'Required skill coverage', points: 30, color: '#601ded', description: 'Explicit required skills found in the resume with approved aliases.' },
  { label: 'Responsibility coverage', points: 25, color: '#158564', description: 'Evidence for the actions and ownership expected in the role.' },
  { label: 'Experience & seniority', points: 20, color: '#3869cf', description: 'Alignment between expected and demonstrated scope.' },
  { label: 'Title & domain alignment', points: 10, color: '#9a52c7', description: 'Overlap with the role title and meaningful domain language.' },
  { label: 'Preferred skill coverage', points: 10, color: '#ce7c13', description: 'Nice-to-have capabilities, scored below required criteria.' },
  { label: 'Education & certification', points: 5, color: '#297b8f', description: 'Explicit education or certification requirements when present.' },
]

const limitations = [
  { title: 'No universal ATS score', description: 'Workday, Greenhouse, Lever, and other systems use different parsing and ranking behavior.' },
  { title: 'No interview guarantee', description: 'A strong resume improves communication; hiring still depends on role, market, and human decisions.' },
  { title: 'No invented evidence', description: 'The app will not fabricate employers, dates, achievements, or performance metrics.' },
  { title: 'No protected-trait scoring', description: 'The scorer does not assess personality or protected and sensitive characteristics.' },
]
</script>

<style scoped>
.info-hero {
  padding: 78px 0 64px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, var(--purple-soft), #fff);
}

.narrow {
  max-width: 900px;
}

.method-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.method-meta span {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 650;
  background: #fff;
}

.info-section {
  padding: 72px 0 96px;
}

.two-score-intro {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 85px;
}

.two-score-intro > div {
  padding: 27px;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.score-label {
  display: block;
  margin-bottom: 35px;
  color: var(--purple);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
}

.two-score-intro h2 {
  margin-bottom: 10px;
  font-size: 22px;
}

.two-score-intro p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.section-title {
  margin-top: 70px;
  margin-bottom: 23px;
}

.dimension-table {
  overflow: hidden;
}

.dimension-row {
  display: grid;
  grid-template-columns: 190px 1fr 90px;
  align-items: center;
  gap: 20px;
  padding: 17px 20px;
  border-top: 1px solid var(--line);
}

.dimension-row:first-child {
  border-top: 0;
}

.dimension-row > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dimension-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dimension-row strong {
  font-size: 12px;
}

.dimension-row p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}

.dimension-row > span {
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}

.principle-block {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 25px;
  margin: 85px 0;
  padding: 32px;
  border: 1px solid #ded3fa;
  border-radius: 12px;
  background: var(--purple-soft);
}

.principle-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: var(--purple);
}

.principle-block h2 {
  margin-bottom: 10px;
  font-size: 23px;
}

.principle-block p,
.principle-block li {
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.65;
}

.principle-block ol {
  margin: 18px 0 0;
  padding-left: 20px;
}

.limitations {
  margin-top: 90px;
}

.limitations > h2 {
  margin-bottom: 24px;
  font-size: 28px;
}

.limitations-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}

.limitations-grid > div {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 15px;
}

.limitations-grid svg {
  margin-bottom: 15px;
  color: var(--red);
}

.limitations-grid strong {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
}

.limitations-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.info-cta {
  margin-top: 85px;
  padding: 45px;
  border-radius: 20px;
  color: #fff;
  text-align: center;
  background: var(--ink);
}

.info-cta h2 {
  margin-bottom: 10px;
  font-size: 29px;
}

.info-cta p {
  margin-bottom: 23px;
  color: #bcb6c9;
  font-size: 13px;
}

@media (max-width: 700px) {
  .two-score-intro,
  .limitations-grid {
    grid-template-columns: 1fr;
  }

  .dimension-row {
    grid-template-columns: 1fr auto;
  }

  .dimension-row p {
    grid-column: 1 / -1;
  }

  .principle-block {
    grid-template-columns: 1fr;
  }
}
</style>
