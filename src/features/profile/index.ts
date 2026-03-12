// Profile Feature Module
// Civic Profile 2.0 - "The Civic Resume"

// Pages
export { ActionCenter } from './pages';

// Hooks
export {
    useCivicImpact,
    useOfficialScorecard,
    useProfileCustomization,
    THEMES,
    FRAME_ANIMATIONS
} from './hooks';

// Components - Identity
export {
    ProfileIdentityCard,
    GoatBadge,
    ImpactRating,
    TrustTier
} from './components/identity';

// Components - Scorecard
export {
    PromiseMeter,
    ProjectHealth
} from './components/scorecard';

// Components - Expertise
export {
    ExpertiseGrid,
    ExpertiseBadge,
    EXPERTISE_CONFIG
} from './components/expertise';

// Components - Trophy
export { TrophyCase } from './components/trophy';

// Components - Studio
export {
    ProfileStudio,
    ThemeSelector,
    FrameSelector
} from './components/studio';
