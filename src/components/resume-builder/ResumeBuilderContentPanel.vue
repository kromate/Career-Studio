<template>
  <div v-if="!activeSection" class="section-list">
    <article
      v-for="section in sectionRows"
      :key="section.id"
      class="section-row-wrap"
      draggable="true"
      @dragstart="draggedSectionId = section.id"
      @dragover.prevent
      @drop="dropSection(section.id)"
    >
      <div
        class="section-row"
        role="button"
        tabindex="0"
        @click="openSection(section.key)"
        @keydown.enter.prevent="openSection(section.key)"
        @keydown.space.prevent="openSection(section.key)"
        @keydown.alt.up.prevent="moveSection(section.id, -1)"
        @keydown.alt.down.prevent="moveSection(section.id, 1)"
      >
        <GripVertical :size="15" />
        <component :is="section.icon" :size="15" />
        <span class="section-title">{{ section.title }}</span>
        <strong :class="section.statusTone">{{ section.status }}</strong>
        <button v-if="section.ai" class="mini-ai" type="button" title="AI suggestions" @click.stop>
          <Sparkles :size="13" />
        </button>
        <button
          v-if="section.actions"
          class="section-menu-trigger"
          type="button"
          :aria-label="`Section actions for ${section.title}`"
          @click.stop="menuOpenFor = menuOpenFor === section.id ? '' : section.id"
        >
          <MoreHorizontal :size="15" />
        </button>
      </div>
      <div v-if="menuOpenFor === section.id" class="section-menu">
        <button type="button" @click="startRename(section.id, section.key)">Rename section</button>
        <button type="button" @click="moveSection(section.id, -1)">Move up</button>
        <button type="button" @click="moveSection(section.id, 1)">Move down</button>
        <button type="button" @click="hideSection(section.id, section.key)">Remove section</button>
      </div>
    </article>
    <div v-if="addingSection" class="add-section-inline">
      <input
        v-model.trim="newSectionName"
        class="input"
        placeholder="Section name, then press Enter"
        @keydown.enter="confirmAddSection"
        @keydown.escape="addingSection = false"
      >
    </div>
    <button v-else class="add-section-button" type="button" @click="addingSection = true">
      <Plus :size="15" />
      Add Section
    </button>
  </div>

  <div v-else-if="activeSection === 'profile'" class="drill-panel">
    <header class="drill-header">
      <button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection">
        <span>&lt;</span>
      </button>
      <h2>Personal Information</h2>
      <button class="drill-ai-action" type="button" aria-label="AI suggestions">
        <Wand2 :size="16" />
      </button>
    </header>
    <section class="editor-block">
      <div class="block-heading"><strong>Tailoring</strong><small>Tunes every AI suggestion</small></div>
      <div class="field-grid two">
        <label class="field">
          <span class="field-label">Target Role</span>
          <input class="input" :value="document.profile.targetRole" placeholder="e.g. Senior Software Engineer" @input="updateProfile('targetRole', inputValue($event))">
        </label>
        <div class="field">
          <span class="field-label">Experience Level</span>
          <div class="compact-segments">
            <button v-for="level in experienceLevels" :key="level.value" type="button" :class="{ active: document.profile.experienceLevel === level.value }" @click="updateProfile('experienceLevel', level.value)">{{ level.label }}</button>
          </div>
        </div>
      </div>
      <p class="field-helper">Add a target role to unlock AI suggestions (skills, summary, bullets).</p>
    </section>
    <section class="editor-block">
      <div class="block-heading"><strong>Contact details</strong><small>Used in the resume header</small></div>
      <div class="field-grid two">
        <label class="field"><span class="field-label">First Name</span><input class="input" :value="document.profile.firstName" placeholder="John" @input="updateProfile('firstName', inputValue($event))"></label>
        <label class="field"><span class="field-label">Last Name</span><input class="input" :value="document.profile.lastName" placeholder="Doe" @input="updateProfile('lastName', inputValue($event))"></label>
      </div>
      <label class="field"><span class="field-label">Email</span><input class="input" type="email" :value="document.profile.email" placeholder="john.doe@example.com" @input="updateProfile('email', inputValue($event))"></label>
      <label class="field"><span class="field-label">Phone Number</span><input class="input" :value="document.profile.phone" placeholder="(123) 456-7890" @input="updateProfile('phone', inputValue($event))"></label>
      <label class="field"><span class="field-label">Location</span><input class="input" :value="document.profile.location" placeholder="City, State / Country" @input="updateProfile('location', inputValue($event))"></label>
    </section>
    <section class="editor-block">
      <div class="block-heading"><strong>Links</strong><small>Optional</small></div>
      <p class="field-helper">Optional - add a link if it strengthens your application (e.g. LinkedIn for any role, GitHub for engineering).</p>
      <button class="ghost-row" type="button" @click="addProfileLink">+ Add link</button>
      <div v-for="link in document.profile.links" :key="link.id" class="field-grid two">
        <input class="input" :value="link.label" placeholder="Label" @input="updateProfileLink(link.id, 'label', inputValue($event))">
        <input class="input" :value="link.url" placeholder="https://..." @input="updateProfileLink(link.id, 'url', inputValue($event))">
      </div>
    </section>
    <section class="editor-block">
      <div class="block-heading"><strong>Professional summary</strong><small>2-4 sentences</small></div>
      <textarea class="textarea" :value="document.profile.summary" placeholder="Write a short, focused summary of your experience and what you're looking for..." @input="updateProfile('summary', inputValue($event))" />
      <button class="btn btn-secondary btn-sm" type="button"><Wand2 :size="14" /> Generate</button>
    </section>
  </div>

  <div v-else-if="activeSection === 'work'" class="drill-panel">
    <template v-if="!activeExperience">
      <header class="drill-header">
        <button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection">
          <span>&lt;</span>
        </button>
        <h2>Work Experience</h2>
        <button class="btn btn-secondary btn-sm" type="button" @click="addExperience"><Plus :size="14" /> Add Experience</button>
      </header>
      <div v-if="document.workExperiences.length" class="entry-list">
        <article v-for="entry in document.workExperiences" :key="entry.id" class="entry-card-wrap">
          <div class="entry-card" role="button" tabindex="0" @click="openExperience(entry.id)" @keydown.enter.prevent="openExperience(entry.id)" @keydown.space.prevent="openExperience(entry.id)">
            <div>
              <strong>{{ entry.jobTitle || 'New experience' }}</strong>
              <small>{{ [entry.employer, formatDateRange(entry.startDate, entry.endDate, entry.current)].filter(Boolean).join(' · ') || 'Adding a new role' }}</small>
            </div>
            <span>{{ entry.bullets.length }}/{{ Math.max(entry.bullets.length, 2) }} with numbers</span>
            <button class="section-menu-trigger" type="button" aria-label="Entry actions" @click.stop="menuOpenFor = menuOpenFor === `experience-${entry.id}` ? '' : `experience-${entry.id}`"><MoreHorizontal :size="15" /></button>
          </div>
          <div v-if="menuOpenFor === `experience-${entry.id}`" class="section-menu">
            <button type="button" @click="openExperience(entry.id)">Edit entry</button>
            <button type="button" @click="removeExperience(entry.id)">Remove entry</button>
          </div>
        </article>
      </div>
      <div v-else class="empty-editor-state">
        <BriefcaseBusiness :size="28" />
        <strong>No work experience yet</strong>
        <p>Add your first role to start scoring this section. Internships, freelance, and open-source count.</p>
        <button class="btn btn-secondary" type="button" @click="addExperience"><Plus :size="15" /> Add Experience</button>
      </div>
    </template>
    <template v-else>
      <header class="drill-header">
        <button class="icon-btn" type="button" aria-label="Back to entries" @click="activeExperienceId = ''">
          <span>&lt;</span>
        </button>
        <div class="drill-title-group"><h2>{{ activeExperience.jobTitle || 'New experience' }}</h2><small>{{ activeExperience.employer ? `Editing · ${activeExperience.employer}` : 'Adding a new role' }}</small></div>
      </header>
      <section class="editor-block">
        <label class="field"><span class="field-label">Job Title</span><input class="input" :value="activeExperience.jobTitle" placeholder="Software Developer" @input="updateExperience(activeExperience.id, 'jobTitle', inputValue($event))"></label>
        <label class="field"><span class="field-label">Employer</span><input class="input" :value="activeExperience.employer" placeholder="ABC Corp" @input="updateExperience(activeExperience.id, 'employer', inputValue($event))"></label>
        <label class="field"><span class="field-label">Location</span><input class="input" :value="activeExperience.location" placeholder="New York, NY" @input="updateExperience(activeExperience.id, 'location', inputValue($event))"></label>
        <div class="field-grid two">
          <label class="field"><span class="field-label">Start Date</span><input class="input" :value="activeExperience.startDate" placeholder="MM/YYYY" @input="updateExperience(activeExperience.id, 'startDate', inputValue($event))"></label>
          <label class="field"><span class="field-label">End Date</span><input class="input" :value="activeExperience.endDate" placeholder="MM/YYYY" :disabled="activeExperience.current" @input="updateExperience(activeExperience.id, 'endDate', inputValue($event))"></label>
        </div>
        <label class="toggle-row"><input type="checkbox" :checked="activeExperience.current" @change="updateExperience(activeExperience.id, 'current', checkedValue($event))"> Currently working here</label>
        <label class="toggle-row"><input type="checkbox" :checked="activeExperience.hideDates" @change="updateExperience(activeExperience.id, 'hideDates', checkedValue($event))"> Hide dates for this role</label>
        <button class="btn btn-ghost btn-sm" type="button" @click="changeTab('design')">Change Date Format</button>
        <div class="achievements-head"><div><h3>Achievements</h3><p>Lead with an action verb; include a number when you can.</p></div><span>{{ activeExperience.bullets.length }} bullets</span></div>
        <p v-if="!activeExperience.bullets.length" class="muted-copy">No bullets yet. Add one manually or let AI suggest a starter set.</p>
        <div v-for="(bullet, index) in activeExperience.bullets" :key="bullet.id" class="bullet-editor-row">
          <span>{{ index + 1 }}</span>
          <textarea class="textarea" :value="bullet.text" placeholder="Describe your achievement - quantify the impact when you can" @input="updateExperienceBullet(activeExperience.id, bullet.id, inputValue($event))" />
          <button class="mini-ai" type="button" title="Improve achievement with AI"><Sparkles :size="13" /></button>
        </div>
        <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" @click="addExperienceBullet(activeExperience.id)"><Plus :size="14" /> Add Achievement</button><button class="btn btn-secondary btn-sm" type="button" :disabled="!activeExperience.jobTitle && !activeExperience.employer"><Sparkles :size="14" /> AI Suggestions</button></div>
      </section>
    </template>
  </div>

  <div v-else-if="activeSection === 'education'" class="drill-panel">
    <template v-if="!activeEducation">
      <header class="drill-header">
        <button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection"><span>&lt;</span></button>
        <h2>Education</h2>
        <button class="btn btn-secondary btn-sm" type="button" @click="addEducation"><Plus :size="14" /> Add Education</button>
      </header>
      <div v-if="document.educations.length" class="entry-list">
        <article v-for="entry in document.educations" :key="entry.id" class="entry-card-wrap">
          <div class="entry-card" role="button" tabindex="0" @click="openEducation(entry.id)" @keydown.enter.prevent="openEducation(entry.id)" @keydown.space.prevent="openEducation(entry.id)">
            <div><strong>{{ entry.school || 'New education' }}</strong><small>{{ [entry.degree, entry.location].filter(Boolean).join(' · ') || 'Add bullets to score this entry' }}</small></div>
            <span>{{ entry.details.length ? `${entry.details.length} bullets` : 'Add bullets' }}</span>
            <button class="section-menu-trigger" type="button" aria-label="Entry actions" @click.stop="menuOpenFor = menuOpenFor === `education-${entry.id}` ? '' : `education-${entry.id}`"><MoreHorizontal :size="15" /></button>
          </div>
          <div v-if="menuOpenFor === `education-${entry.id}`" class="section-menu"><button type="button" @click="openEducation(entry.id)">Edit entry</button><button type="button" @click="removeEducation(entry.id)">Remove entry</button></div>
        </article>
      </div>
      <div v-else class="empty-editor-state"><GraduationCap :size="28" /><strong>No education yet</strong><p>Add schools, bootcamps, programs, or coursework that support your target role.</p><button class="btn btn-secondary" type="button" @click="addEducation"><Plus :size="15" /> Add Education</button></div>
    </template>
    <template v-else>
      <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to entries" @click="activeEducationId = ''"><span>&lt;</span></button><div class="drill-title-group"><h2>{{ activeEducation.school || 'New education' }}</h2><small>{{ activeEducation.school ? 'Editing education' : 'Adding a new entry' }}</small></div></header>
      <section class="editor-block">
        <label class="field"><span class="field-label">Institution</span><input class="input" :value="activeEducation.school" placeholder="Harvard University" @input="updateEducation(activeEducation.id, 'school', inputValue($event))"></label>
        <label class="field"><span class="field-label">Location</span><input class="input" :value="activeEducation.location" placeholder="New York, NY" @input="updateEducation(activeEducation.id, 'location', inputValue($event))"></label>
        <label class="field"><span class="field-label">Degree</span><input class="input" :value="activeEducation.degree" placeholder="BS" @input="updateEducation(activeEducation.id, 'degree', inputValue($event))"></label>
        <div class="field-grid two"><label class="field"><span class="field-label">Start Date</span><input class="input" :value="activeEducation.startDate" placeholder="MM/YYYY" @input="updateEducation(activeEducation.id, 'startDate', inputValue($event))"></label><label class="field"><span class="field-label">Graduation Date</span><input class="input" :value="activeEducation.endDate" placeholder="MM/YYYY" @input="updateEducation(activeEducation.id, 'endDate', inputValue($event))"></label></div>
        <button class="btn btn-ghost btn-sm" type="button" @click="changeTab('design')">Change Date Format</button>
        <div class="achievements-head"><div><h3>Achievements</h3><p>Lead with an action verb; include a number when you can.</p></div><span>{{ activeEducation.details.length }} bullets</span></div>
        <p v-if="!activeEducation.details.length" class="muted-copy">No bullets yet. Add one manually or let AI suggest a starter set.</p>
        <div v-for="(bullet, index) in activeEducation.details" :key="bullet.id" class="bullet-editor-row"><span>{{ index + 1 }}</span><textarea class="textarea" :value="bullet.text" placeholder="Describe your education detail - quantify the impact when you can" @input="updateEducationBullet(activeEducation.id, bullet.id, inputValue($event))" /><button class="mini-ai" type="button" title="Improve achievement with AI"><Sparkles :size="13" /></button></div>
        <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" @click="addEducationBullet(activeEducation.id)"><Plus :size="14" /> Add Achievement</button><button class="btn btn-secondary btn-sm" type="button" :disabled="!activeEducation.school"><Sparkles :size="14" /> AI Suggestions</button></div>
      </section>
    </template>
  </div>

  <div v-else-if="activeSection === 'skills'" class="drill-panel">
    <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection"><span>&lt;</span></button><h2>Skills</h2><button class="btn btn-secondary btn-sm" type="button" @click="activeSection = 'profile'"><Sparkles :size="14" /> Add target role -></button></header>
    <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" :disabled="!document.profile.targetRole"><Sparkles :size="14" /> AI Suggestions</button></div>
    <section v-for="group in document.skills" :key="group.id" class="editor-block skill-group-card">
      <div class="block-heading"><strong>{{ group.title || 'Skills & Tools' }}</strong><button class="section-menu-trigger" type="button" aria-label="Category actions" @click="menuOpenFor = menuOpenFor === `skills-${group.id}` ? '' : `skills-${group.id}`"><MoreHorizontal :size="15" /></button></div>
      <div v-if="menuOpenFor === `skills-${group.id}`" class="section-menu inline-menu"><button type="button" @click="removeSkillGroup(group.id)">Remove category</button></div>
      <label class="field"><span class="field-label">Category name</span><input class="input" :value="group.title" placeholder="Skills & Tools" @input="updateSkillGroup(group.id, 'title', inputValue($event))"></label>
      <div class="skill-chip-grid">
        <button v-for="(skill, index) in group.skills" :key="`${group.id}-${skill}-${index}`" class="skill-chip" type="button" :aria-label="`Remove ${skill}`" @click="removeSkill(group.id, index)">{{ skill }}<span aria-hidden="true">×</span></button>
        <input class="skill-add-input" :value="newSkillText[group.id] || ''" placeholder="Add skill" @input="newSkillText = { ...newSkillText, [group.id]: inputValue($event) }" @keydown.enter.prevent="addSkill(group.id)">
      </div>
    </section>
    <div v-if="addingSkillCategory" class="add-section-inline"><input v-model.trim="newSkillCategoryName" class="input" placeholder="Add category name (optional)" @keydown.enter="confirmAddSkillCategory" @keydown.escape="addingSkillCategory = false"></div>
    <button v-else class="add-section-button" type="button" @click="addingSkillCategory = true"><Plus :size="15" /> Add Skill Category</button>
  </div>

  <div v-else-if="activeSection === 'projects'" class="drill-panel">
    <template v-if="!activeProject">
      <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection"><span>&lt;</span></button><h2>Projects</h2><button class="btn btn-secondary btn-sm" type="button" @click="addProject"><Plus :size="14" /> Add Project</button></header>
      <div v-if="document.projects.length" class="entry-list">
        <article v-for="entry in document.projects" :key="entry.id" class="entry-card-wrap">
          <div class="entry-card" role="button" tabindex="0" @click="openProject(entry.id)" @keydown.enter.prevent="openProject(entry.id)" @keydown.space.prevent="openProject(entry.id)">
            <div><strong>{{ entry.name || 'New project' }}</strong><small>{{ entry.url || entry.role || 'Adding a new project' }}</small></div>
            <span>{{ entry.bullets.length }}/{{ Math.max(entry.bullets.length, 2) }} with numbers</span>
            <button class="section-menu-trigger" type="button" aria-label="Entry actions" @click.stop="menuOpenFor = menuOpenFor === `project-${entry.id}` ? '' : `project-${entry.id}`"><MoreHorizontal :size="15" /></button>
          </div>
          <div v-if="menuOpenFor === `project-${entry.id}`" class="section-menu"><button type="button" @click="openProject(entry.id)">Edit entry</button><button type="button" @click="removeProject(entry.id)">Remove entry</button></div>
        </article>
      </div>
      <div v-else class="empty-editor-state"><FileText :size="28" /><strong>No projects yet</strong><p>Add selected projects, launches, case studies, or portfolio work that prove your experience.</p><button class="btn btn-secondary" type="button" @click="addProject"><Plus :size="15" /> Add Project</button></div>
    </template>
    <template v-else>
      <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to entries" @click="activeProjectId = ''"><span>&lt;</span></button><div class="drill-title-group"><h2>{{ activeProject.name || 'New project' }}</h2><small>{{ activeProject.url ? `Editing · ${activeProject.url}` : 'Adding a new project' }}</small></div></header>
      <section class="editor-block">
        <label class="field"><span class="field-label">Title</span><input class="input" :value="activeProject.name" placeholder="Project Title" @input="updateProject(activeProject.id, 'name', inputValue($event))"></label>
        <label class="field"><span class="field-label">Link</span><input class="input" :value="activeProject.url" placeholder="Project Link" @input="updateProject(activeProject.id, 'url', inputValue($event))"></label>
        <label class="field"><span class="field-label">Description</span><input class="input" :value="activeProject.role" placeholder="Project Description" @input="updateProject(activeProject.id, 'role', inputValue($event))"></label>
        <div class="field-grid two"><label class="field"><span class="field-label">Release Date</span><input class="input" :value="activeProject.startDate" placeholder="MM/YYYY" @input="updateProject(activeProject.id, 'startDate', inputValue($event))"></label><label class="field"><span class="field-label">End Date</span><input class="input" :value="activeProject.endDate" placeholder="MM/YYYY" @input="updateProject(activeProject.id, 'endDate', inputValue($event))"></label></div>
        <button class="btn btn-ghost btn-sm" type="button" @click="changeTab('design')">Change Date Format</button>
        <div class="achievements-head"><div><h3>Achievements</h3><p>Lead with an action verb; include a number when you can.</p></div><span>{{ activeProject.bullets.length }} bullets</span></div>
        <p v-if="!activeProject.bullets.length" class="muted-copy">No bullets yet. Add one manually or let AI suggest a starter set.</p>
        <div v-for="(bullet, index) in activeProject.bullets" :key="bullet.id" class="bullet-editor-row"><span>{{ index + 1 }}</span><textarea class="textarea" :value="bullet.text" placeholder="Describe your achievement - quantify the impact when you can" @input="updateProjectBullet(activeProject.id, bullet.id, inputValue($event))" /><button class="mini-ai" type="button" title="Improve achievement with AI"><Sparkles :size="13" /></button></div>
        <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" @click="addProjectBullet(activeProject.id)"><Plus :size="14" /> Add Achievement</button><button class="btn btn-secondary btn-sm" type="button" :disabled="!activeProject.name"><Sparkles :size="14" /> AI Suggestions</button></div>
      </section>
    </template>
  </div>

  <div v-else-if="isSimpleSection(activeSection)" class="drill-panel">
    <template v-if="!activeSimpleEntry">
      <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to all sections" @click="resetActiveSection"><span>&lt;</span></button><h2>{{ simpleSectionMeta(activeSection).title }}</h2><button class="btn btn-secondary btn-sm" type="button" @click="addGenericEntry"><Plus :size="14" /> {{ simpleSectionMeta(activeSection).addLabel }}</button></header>
      <div v-if="simpleSectionEntries(activeSection).length" class="entry-list">
        <article v-for="entry in simpleSectionEntries(activeSection)" :key="entry.id" class="entry-card-wrap">
          <div class="entry-card" role="button" tabindex="0" @click="openSimpleEntry(entry.id)" @keydown.enter.prevent="openSimpleEntry(entry.id)" @keydown.space.prevent="openSimpleEntry(entry.id)">
            <div><strong>{{ entry.title || simpleSectionMeta(activeSection).newTitle }}</strong><small>{{ [entry.subtitle, entry.date].filter(Boolean).join(' · ') || 'Add details to complete this entry' }}</small></div>
            <span>{{ entry.bullets.length ? `${entry.bullets.length} bullets` : 'Description' }}</span>
            <button class="section-menu-trigger" type="button" aria-label="Entry actions" @click.stop="menuOpenFor = menuOpenFor === `simple-${entry.id}` ? '' : `simple-${entry.id}`"><MoreHorizontal :size="15" /></button>
          </div>
          <div v-if="menuOpenFor === `simple-${entry.id}`" class="section-menu"><button type="button" @click="openSimpleEntry(entry.id)">Edit entry</button><button type="button" @click="removeSimpleEntry(entry.id)">Remove entry</button></div>
        </article>
      </div>
      <div v-else class="empty-editor-state"><component :is="sectionIcons[String(activeSection)] || FileText" :size="28" /><strong>{{ simpleSectionMeta(activeSection).emptyTitle }}</strong><p>{{ simpleSectionMeta(activeSection).emptyDescription }}</p><button class="btn btn-secondary" type="button" @click="addGenericEntry"><Plus :size="15" /> {{ simpleSectionMeta(activeSection).addLabel }}</button></div>
    </template>
    <template v-else>
      <header class="drill-header"><button class="icon-btn" type="button" aria-label="Back to entries" @click="activeSimpleEntryId = ''"><span>&lt;</span></button><div class="drill-title-group"><h2>{{ activeSimpleEntry.title || simpleSectionMeta(activeSection).newTitle }}</h2><small>{{ activeSimpleEntry.title ? `Editing · ${simpleSectionMeta(activeSection).title}` : simpleSectionMeta(activeSection).newSubtitle }}</small></div></header>
      <section class="editor-block">
        <label class="field"><span class="field-label">{{ simpleSectionMeta(activeSection).titleLabel }}</span><input class="input" :value="activeSimpleEntry.title" :placeholder="simpleSectionMeta(activeSection).titlePlaceholder" @input="updateSimpleEntry(activeSimpleEntry.id, 'title', inputValue($event))"></label>
        <label class="field"><span class="field-label">{{ simpleSectionMeta(activeSection).subtitleLabel }}</span><input class="input" :value="activeSimpleEntry.subtitle" :placeholder="simpleSectionMeta(activeSection).subtitlePlaceholder" @input="updateSimpleEntry(activeSimpleEntry.id, 'subtitle', inputValue($event))"></label>
        <label v-if="simpleSectionMeta(activeSection).showLocation" class="field"><span class="field-label">Location</span><input class="input" :value="activeSimpleEntry.location" placeholder="New York, NY" @input="updateSimpleEntry(activeSimpleEntry.id, 'location', inputValue($event))"></label>
        <label class="field"><span class="field-label">{{ simpleSectionMeta(activeSection).dateLabel }}</span><input class="input" :value="activeSimpleEntry.date" placeholder="MM/YYYY" @input="updateSimpleEntry(activeSimpleEntry.id, 'date', inputValue($event))"></label>
        <button class="btn btn-ghost btn-sm" type="button" @click="changeTab('design')">Change Date Format</button>
        <div class="achievements-head"><div><h3>{{ simpleSectionMeta(activeSection).detailHeading }}</h3><p>{{ simpleSectionMeta(activeSection).detailHint }}</p></div><span>{{ activeSimpleEntry.bullets.length }} bullets</span></div>
        <p v-if="!activeSimpleEntry.bullets.length" class="muted-copy">No details yet. Add one manually or let AI suggest a starter set.</p>
        <div v-for="(bullet, index) in activeSimpleEntry.bullets" :key="bullet.id" class="bullet-editor-row"><span>{{ index + 1 }}</span><textarea class="textarea" :value="bullet.text" :placeholder="simpleSectionMeta(activeSection).detailPlaceholder" @input="updateSimpleBullet(activeSimpleEntry.id, bullet.id, inputValue($event))" /><button class="mini-ai" type="button" title="Improve detail with AI"><Sparkles :size="13" /></button></div>
        <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" @click="addSimpleBullet(activeSimpleEntry.id)"><Plus :size="14" /> Add {{ simpleSectionMeta(activeSection).detailNoun }}</button><button class="btn btn-secondary btn-sm" type="button" :disabled="!activeSimpleEntry.title"><Sparkles :size="14" /> AI Suggestions</button></div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type {
  EditableResumeDocument,
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeExperienceLevel,
  ResumeProfileSection,
  ResumeProjectEntry,
  ResumeSimpleEntry,
} from '@/types'
import {
  BookOpen,
  BriefcaseBusiness,
  FileText,
  GripVertical,
  GraduationCap,
  HeartHandshake,
  Medal,
  MoreHorizontal,
  Plus,
  ScrollText,
  Sparkles,
  Trophy,
  UserRound,
  Wand2,
} from 'lucide-vue-next'
import {
  createBuilderId,
  createEmptyBullet,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
  createEmptySimpleEntry,
} from '@/lib/resume/builder'

