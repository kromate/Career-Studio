import type { EditableResumeDocument, StructuredResumeImport, StructuredResumeSimpleEntry } from '@/types'
import { createBuilderId, createEmptyBuilderDocument, mergeBuilderDocument } from './builder'

function createBullets(values: string[]) {
  return values.map(text => ({ id: createBuilderId('bullet'), text }))
}

function createSimpleEntry(prefix: string, entry: StructuredResumeSimpleEntry) {
  return {
    id: createBuilderId(prefix),
    title: entry.title,
    subtitle: entry.subtitle,
    date: entry.date,
    location: entry.location,
    bullets: createBullets(entry.bullets),
  }
}

export function structuredResumeToBuilderDocument(input: StructuredResumeImport): EditableResumeDocument {
  const timestamp = new Date().toISOString()
  const document = createEmptyBuilderDocument({
    id: createBuilderId('builder'),
    source: 'import',
    targetRole: input.profile.targetRole,
    experienceLevel: input.profile.experienceLevel,
    now: timestamp,
  })

  return mergeBuilderDocument({
    ...document,
    profile: {
      ...document.profile,
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      email: input.profile.email,
      phone: input.profile.phone,
      location: input.profile.location,
      links: input.profile.links.map(link => ({
        id: createBuilderId('link'),
        label: link.label || 'Link',
        url: link.url,
      })).filter(link => link.url),
      summary: input.profile.summary,
      targetRole: input.profile.targetRole,
      experienceLevel: input.profile.experienceLevel,
    },
    workExperiences: input.workExperiences.map(entry => ({
      id: createBuilderId('experience'),
      jobTitle: entry.jobTitle,
      employer: entry.employer,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      current: entry.current,
      hideDates: !entry.startDate && !entry.endDate && !entry.current,
      bullets: createBullets(entry.bullets),
    })),
    educations: input.educations.map(entry => ({
      id: createBuilderId('education'),
      school: entry.school,
      degree: entry.degree,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      details: createBullets(entry.details),
    })),
    skills: input.skills.map(group => ({
      id: createBuilderId('skills'),
      title: group.title,
      skills: group.skills,
    })),
    projects: input.projects.map(entry => ({
      id: createBuilderId('project'),
      name: entry.name,
      role: entry.role,
      url: entry.url,
      startDate: entry.startDate,
      endDate: entry.endDate,
      bullets: createBullets(entry.bullets),
    })),
    volunteerExperiences: input.volunteerExperiences.map(entry => createSimpleEntry('volunteer', entry)),
    certifications: input.certifications.map(entry => createSimpleEntry('certification', entry)),
    publications: input.publications.map(entry => createSimpleEntry('publication', entry)),
    awards: input.awards.map(entry => createSimpleEntry('award', entry)),
    updatedAt: timestamp,
  })
}