import React from 'react';
import { useLocation } from 'react-router-dom';

// Feature-based imports
import Community from '@/features/community/pages/Community';
import OfficePage from '@/features/governance/pages/OfficePage';
import ProjectDetail from '@/features/accountability/pages/ProjectDetail';
import PromiseDetail from '@/features/accountability/pages/PromiseDetail';
import CivicResumePage from '@/features/profile/pages/CivicResumePage';

// Legacy imports (not yet migrated)
import NotFound from '@/pages/NotFound';

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PrefixRouter - Renders the appropriate component based on the URL prefix
 * 
 * Route mapping:
 * - /g/:id (UUID) → OfficePage (verified office holder's accountability hub)
 * - /g/:username → CivicResumePage (government official's civic resume, context='g')
 * - /u/:username → CivicResumePage (regular citizen, context='u')
 * - /w/:username → CivicResumePage (verified/trusted platform user, context='w')
 * - /c/:name → Community
 * - /p/:id → ProjectDetail
 * - /pr/:id → PromiseDetail
 */
const PrefixRouter: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // /g/ — government official OR office UUID
  if (pathname.startsWith('/g/')) {
    const param = pathname.split('/')[2];
    if (param && UUID_REGEX.test(param)) {
      return <OfficePage />;
    }
    return <CivicResumePage context="g" />;
  }

  // /p/ — Project detail
  if (pathname.startsWith('/p/')) {
    return <ProjectDetail />;
  }

  // /pr/ — Promise detail
  if (pathname.startsWith('/pr/')) {
    return <PromiseDetail />;
  }

  // /w/ — Verified/trusted platform user
  if (pathname.startsWith('/w/')) {
    return <CivicResumePage context="w" />;
  }

  // /c/ — Community
  if (pathname.startsWith('/c/')) {
    return <Community />;
  }

  // /u/ — Regular citizen
  if (pathname.startsWith('/u/')) {
    return <CivicResumePage context="u" />;
  }

  return <NotFound />;
};

export default PrefixRouter;
