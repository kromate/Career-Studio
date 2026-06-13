<template>
  <div>
    <section class="oss-hero">
      <div class="container oss-grid">
        <div>
          <span class="eyebrow">Open source</span>
          <h1 class="display-lg">Career tools should be shaped by the people who use them.</h1>
          <p class="body-lg">
            Career Studio is MIT licensed and built in public. We are starting with
            trustworthy resume improvement, then growing toward peer practice,
            mentorship, company and pay insights, job search, and career exploration.
          </p>
          <div class="oss-actions">
            <a href="https://github.com/kromate/Career-Studio" class="btn btn-primary btn-lg" target="_blank" rel="noreferrer">
              <Github :size="18" />
              View Career Studio on GitHub
            </a>
            <NuxtLink to="/methodology" class="btn btn-secondary btn-lg">Read the methodology</NuxtLink>
          </div>
        </div>
        <div class="repo-card">
          <div class="repo-top">
            <Github :size="21" />
            <div><strong>kromate/Career-Studio</strong><span>Public application repository</span></div>
            <span class="badge">MIT</span>
          </div>
          <pre><code>apps/projects/career-studio
├── src/lib/resume
│   ├── parser.ts
│   ├── scoring.ts
│   ├── matching.ts
│   └── rewrite.ts
├── tests/unit
└── docs/SCORING.md</code></pre>
          <div class="repo-stats">
            <span><ShieldCheck /> Deterministic core</span>
            <span><TestTube2 /> Golden fixtures</span>
            <span><GitPullRequest /> Contributor ready</span>
          </div>
        </div>
      </div>
    </section>

    <section class="contribute-section">
      <div class="container">
        <div class="principles-intro">
          <div class="section-heading">
            <span class="eyebrow">How we want to build</span>
            <h2 class="display-lg">Useful, accountable, and sustainable without putting profit ahead of people.</h2>
          </div>
          <div class="principle-grid">
            <article>
              <strong>User agency</strong>
              <p>Career Studio can explain, organize, and suggest. The person using it makes the final decision.</p>
            </article>
            <article>
              <strong>Transparent costs</strong>
              <p>If a feature depends on paid infrastructure or someone's time, the cost should be clear and tied to delivering that value.</p>
            </article>
            <article>
              <strong>Public accountability</strong>
              <p>Methods, limitations, tradeoffs, and core product decisions should be open to inspection and challenge.</p>
            </article>
          </div>
        </div>

        <div class="section-heading">
          <span class="eyebrow">Where contributors can help</span>
          <h2 class="display-lg">Help build the career support you wish existed.</h2>
        </div>
        <div class="contribution-grid">
          <article v-for="area in areas" :key="area.title">
            <span><component :is="area.icon" :size="23" /></span>
            <h3>{{ area.title }}</h3>
            <p>{{ area.description }}</p>
          </article>
        </div>
        <div class="contribution-rules">
          <h2>Contribution expectations</h2>
          <div>
            <p><CheckCircle2 /> Add tests for scoring and parsing behavior.</p>
            <p><CheckCircle2 /> Never commit real resumes or customer data.</p>
            <p><CheckCircle2 /> Explain new permissions and external services.</p>
            <p><CheckCircle2 /> Preserve deterministic numeric scoring.</p>
            <p><CheckCircle2 /> Keep unsupported facts out of generated resumes.</p>
            <p><CheckCircle2 /> Maintain keyboard and screen-reader access.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Accessibility,
  Building2,
  CheckCircle2,
  GitPullRequest,
  Github,
  GraduationCap,
  Mic2,
  ScanText,
  ShieldCheck,
  TestTube2,
  Waypoints,
} from 'lucide-vue-next'

const areas = [
  { icon: ScanText, title: 'Resume parsing', description: 'Improve extraction fixtures, section detection, layout warnings, and international formats.' },
  { icon: Waypoints, title: 'Scoring methodology', description: 'Improve rule quality, explainability, fairness, and the evidence behind every recommendation.' },
  { icon: Mic2, title: 'Interview practice', description: 'Design peer matching, scheduling, realistic formats, structured feedback, and trust controls.' },
  { icon: GraduationCap, title: 'Mentorship', description: 'Explore goal-based discovery, availability, booking, boundaries, and community reputation.' },
  { icon: Building2, title: 'Company and pay insights', description: 'Build anonymous, moderated interview reviews and useful compensation context.' },
  { icon: Accessibility, title: 'Accessible community', description: 'Make every workflow usable across devices, abilities, regions, and career stages.' },
]
</script>

<style scoped>
.oss-hero {
  padding: 78px 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(96, 29, 237, 0.09), transparent 30%),
    #f9fafb;
}

.oss-grid {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  align-items: center;
  gap: 80px;
}

.oss-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.repo-card {
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: #fff;
}

.repo-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 17px 19px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  background: #f9fafb;
}

.repo-top strong,
.repo-top span {
  display: block;
}

.repo-top strong {
  margin-bottom: 2px;
  font-size: 12px;
}

.repo-top div span {
  color: var(--muted);
  font-size: 11px;
}

.repo-card pre {
  margin: 0;
  padding: 28px;
  color: var(--ink-soft);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.8;
  background: #fff;
}

.repo-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--line);
  background: #f9fafb;
}

.repo-stats span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 11px;
}

.contribute-section {
  padding: 88px 0;
}

.principles-intro {
  margin-bottom: 90px;
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.principle-grid article {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f9fafb;
}

.principle-grid strong {
  display: block;
  margin-bottom: 9px;
  font-size: 15px;
}

.principle-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
}

.contribution-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.contribution-grid article {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.contribution-grid article > span {
  display: grid;
  width: 45px;
  height: 45px;
  place-items: center;
  margin-bottom: 25px;
  border-radius: 13px;
  color: var(--purple);
  background: var(--purple-soft);
}

.contribution-grid h3 {
  margin-bottom: 8px;
  font-size: 17px;
}

.contribution-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.contribution-rules {
  display: grid;
  grid-template-columns: 0.65fr 1.35fr;
  gap: 50px;
  margin-top: 65px;
  padding: 35px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f9fafb;
}

.contribution-rules h2 {
  margin: 0;
  font-size: 25px;
}

.contribution-rules > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 22px;
}

.contribution-rules p {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.contribution-rules svg {
  flex: 0 0 auto;
  color: var(--green);
}

@media (max-width: 900px) {
  .oss-grid,
  .principle-grid,
  .contribution-rules {
    grid-template-columns: 1fr;
  }

  .contribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .contribution-grid,
  .contribution-rules > div {
    grid-template-columns: 1fr;
  }
}
</style>
