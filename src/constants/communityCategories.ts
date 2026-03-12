export interface CommunityCategory {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface CommunityCategoryGroup {
  label: string;
  categories: CommunityCategory[];
}

export const communityCategoryGroups: CommunityCategoryGroup[] = [
  {
    label: 'Civic & Governance',
    categories: [
      { value: 'governance', label: 'Governance', description: 'County and national governance discussions', icon: '🏛️' },
      { value: 'accountability', label: 'Accountability', description: 'Tracking promises and public spending', icon: '📊' },
      { value: 'civic-education', label: 'Civic Education', description: 'Learning about rights and civic processes', icon: '📚' },
      { value: 'discussion', label: 'General Discussion', description: 'Open civic dialogue and debate', icon: '💬' },
    ],
  },
  {
    label: 'Social Services',
    categories: [
      { value: 'education', label: 'Education', description: 'Schools, universities, and learning', icon: '🎓' },
      { value: 'healthcare', label: 'Healthcare', description: 'Hospitals, clinics, and health policy', icon: '🏥' },
      { value: 'infrastructure', label: 'Infrastructure', description: 'Roads, water, and public utilities', icon: '🛣️' },
      { value: 'environment', label: 'Environment', description: 'Conservation and environmental issues', icon: '🌿' },
      { value: 'security', label: 'Security', description: 'Safety, policing, and community watch', icon: '🛡️' },
    ],
  },
  {
    label: 'Organizations',
    categories: [
      { value: 'economic-empowerment', label: 'Economic Empowerment', description: 'Business, tenders, and livelihoods', icon: '💼' },
      { value: 'youth', label: 'Youth', description: 'Youth programs, opportunities, and voices', icon: '🚀' },
      { value: 'women-rights', label: "Women's Rights", description: 'Gender equality and empowerment', icon: '👩' },
      { value: 'ngo', label: 'NGO / CSO', description: 'Non-governmental and civil society orgs', icon: '🌍' },
      { value: 'community-org', label: 'Community Org', description: 'CBOs and grassroots organizations', icon: '🤝' },
    ],
  },
];

export const allCommunityCategories: CommunityCategory[] = communityCategoryGroups.flatMap(g => g.categories);

export const getCategoryLabel = (value: string): string => {
  const cat = allCommunityCategories.find(c => c.value === value);
  return cat?.label || value;
};
