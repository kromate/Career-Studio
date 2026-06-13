<template>
  <div class="legal-page">
    <section class="legal-hero">
      <div class="container legal-container">
        <span class="eyebrow">Privacy approach</span>
        <h1 class="display-lg">Career data deserves deliberate protection.</h1>
        <p class="body-lg">
          Career Studio may eventually hold resumes, interview notes, mentorship
          conversations, compensation context, and company experiences. This page
          describes today's behavior and the standard every future tool must meet.
        </p>
      </div>
    </section>
    <section class="legal-body">
      <div class="container legal-container">
        <article>
          <h2>Local preview mode</h2>
          <p>
            The open-source preview processes resume text in the browser and
            stores workspace state in that browser's local storage. Clearing app
            data from Settings removes that local workspace.
          </p>
        </article>
        <article>
          <h2>Production requirements</h2>
          <p>A hosted deployment must provide:</p>
          <ul>
            <li>Private, account-scoped storage and authorization.</li>
            <li>Encryption in transit and at rest.</li>
            <li>Explicit deletion of source files, extracted text, analyses, versions, and exports.</li>
            <li>A published retention policy and subprocessors list.</li>
            <li>Redacted logs with no resume content in analytics events.</li>
            <li>No model training on user documents by default.</li>
          </ul>
        </article>
        <article>
          <h2>AI rewrite boundaries</h2>
          <p>
            Suggestions may reorganize or rephrase evidence already present.
            Employers, dates, education, certifications, tools, responsibilities,
            and metrics must not be invented. Any possible new fact requires the
            user's explicit confirmation.
          </p>
        </article>
        <article>
          <h2>What is not scored</h2>
          <p>
            The product does not score protected characteristics, personality,
            disability, age, ethnicity, gender, or other sensitive traits. It is
            a job-seeker tool and must not be repurposed for employer-side ranking.
          </p>
        </article>
        <article>
          <h2>Community privacy principles</h2>
          <p>
            Future peer reviews, company reviews, interview experiences, and
            compensation submissions must minimize identifying information,
            explain anonymity limits, prevent retaliation and abuse, and give
            contributors meaningful control over editing and deletion.
          </p>
        </article>
        <article>
          <h2>Security reporting</h2>
          <p>
            Do not publish exposed credentials or vulnerabilities in a public
            issue. A production launch must configure GitHub private vulnerability
            reporting or a monitored private security address.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.legal-hero {
  padding: 78px 0 62px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-soft);
}

.legal-container {
  max-width: 780px;
}

.legal-body {
  padding: 64px 0 96px;
}

.legal-body article {
  padding: 32px 0;
  border-top: 1px solid var(--line);
}

.legal-body article:first-child {
  border-top: 0;
}

.legal-body h2 {
  margin-bottom: 12px;
  font-size: 22px;
}

.legal-body p,
.legal-body li {
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.75;
}

.legal-body ul {
  display: grid;
  gap: 7px;
  padding-left: 21px;
}
</style>
