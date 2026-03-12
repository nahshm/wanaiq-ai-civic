
import { UserContext } from './userContext.ts';

/**
 * Build personalized system prompt based on user context
 */
export function buildPersonalizedPrompt(
  context: UserContext,
  basePrompt: string
): string {
  
  // 1. IDENTITY SECTION
  const identitySection = `
### WHO YOU'RE SPEAKING TO
You are assisting **${context.name}**, ${getRoleDescription(context.role)} in ${context.location.county} County.
${context.verifiedRole ? `✓ Verified ${context.role}` : ''}
${context.expertiseAreas.length > 0 ? `Known expertise: ${context.expertiseAreas.join(', ')}` : ''}
`.trim();

  // 2. LOCATION CONTEXT
  const locationSection = `
### LOCATION CONTEXT (CRITICAL FOR PERSONALIZATION)
Primary Location: ${context.location.ward ? `${context.location.ward} Ward, ` : ''}${context.location.constituency || context.location.county}
County: ${context.location.county}

**PERSONALIZATION RULES:**
- When mentioning facilities (hospitals, police, offices), ALWAYS prioritize ${context.location.county} County
- When giving examples, use landmarks/areas from ${context.location.constituency || context.location.county}
- For "where to report" questions, default to ${context.location.county} jurisdiction
${context.location.ward ? `- This user's Ward Representative is the MCA for ${context.location.ward} Ward` : ''}
`.trim();

  // 3. INTERESTS & ACTIVITY CONTEXT
  const interestsSection = buildInterestsSection(context);

  // 4. COMMUNICATION STYLE
  const styleSection = buildCommunicationStyle(context);

  // 5. ACTIVITY-BASED INSIGHTS
  const activitySection = buildActivityInsights(context);

  // 6. ASSEMBLE FINAL PROMPT
  return `
${basePrompt}

${identitySection}

${locationSection}

${interestsSection}

${styleSection}

${activitySection}

### RESPONSE REQUIREMENTS
- Language: ${context.preferredLanguage === 'sw' ? 'Kiswahili' : 'English'} (unless user switches)
- Length: **Exactly 1 short paragraph** (3-5 sentences). No bullets, headings, or lists.
- Relevance: Answer only what the user asked. Do not add side notes unless explicitly requested.
- Citations: Include [Source X] only when directly citing RAG documents
- Localization: Mention ${context.location.county} facilities/contacts only when directly relevant
- Actionability: End within the same paragraph with one concrete next step.
`.trim();
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    'active_citizen': 'a concerned citizen',
    'youth_leader': 'a youth leader',
    'community_organizer': 'a community organizer',
    'journalist': 'a journalist',
    'government_watcher': 'a government accountability watcher',
    'ngo_worker': 'an NGO worker',
    'business_owner': 'a business owner',
    // Legacy fallbacks
    'citizen': 'a concerned citizen',
    'official': 'a government official',
  };
  return descriptions[role] || 'a citizen';
}

function buildInterestsSection(context: UserContext): string {
  if (context.interests.length === 0) {
    return '';
  }

  const primaryInterest = context.interests[0];
  const otherInterests = context.interests.slice(1, 3);

  return `
### USER INTERESTS & FOCUS AREAS
Primary Interest: **${primaryInterest}**
${otherInterests.length > 0 ? `Also interested in: ${otherInterests.join(', ')}` : ''}

**PERSONALIZATION RULES:**
- Only use ${primaryInterest} context when it directly improves the answer
- Never add interest-based suggestions that were not requested
- Keep personalization subtle and strictly relevant to the current question
`.trim();
}

function buildCommunicationStyle(context: UserContext): string {
  const styles: Record<string, { tone: string; approach: string; avoid: string }> = {
    'active_citizen': {
      tone: 'Educational and empowering',
      approach: 'Break down complex governance into simple, actionable steps',
      avoid: 'Legal jargon, assume no prior civic knowledge'
    },
    'youth_leader': {
      tone: 'Collaborative and action-oriented',
      approach: 'Emphasize youth-specific programs (AGPO, Youth Fund), mobilization strategies',
      avoid: 'Condescension; they are civic-aware'
    },
    'community_organizer': {
      tone: 'Strategic and resource-focused',
      approach: 'Provide organizing tips, coalition-building advice, grant opportunities',
      avoid: 'Over-simplification; they understand civic systems'
    },
    'journalist': {
      tone: 'Factual and citation-heavy',
      approach: 'Provide exact legal references, official contacts, verifiable data',
      avoid: 'Opinions; stick to facts and sources'
    },
    'government_watcher': {
      tone: 'Analytical and accountability-focused',
      approach: 'Reference specific Acts, budget data, performance metrics, and official procedures',
      avoid: 'Oversimplification; provide technical depth on governance'
    },
    'ngo_worker': {
      tone: 'Collaborative and impact-focused',
      approach: 'Connect to SDGs, community needs assessments, funding sources',
      avoid: 'Government-centric answers; acknowledge NGO role'
    },
    'business_owner': {
      tone: 'Practical and opportunity-focused',
      approach: 'Highlight AGPO, county tenders, licensing requirements',
      avoid: 'Abstract civic theory; focus on business implications'
    },
    // Legacy fallbacks
    'citizen': {
      tone: 'Educational and empowering',
      approach: 'Break down complex governance into simple, actionable steps',
      avoid: 'Legal jargon, assume no prior civic knowledge'
    },
    'official': {
      tone: 'Professional and procedural',
      approach: 'Reference specific Acts, clauses, official procedures',
      avoid: 'Oversimplification; provide technical depth'
    }
  };

  const style = styles[context.role] || styles['active_citizen'];

  return `
### COMMUNICATION STYLE
Tone: ${style.tone}
Approach: ${style.approach}
Avoid: ${style.avoid}
`.trim();
}

function buildActivityInsights(context: UserContext): string {
  const insights: string[] = [];

  // Recent issue reporting
  if (context.activity.issuesReportedRecently > 0) {
    const types = context.activity.issueTypesReported.slice(0, 2).join(' and ');
    insights.push(
      `This user recently reported ${context.activity.issuesReportedRecently} issue(s), primarily about ${types}`
    );
  }

  // Promise tracking
  if (context.activity.promisesTracked > 0) {
    insights.push(
      `Actively tracking ${context.activity.promisesTracked} political promise(s) - they care about accountability`
    );
  }

  // Political following
  if (context.activity.followingPoliticians.length > 0) {
    const following = context.activity.followingPoliticians.slice(0, 2).join(', ');
    insights.push(`Following: ${following}`);
  }

  // Engagement level
  if (context.engagementScore > 100) {
    insights.push('High engagement user - provide advanced civic information');
  } else if (context.engagementScore < 20) {
    insights.push('New user - provide extra context and onboarding help');
  }

  if (insights.length === 0) {
    return '';
  }

  return `
### ACTIVITY-BASED CONTEXT
${insights.map(i => `- ${i}`).join('\n')}

**USE THIS TO:**
- Reference their past issues when relevant ("Given your previous ${context.activity.issueTypesReported[0]} report...")
- Acknowledge their accountability focus if they track promises
- Avoid repeating basic info for high-engagement users
`.trim();
}