const props = defineProps<{
  document: EditableResumeDocument
  requestedSection?: string
}>()

const emit = defineEmits<{
  'save-document': [document: EditableResumeDocument]
  'change-tab': [tab: 'content' | 'design' | 'analysis']
}>()

const document = computed(() => props.document)
const activeSection = ref('')
const activeExperienceId = ref('')
const activeEducationId = ref('')
const activeProjectId = ref('')
const activeSimpleEntryId = ref('')
const menuOpenFor = ref('')
const draggedSectionId = ref('')
const addingSection = ref(false)
const newSectionName = ref('')
const addingSkillCategory = ref(false)
const newSkillCategoryName = ref('')
const newSkillText = ref<Record<string, string>>({})
const experienceLevels: Array<{ value: ResumeExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]
const sectionIcons: Record<string, Component> = {
  profile: UserRound,
  work: BriefcaseBusiness,
  education: GraduationCap,
  skills: Sparkles,
  projects: FileText,
  volunteer: HeartHandshake,
  certifications: Medal,
  publications: ScrollText,
  awards: Trophy,
  custom: BookOpen,
}
const activeExperience = computed(() => document.value.workExperiences.find(entry => entry.id === activeExperienceId.value))
const activeEducation = computed(() => document.value.educations.find(entry => entry.id === activeEducationId.value))
const activeProject = computed(() => document.value.projects.find(entry => entry.id === activeProjectId.value))
const activeSimpleEntry = computed(() => simpleSectionEntries(activeSection.value).find(entry => entry.id === activeSimpleEntryId.value))
const sectionRows = computed(() => {
  const baseRows = document.value.sectionSettings
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order)
    .map(section => ({ id: section.key, key: section.key, title: section.title, optional: section.optional }))
  const customRows = document.value.customSections.map(section => ({ id: section.id, key: section.id, title: section.title, optional: true }))
  return [...baseRows, ...customRows].map((section) => {
    const status = sectionStatus(section.key, section.optional)
    return {
      ...section,
      icon: sectionIcons[section.key] || BookOpen,
      status,
      statusTone: status.includes('Needs') ? 'status-warn' : status.includes('Optional') ? 'status-muted' : 'status-good',
      ai: ['profile', 'work', 'education', 'skills'].includes(section.key),
      actions: section.key !== 'profile',
    }
  })
})

watch(() => props.requestedSection, (section) => {
  if (section) openSection(section)
}, { immediate: true })

const inputValue = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
const checkedValue = (event: Event) => (event.target as HTMLInputElement).checked
const saveDocument = (nextDocument: EditableResumeDocument) => emit('save-document', nextDocument)
const changeTab = (tab: 'content' | 'design' | 'analysis') => emit('change-tab', tab)
const sectionStatus = (key: string, optional = false) => {
  if (key === 'profile') return document.value.profile.firstName || document.value.profile.summary ? '1 info' : 'Needs entries'
  if (key === 'work') return document.value.workExperiences.length ? `${document.value.workExperiences.length} role${document.value.workExperiences.length === 1 ? '' : 's'}` : 'Needs entries'
  if (key === 'education') return document.value.educations.length ? `${document.value.educations.length} school${document.value.educations.length === 1 ? '' : 's'}` : 'Needs entries'
  if (key === 'skills') return document.value.skills.length ? `${document.value.skills.length} group${document.value.skills.length === 1 ? '' : 's'}` : 'Needs entries'
  const counts: Record<string, number> = {
    projects: document.value.projects.length,
    volunteer: document.value.volunteerExperiences.length,
    certifications: document.value.certifications.length,
    publications: document.value.publications.length,
    awards: document.value.awards.length,
  }
  const customCount = document.value.customSections.find(section => section.id === key)?.entries.length || 0
  const count = counts[key] || customCount
  return count ? `${count} ${count === 1 ? 'entry' : 'entries'}` : optional ? 'Optional · empty' : 'Needs entries'
}
const openSection = (key: string) => {
  activeSection.value = key
  menuOpenFor.value = ''
  activeExperienceId.value = ''
  activeEducationId.value = ''
  activeProjectId.value = ''
  activeSimpleEntryId.value = ''
}
const resetActiveSection = () => {
  activeSection.value = ''
  activeExperienceId.value = ''
  activeEducationId.value = ''
  activeProjectId.value = ''
  activeSimpleEntryId.value = ''
  menuOpenFor.value = ''
}
const updateProfile = <Key extends keyof ResumeProfileSection>(key: Key, value: ResumeProfileSection[Key]) => {
  saveDocument({ ...document.value, profile: { ...document.value.profile, [key]: value } })
}
const addProfileLink = () => {
  saveDocument({
    ...document.value,
    profile: {
      ...document.value.profile,
      links: [...document.value.profile.links, { id: `link-${Date.now()}`, label: '', url: '' }],
    },
  })
}
const updateProfileLink = (id: string, key: 'label' | 'url', value: string) => {
  saveDocument({
    ...document.value,
    profile: {
      ...document.value.profile,
      links: document.value.profile.links.map(link => link.id === id ? { ...link, [key]: value } : link),
    },
  })
}
const addExperience = () => {
  const entry = createEmptyExperience()
  activeExperienceId.value = entry.id
  saveDocument({ ...document.value, workExperiences: [...document.value.workExperiences, entry] })
}
const openExperience = (id: string) => {
  activeExperienceId.value = id
  menuOpenFor.value = ''
}
const removeExperience = (id: string) => {
  if (activeExperienceId.value === id) activeExperienceId.value = ''
  saveDocument({ ...document.value, workExperiences: document.value.workExperiences.filter(entry => entry.id !== id) })
  menuOpenFor.value = ''
}
const updateExperience = <Key extends keyof ResumeExperienceEntry>(id: string, key: Key, value: ResumeExperienceEntry[Key]) => {
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === id ? { ...entry, [key]: value } : entry),
  })
}
const addExperienceBullet = (id: string) => {
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === id ? { ...entry, bullets: [...entry.bullets, createEmptyBullet()] } : entry),
  })
}
const updateExperienceBullet = (entryId: string, bulletId: string, text: string) => {
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === entryId
      ? { ...entry, bullets: entry.bullets.map(bullet => bullet.id === bulletId ? { ...bullet, text } : bullet) }
      : entry),
  })
}
const addEducation = () => {
  const entry = createEmptyEducation()
  activeEducationId.value = entry.id
  saveDocument({ ...document.value, educations: [...document.value.educations, entry] })
}
const openEducation = (id: string) => {
  activeEducationId.value = id
  menuOpenFor.value = ''
}
const removeEducation = (id: string) => {
  if (activeEducationId.value === id) activeEducationId.value = ''
  saveDocument({ ...document.value, educations: document.value.educations.filter(entry => entry.id !== id) })
  menuOpenFor.value = ''
}
const updateEducation = <Key extends keyof ResumeEducationEntry>(id: string, key: Key, value: ResumeEducationEntry[Key]) => {
  saveDocument({
    ...document.value,
    educations: document.value.educations.map(entry => entry.id === id ? { ...entry, [key]: value } : entry),
  })
}
const addEducationBullet = (id: string) => {
  saveDocument({
    ...document.value,
    educations: document.value.educations.map(entry => entry.id === id ? { ...entry, details: [...entry.details, createEmptyBullet()] } : entry),
  })
}
const updateEducationBullet = (entryId: string, bulletId: string, text: string) => {
  saveDocument({
    ...document.value,
    educations: document.value.educations.map(entry => entry.id === entryId
      ? { ...entry, details: entry.details.map(bullet => bullet.id === bulletId ? { ...bullet, text } : bullet) }
      : entry),
  })
}
const updateSkillGroup = (id: string, key: 'title', value: string) => {
  saveDocument({
    ...document.value,
    skills: document.value.skills.map(group => group.id === id ? { ...group, [key]: value } : group),
  })
}
const addSkill = (groupId: string) => {
  const skill = newSkillText.value[groupId]?.trim()
  if (!skill) return
  saveDocument({
    ...document.value,
    skills: document.value.skills.map(group => group.id === groupId ? { ...group, skills: [...group.skills, skill] } : group),
  })
  newSkillText.value = { ...newSkillText.value, [groupId]: '' }
}
const removeSkill = (groupId: string, index: number) => {
  saveDocument({
    ...document.value,
    skills: document.value.skills.map(group => group.id === groupId ? { ...group, skills: group.skills.filter((_, skillIndex) => skillIndex !== index) } : group),
  })
}
const removeSkillGroup = (id: string) => {
  saveDocument({ ...document.value, skills: document.value.skills.filter(group => group.id !== id) })
  menuOpenFor.value = ''
}
const confirmAddSkillCategory = () => {
  const id = createBuilderId('skills')
  saveDocument({
    ...document.value,
    skills: [...document.value.skills, { id, title: newSkillCategoryName.value.trim() || 'Skills & Tools', skills: [] }],
  })
  newSkillCategoryName.value = ''
  addingSkillCategory.value = false
}
const addProject = () => {
  const entry = createEmptyProject()
  activeProjectId.value = entry.id
  saveDocument({ ...document.value, projects: [...document.value.projects, entry] })
}
const openProject = (id: string) => {
  activeProjectId.value = id
  menuOpenFor.value = ''
}
const removeProject = (id: string) => {
  if (activeProjectId.value === id) activeProjectId.value = ''
  saveDocument({ ...document.value, projects: document.value.projects.filter(entry => entry.id !== id) })
  menuOpenFor.value = ''
}
const updateProject = <Key extends keyof ResumeProjectEntry>(id: string, key: Key, value: ResumeProjectEntry[Key]) => {
  saveDocument({
    ...document.value,
    projects: document.value.projects.map(entry => entry.id === id ? { ...entry, [key]: value } : entry),
  })
}
const addProjectBullet = (id: string) => {
  saveDocument({
    ...document.value,
    projects: document.value.projects.map(entry => entry.id === id ? { ...entry, bullets: [...entry.bullets, createEmptyBullet()] } : entry),
  })
}
const updateProjectBullet = (entryId: string, bulletId: string, text: string) => {
  saveDocument({
    ...document.value,
    projects: document.value.projects.map(entry => entry.id === entryId
      ? { ...entry, bullets: entry.bullets.map(bullet => bullet.id === bulletId ? { ...bullet, text } : bullet) }
      : entry),
  })
}
const startRename = (id: string, key: string) => {
  const name = window.prompt('Section name')
  if (!name?.trim()) return
  if (document.value.customSections.some(section => section.id === id)) {
    saveDocument({ ...document.value, customSections: document.value.customSections.map(section => section.id === id ? { ...section, title: name.trim() } : section) })
    return
  }
  saveDocument({ ...document.value, sectionSettings: document.value.sectionSettings.map(section => section.key === key ? { ...section, title: name.trim() } : section) })
  menuOpenFor.value = ''
}
const hideSection = (id: string, key: string) => {
  if (document.value.customSections.some(section => section.id === id)) {
    saveDocument({ ...document.value, customSections: document.value.customSections.filter(section => section.id !== id) })
    return
  }
  saveDocument({ ...document.value, sectionSettings: document.value.sectionSettings.map(section => section.key === key ? { ...section, visible: false } : section) })
  menuOpenFor.value = ''
}
const reorderValues = <Item extends { id?: string; key?: string; order?: number }>(items: Item[], activeId: string, targetId: string): Item[] => {
  const next = [...items]
  const from = next.findIndex(item => (item.id || item.key) === activeId)
  const to = next.findIndex(item => (item.id || item.key) === targetId)
  if (from < 0 || to < 0 || from === to) return items
  const [moved] = next.splice(from, 1)
  if (!moved) return items
  next.splice(to, 0, moved)
  return next.map((item, index) => 'order' in item ? { ...item, order: index } : item)
}
const moveSection = (id: string, direction: -1 | 1) => {
  const customIndex = document.value.customSections.findIndex(section => section.id === id)
  if (customIndex >= 0) {
    const target = document.value.customSections[customIndex + direction]
    if (!target) return
    saveDocument({ ...document.value, customSections: reorderValues(document.value.customSections, id, target.id) })
    menuOpenFor.value = ''
    return
  }
  const ordered = [...document.value.sectionSettings].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex(section => section.key === id)
  const target = ordered[index + direction]
  if (!target) return
  saveDocument({ ...document.value, sectionSettings: reorderValues(ordered, id, target.key) })
  menuOpenFor.value = ''
}
const dropSection = (targetId: string) => {
  const activeId = draggedSectionId.value
  draggedSectionId.value = ''
  if (!activeId || activeId === targetId) return
  const activeCustom = document.value.customSections.some(section => section.id === activeId)
  const targetCustom = document.value.customSections.some(section => section.id === targetId)
  if (activeCustom && targetCustom) {
    saveDocument({ ...document.value, customSections: reorderValues(document.value.customSections, activeId, targetId) })
    return
  }
  if (!activeCustom && !targetCustom) {
    const ordered = [...document.value.sectionSettings].sort((a, b) => a.order - b.order)
    saveDocument({ ...document.value, sectionSettings: reorderValues(ordered, activeId, targetId) })
  }
}
const confirmAddSection = () => {
  if (!newSectionName.value.trim()) return
  saveDocument({
    ...document.value,
    customSections: [...document.value.customSections, { id: `custom-${Date.now()}`, title: newSectionName.value.trim(), entries: [] }],
  })
  newSectionName.value = ''
  addingSection.value = false
}
const simpleSectionMeta = (key: string) => {
  const customTitle = document.value.customSections.find(section => section.id === key)?.title || 'Custom Section'
  const meta: Record<string, {
    title: string
    addLabel: string
    newTitle: string
    newSubtitle: string
    emptyTitle: string
    emptyDescription: string
    titleLabel: string
    titlePlaceholder: string
    subtitleLabel: string
    subtitlePlaceholder: string
    dateLabel: string
    detailHeading: string
    detailHint: string
    detailPlaceholder: string
    detailNoun: string
    showLocation: boolean
  }> = {
    volunteer: {
      title: 'Volunteer Experience',
      addLabel: 'Add Volunteer Experience',
      newTitle: 'New volunteer role',
      newSubtitle: 'Adding a new role',
      emptyTitle: 'No volunteer experience yet',
      emptyDescription: 'Community work, mentoring, or pro-bono contributions.',
      titleLabel: 'Position',
      titlePlaceholder: 'Software Engineer',
      subtitleLabel: 'Organization',
      subtitlePlaceholder: 'ABC Corp',
      dateLabel: 'Start Date',
      detailHeading: 'Achievements',
      detailHint: 'Lead with an action verb; include a number when you can.',
      detailPlaceholder: 'Describe your achievement - quantify the impact when you can',
      detailNoun: 'Achievement',
      showLocation: true,
    },
    certifications: {
      title: 'Certifications',
      addLabel: 'Add Certification',
      newTitle: 'New certification',
      newSubtitle: 'Adding a new certification',
      emptyTitle: 'No certifications yet',
      emptyDescription: "Add a certification you've earned - courses, professional badges, security clearances.",
      titleLabel: 'Certification Name',
      titlePlaceholder: 'i.e. CPR Certification',
      subtitleLabel: 'Organization',
      subtitlePlaceholder: 'i.e. American Heart Association',
      dateLabel: 'Issue Date',
      detailHeading: 'Description',
      detailHint: 'Add short context if this credential needs explanation.',
      detailPlaceholder: 'Description...',
      detailNoun: 'Description',
      showLocation: false,
    },
    publications: {
      title: 'Publications',
      addLabel: 'Add Publication',
      newTitle: 'New publication',
      newSubtitle: 'Adding a new publication',
      emptyTitle: 'No publications yet',
      emptyDescription: 'Papers, articles, talks - anything published under your name.',
      titleLabel: 'Publication Title',
      titlePlaceholder: 'Publication Title...',
      subtitleLabel: 'Description',
      subtitlePlaceholder: 'Description...',
      dateLabel: 'Publication Date',
      detailHeading: 'Details',
      detailHint: 'Add a short note if the publication needs more context.',
      detailPlaceholder: 'Description...',
      detailNoun: 'Detail',
      showLocation: false,
    },
    awards: {
      title: 'Awards',
      addLabel: 'Add Award',
      newTitle: 'New award',
      newSubtitle: 'Adding a new award',
      emptyTitle: 'No awards yet',
      emptyDescription: 'Honors, recognitions, scholarships - anything granted to you.',
      titleLabel: 'Award Title',
      titlePlaceholder: 'Award Title...',
      subtitleLabel: 'Description',
      subtitlePlaceholder: 'Description...',
      dateLabel: 'Award Date',
      detailHeading: 'Details',
      detailHint: 'Add a short note if the award needs more context.',
      detailPlaceholder: 'Description...',
      detailNoun: 'Detail',
      showLocation: false,
    },
  }
  return meta[key] || {
    title: customTitle,
    addLabel: 'Add Entry',
    newTitle: `New ${customTitle.toLowerCase()}`,
    newSubtitle: 'Adding a new entry',
    emptyTitle: `${customTitle} is empty`,
    emptyDescription: 'Add entries here as your resume grows.',
    titleLabel: 'Title',
    titlePlaceholder: 'Title...',
    subtitleLabel: 'Subtitle',
    subtitlePlaceholder: 'Subtitle...',
    dateLabel: 'Date',
    detailHeading: 'Details',
    detailHint: 'Add short, specific supporting details.',
    detailPlaceholder: 'Description...',
    detailNoun: 'Detail',
    showLocation: true,
  }
}
const isSimpleSection = (key: string) => ['volunteer', 'certifications', 'publications', 'awards'].includes(key) || Boolean(document.value.customSections.some(section => section.id === key))
const simpleSectionEntries = (key: string): ResumeSimpleEntry[] => {
  if (key === 'volunteer') return document.value.volunteerExperiences
  if (key === 'certifications') return document.value.certifications
  if (key === 'publications') return document.value.publications
  if (key === 'awards') return document.value.awards
  return document.value.customSections.find(section => section.id === key)?.entries || []
}
const saveSimpleEntries = (key: string, entries: ResumeSimpleEntry[]) => {
  if (key === 'volunteer') saveDocument({ ...document.value, volunteerExperiences: entries })
  else if (key === 'certifications') saveDocument({ ...document.value, certifications: entries })
  else if (key === 'publications') saveDocument({ ...document.value, publications: entries })
  else if (key === 'awards') saveDocument({ ...document.value, awards: entries })
  else saveDocument({ ...document.value, customSections: document.value.customSections.map(section => section.id === key ? { ...section, entries } : section) })
}
const addGenericEntry = () => {
  const entry = createEmptySimpleEntry(String(activeSection.value))
  activeSimpleEntryId.value = entry.id
  saveSimpleEntries(String(activeSection.value), [...simpleSectionEntries(String(activeSection.value)), entry])
}
const openSimpleEntry = (id: string) => {
  activeSimpleEntryId.value = id
  menuOpenFor.value = ''
}
const removeSimpleEntry = (id: string) => {
  const key = String(activeSection.value)
  if (activeSimpleEntryId.value === id) activeSimpleEntryId.value = ''
  saveSimpleEntries(key, simpleSectionEntries(key).filter(entry => entry.id !== id))
  menuOpenFor.value = ''
}
const updateSimpleEntry = (id: string, key: 'title' | 'subtitle' | 'date' | 'location', value: string) => {
  const sectionKey = String(activeSection.value)
  saveSimpleEntries(sectionKey, simpleSectionEntries(sectionKey).map(entry => entry.id === id ? { ...entry, [key]: value } : entry))
}
const addSimpleBullet = (id: string) => {
  const key = String(activeSection.value)
  saveSimpleEntries(key, simpleSectionEntries(key).map(entry => entry.id === id ? { ...entry, bullets: [...entry.bullets, createEmptyBullet()] } : entry))
}
const updateSimpleBullet = (entryId: string, bulletId: string, text: string) => {
  const key = String(activeSection.value)
  saveSimpleEntries(key, simpleSectionEntries(key).map(entry => entry.id === entryId
    ? { ...entry, bullets: entry.bullets.map(bullet => bullet.id === bulletId ? { ...bullet, text } : bullet) }
    : entry))
}
const formatDateRange = (startDate: string, endDate: string, current = false) => {
  if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
  return [startDate, endDate].filter(Boolean).join(' - ')
}
</script>
