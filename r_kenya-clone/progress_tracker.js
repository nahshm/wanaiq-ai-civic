// WanaIQ Progress Tracking System
// This script should be run daily via GitHub Actions to track development progress

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ===================================
// MILESTONE DEFINITIONS (8-Week Sprint)
// ===================================

const MILESTONES = {
  'M1.1': {
    name: 'Infrastructure Setup',
    phase: 1,
    start: '2026-02-03',
    deadline: '2026-02-07',
    week: 1,
    tasks: [
      { id: 'T1.1.1', name: 'Git repository linked to portal', hours: 2, priority: 'critical' },
      { id: 'T1.1.2', name: 'Supabase database configured', hours: 4, priority: 'critical' },
      { id: 'T1.1.3', name: 'CI/CD pipeline setup (Vercel)', hours: 6, priority: 'critical' },
      { id: 'T1.1.4', name: 'Development environment documented', hours: 3, priority: 'high' },
      { id: 'T1.1.5', name: 'Staging deployment working', hours: 4, priority: 'critical' }
    ],
    success_criteria: [
      'Repo visible in hackathon portal',
      'Database accepts connections',
      'Auto-deploy on git push',
      '100% environment variables documented',
      'Staging URL accessible'
    ],
    deliverables: ['Development environment', 'CI/CD pipeline', 'Database schema']
  },

  'M1.2': {
    name: 'API Migration',
    phase: 1,
    start: '2026-02-07',
    deadline: '2026-02-14',
    week: 2,
    tasks: [
      { id: 'T1.2.1', name: 'Node.js Express server setup', hours: 6, priority: 'critical' },
      { id: 'T1.2.2', name: 'GraphQL schema definition', hours: 8, priority: 'high' },
      { id: 'T1.2.3', name: 'Authentication middleware (OAuth 2.0)', hours: 10, priority: 'critical' },
      { id: 'T1.2.4', name: 'Rate limiting implementation', hours: 4, priority: 'high' },
      { id: 'T1.2.5', name: 'API documentation (Swagger)', hours: 6, priority: 'medium' },
      { id: 'T1.2.6', name: 'Integration tests (80% coverage)', hours: 12, priority: 'high' }
    ],
    success_criteria: [
      'All endpoints responding',
      'Auth flow working (login/logout)',
      '100 req/min rate limit enforced',
      'Swagger docs accessible',
      '80%+ test coverage'
    ],
    deliverables: ['REST API', 'GraphQL endpoint', 'Authentication system']
  },

  'M2.1': {
    name: 'Civic Agent Router',
    phase: 2,
    start: '2026-02-17',
    deadline: '2026-02-21',
    week: 3,
    tasks: [
      { id: 'T2.1.1', name: 'LLM classification logic (Groq)', hours: 8, priority: 'critical' },
      { id: 'T2.1.2', name: 'Department routing database', hours: 6, priority: 'critical' },
      { id: 'T2.1.3', name: 'Intent recognition system', hours: 10, priority: 'high' },
      { id: 'T2.1.4', name: 'Multi-turn conversation state', hours: 8, priority: 'high' },
      { id: 'T2.1.5', name: 'Confidence scoring (>0.8 threshold)', hours: 6, priority: 'high' },
      { id: 'T2.1.6', name: 'Accuracy testing (100 test cases)', hours: 8, priority: 'critical' }
    ],
    success_criteria: [
      '90%+ routing accuracy',
      '<2s response time',
      '5+ issue categories',
      'Conversation state persists',
      'Fallback handling works'
    ],
    deliverables: ['Civic Agent API', 'Classification model', 'Routing engine']
  },

  'M2.2': {
    name: 'RAG Pipeline',
    phase: 2,
    start: '2026-02-24',
    deadline: '2026-02-28',
    week: 4,
    tasks: [
      { id: 'T2.2.1', name: 'Document ingestion pipeline (500+ docs)', hours: 12, priority: 'critical' },
      { id: 'T2.2.2', name: 'Vector embeddings (Supabase pgvector)', hours: 10, priority: 'critical' },
      { id: 'T2.2.3', name: 'Similarity search API', hours: 8, priority: 'critical' },
      { id: 'T2.2.4', name: 'Context injection logic', hours: 6, priority: 'high' },
      { id: 'T2.2.5', name: 'Source citation system', hours: 6, priority: 'critical' },
      { id: 'T2.2.6', name: 'Hallucination detection tests', hours: 8, priority: 'critical' }
    ],
    success_criteria: [
      '85%+ answer accuracy (50 Q&A pairs)',
      '100% responses cited',
      '<1s search latency',
      'No hallucinations detected',
      '500+ documents indexed'
    ],
    deliverables: ['RAG engine', 'Vector database', 'Citation system']
  },

  'M2.3': {
    name: 'CivicClips AI',
    phase: 2,
    start: '2026-03-03',
    deadline: '2026-03-07',
    week: 5,
    tasks: [
      { id: 'T2.3.1', name: 'Video upload pipeline (S3)', hours: 6, priority: 'critical' },
      { id: 'T2.3.2', name: 'Whisper transcription integration', hours: 8, priority: 'critical' },
      { id: 'T2.3.3', name: 'Sentiment analysis (spaCy)', hours: 8, priority: 'high' },
      { id: 'T2.3.4', name: 'Auto-captioning system', hours: 6, priority: 'high' },
      { id: 'T2.3.5', name: 'Content moderation AI', hours: 10, priority: 'critical' },
      { id: 'T2.3.6', name: 'Processing performance tests', hours: 6, priority: 'medium' }
    ],
    success_criteria: [
      '<2 min video processing time',
      '95%+ transcription accuracy (WER)',
      'Sentiment scored correctly',
      'Inappropriate content flagged',
      'Multi-language support (EN, SW)'
    ],
    deliverables: ['Video processor', 'Transcription service', 'Moderation system']
  },

  'M3.1': {
    name: 'Gamification System',
    phase: 3,
    start: '2026-03-10',
    deadline: '2026-03-14',
    week: 6,
    tasks: [
      { id: 'T3.1.1', name: 'Civic points calculation logic', hours: 8, priority: 'high' },
      { id: 'T3.1.2', name: 'User reputation scoring', hours: 6, priority: 'high' },
      { id: 'T3.1.3', name: 'Achievement badge system', hours: 8, priority: 'medium' },
      { id: 'T3.1.4', name: 'Real-time leaderboards', hours: 6, priority: 'medium' },
      { id: 'T3.1.5', name: 'Civic quest system', hours: 10, priority: 'high' },
      { id: 'T3.1.6', name: 'Engagement analytics', hours: 6, priority: 'low' }
    ],
    success_criteria: [
      'Points awarded correctly',
      'Leaderboard updates in real-time',
      '10+ achievements defined',
      'Engagement increased by 50%',
      'Quest completion tracking works'
    ],
    deliverables: ['Gamification engine', 'Leaderboard UI', 'Achievement system']
  },

  'M3.2': {
    name: 'Mobile Optimization',
    phase: 3,
    start: '2026-03-14',
    deadline: '2026-03-21',
    week: 7,
    tasks: [
      { id: 'T3.2.1', name: 'Progressive Web App setup', hours: 8, priority: 'critical' },
      { id: 'T3.2.2', name: 'Offline capability (service workers)', hours: 10, priority: 'critical' },
      { id: 'T3.2.3', name: 'Push notifications system', hours: 8, priority: 'high' },
      { id: 'T3.2.4', name: 'Touch gesture optimization', hours: 6, priority: 'medium' },
      { id: 'T3.2.5', name: 'App manifest configuration', hours: 4, priority: 'high' },
      { id: 'T3.2.6', name: 'Performance audit (Lighthouse)', hours: 6, priority: 'critical' }
    ],
    success_criteria: [
      'Lighthouse score >90',
      'Offline mode functional',
      'Push notifications working',
      'iOS and Android tested',
      'Touch targets >44px'
    ],
    deliverables: ['PWA', 'Offline support', 'Mobile optimization']
  },

  'M3.3': {
    name: 'Final Launch',
    phase: 3,
    start: '2026-03-21',
    deadline: '2026-03-28',
    week: 8,
    tasks: [
      { id: 'T3.3.1', name: 'Production deployment (AWS)', hours: 8, priority: 'critical' },
      { id: 'T3.3.2', name: 'SSL certificates setup', hours: 4, priority: 'critical' },
      { id: 'T3.3.3', name: 'Monitoring setup (Datadog, Sentry)', hours: 6, priority: 'critical' },
      { id: 'T3.3.4', name: 'Demo video production (<5min)', hours: 10, priority: 'critical' },
      { id: 'T3.3.5', name: 'User documentation (EN, SW)', hours: 12, priority: 'high' },
      { id: 'T3.3.6', name: 'Full regression testing', hours: 16, priority: 'critical' },
      { id: 'T3.3.7', name: 'Security audit (OWASP)', hours: 8, priority: 'critical' }
    ],
    success_criteria: [
      'Public URL live (wanaiq.co.ke)',
      '99.9%+ uptime achieved',
      'Demo video <5 minutes',
      'All documentation complete',
      'No critical security issues'
    ],
    deliverables: ['Production platform', 'Demo video', 'Complete documentation']
  }
};

// ===================================
// TECHNICAL DEBT TRACKING
// ===================================

const DEBT_CATEGORIES = {
  SECURITY: { severity: 'critical', max_allowed: 0 },
  PERF: { severity: 'high', max_allowed: 3 },
  UX: { severity: 'high', max_allowed: 5 },
  A11Y: { severity: 'medium', max_allowed: 10 },
  i18n: { severity: 'high', max_allowed: 5 },
  TEST: { severity: 'medium', max_allowed: 10 },
  REFACTOR: { severity: 'low', max_allowed: 20 }
};

// ===================================
// PROGRESS CALCULATION FUNCTIONS
// ===================================

async function calculateMilestoneProgress(milestoneId) {
  const milestone = MILESTONES[milestoneId];
  if (!milestone) return null;

  // Read task status from a JSON file (you'll update this manually or via script)
  const statusFile = './progress_status.json';
  let taskStatus = {};
  
  if (fs.existsSync(statusFile)) {
    taskStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  }

  const completedTasks = milestone.tasks.filter(task => 
    taskStatus[task.id] === 'done'
  ).length;

  const inProgressTasks = milestone.tasks.filter(task => 
    taskStatus[task.id] === 'in_progress'
  ).length;

  const totalHours = milestone.tasks.reduce((sum, task) => sum + task.hours, 0);
  const completedHours = milestone.tasks
    .filter(task => taskStatus[task.id] === 'done')
    .reduce((sum, task) => sum + task.hours, 0);

  return {
    milestoneId,
    name: milestone.name,
    phase: milestone.phase,
    week: milestone.week,
    totalTasks: milestone.tasks.length,
    completedTasks,
    inProgressTasks,
    percentComplete: Math.round((completedTasks / milestone.tasks.length) * 100),
    totalHours,
    completedHours,
    hoursRemaining: totalHours - completedHours,
    deadline: milestone.deadline,
    isOnTrack: new Date() < new Date(milestone.deadline),
    daysRemaining: Math.ceil((new Date(milestone.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  };
}

async function getCodeMetrics() {
  try {
    // Line count
    const { stdout: lineCount } = await execAsync('find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1');
    const totalLines = parseInt(lineCount.trim().split(/\s+/)[0]) || 0;

    // Test coverage (if Jest configured)
    let coverage = 0;
    try {
      const { stdout: coverageOutput } = await execAsync('npm run test:coverage -- --silent 2>&1 | grep "All files"');
      const match = coverageOutput.match(/(\d+\.?\d*)\%/);
      coverage = match ? parseFloat(match[1]) : 0;
    } catch (e) {
      coverage = 0;
    }

    // TypeScript percentage
    const { stdout: tsFiles } = await execAsync('find src -name "*.ts" -o -name "*.tsx" | wc -l');
    const { stdout: jsFiles } = await execAsync('find src -name "*.js" -o -name "*.jsx" | wc -l');
    const tsCount = parseInt(tsFiles.trim());
    const jsCount = parseInt(jsFiles.trim());
    const tsPercentage = Math.round((tsCount / (tsCount + jsCount)) * 100) || 0;

    return {
      totalLines,
      testCoverage: coverage,
      typescriptPercentage: tsPercentage
    };
  } catch (error) {
    console.error('Error calculating code metrics:', error.message);
    return {
      totalLines: 0,
      testCoverage: 0,
      typescriptPercentage: 0
    };
  }
}

async function getTechnicalDebt() {
  try {
    // Scan codebase for TODO comments with debt tags
    const { stdout } = await execAsync('grep -r "TODO: \\[DEBT-" src/ 2>/dev/null || true');
    const debtItems = stdout.split('\n').filter(line => line.trim());

    const debt = {
      SECURITY: [],
      PERF: [],
      UX: [],
      A11Y: [],
      i18n: [],
      TEST: [],
      REFACTOR: []
    };

    debtItems.forEach(item => {
      const match = item.match(/TODO: \[DEBT-(\w+)\](.*)/);
      if (match) {
        const category = match[1];
        const description = match[2].trim();
        if (debt[category]) {
          debt[category].push(description);
        }
      }
    });

    return {
      critical: debt.SECURITY.length,
      high: debt.PERF.length + debt.UX.length + debt.i18n.length,
      medium: debt.A11Y.length + debt.TEST.length,
      low: debt.REFACTOR.length,
      total: Object.values(debt).reduce((sum, arr) => sum + arr.length, 0),
      byCategory: debt
    };
  } catch (error) {
    console.error('Error calculating technical debt:', error.message);
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
      byCategory: {}
    };
  }
}

async function getPerformanceMetrics() {
  // This would integrate with actual monitoring tools
  // For now, return placeholder data
  return {
    lighthouseScore: 0,
    apiLatencyP95: 0,
    databaseQueryTime: 0,
    uptime: 0
  };
}

// ===================================
// REPORT GENERATION
// ===================================

async function generateDailyReport() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('\n========================================');
  console.log('WANAIQ DAILY PROGRESS REPORT');
  console.log(`Date: ${today}`);
  console.log('========================================\n');

  // Calculate progress for all milestones
  const allProgress = [];
  for (const milestoneId of Object.keys(MILESTONES)) {
    const progress = await calculateMilestoneProgress(milestoneId);
    allProgress.push(progress);
  }

  // Current milestone (first incomplete)
  const currentMilestone = allProgress.find(m => m.percentComplete < 100);
  
  if (currentMilestone) {
    console.log('CURRENT MILESTONE:');
    console.log(`  ${currentMilestone.milestoneId}: ${currentMilestone.name}`);
    console.log(`  Progress: ${currentMilestone.percentComplete}% (${currentMilestone.completedTasks}/${currentMilestone.totalTasks} tasks)`);
    console.log(`  Hours: ${currentMilestone.completedHours}/${currentMilestone.totalHours} (${currentMilestone.hoursRemaining} remaining)`);
    console.log(`  Deadline: ${currentMilestone.deadline} (${currentMilestone.daysRemaining} days)`);
    console.log(`  Status: ${currentMilestone.isOnTrack ? '✅ ON TRACK' : '⚠️  AT RISK'}\n`);
  }

  // Overall sprint progress
  const totalTasks = allProgress.reduce((sum, m) => sum + m.totalTasks, 0);
  const completedTasks = allProgress.reduce((sum, m) => sum + m.completedTasks, 0);
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  console.log('OVERALL SPRINT PROGRESS:');
  console.log(`  ${overallProgress}% Complete (${completedTasks}/${totalTasks} tasks)`);
  console.log(`  Weeks Elapsed: ${Math.ceil((new Date() - new Date('2026-02-03')) / (1000 * 60 * 60 * 24 * 7))}/8`);

  // Code metrics
  const codeMetrics = await getCodeMetrics();
  console.log('\nCODE METRICS:');
  console.log(`  Total Lines: ${codeMetrics.totalLines.toLocaleString()}`);
  console.log(`  Test Coverage: ${codeMetrics.testCoverage.toFixed(1)}% ${codeMetrics.testCoverage >= 80 ? '✅' : '⚠️'}`);
  console.log(`  TypeScript: ${codeMetrics.typescriptPercentage}% ${codeMetrics.typescriptPercentage >= 90 ? '✅' : '⚠️'}`);

  // Technical debt
  const debt = await getTechnicalDebt();
  console.log('\nTECHNICAL DEBT:');
  console.log(`  Critical: ${debt.critical} ${debt.critical === 0 ? '✅' : '🚨'}`);
  console.log(`  High: ${debt.high} ${debt.high <= 5 ? '✅' : '⚠️'}`);
  console.log(`  Medium: ${debt.medium}`);
  console.log(`  Low: ${debt.low}`);
  console.log(`  Total: ${debt.total}`);

  // Alerts
  console.log('\nALERTS:');
  const alerts = [];
  
  if (currentMilestone && !currentMilestone.isOnTrack) {
    alerts.push(`⚠️  Current milestone ${currentMilestone.milestoneId} is at risk (${currentMilestone.daysRemaining} days to deadline)`);
  }
  if (codeMetrics.testCoverage < 80) {
    alerts.push(`⚠️  Test coverage below target: ${codeMetrics.testCoverage.toFixed(1)}% (target: 80%)`);
  }
  if (debt.critical > 0) {
    alerts.push(`🚨 CRITICAL: ${debt.critical} critical technical debt items must be resolved`);
  }
  if (debt.high > 5) {
    alerts.push(`⚠️  ${debt.high} high-priority debt items (target: <5)`);
  }

  if (alerts.length === 0) {
    console.log('  ✅ No alerts - all metrics on track!');
  } else {
    alerts.forEach(alert => console.log(`  ${alert}`));
  }

  console.log('\n========================================\n');

  // Save report to file
  const report = {
    date: today,
    currentMilestone,
    overallProgress,
    codeMetrics,
    technicalDebt: debt,
    alerts
  };

  fs.writeFileSync(
    `./reports/daily_report_${today}.json`,
    JSON.stringify(report, null, 2)
  );

  return report;
}

// ===================================
// MILESTONE CHECKLIST GENERATOR
// ===================================

function generateMilestoneChecklist(milestoneId) {
  const milestone = MILESTONES[milestoneId];
  if (!milestone) {
    console.log(`Milestone ${milestoneId} not found`);
    return;
  }

  console.log(`\n# ${milestone.name} Checklist (${milestoneId})`);
  console.log(`Deadline: ${milestone.deadline} (Week ${milestone.week})`);
  console.log(`\n## Tasks (${milestone.tasks.length} total, ${milestone.tasks.reduce((s, t) => s + t.hours, 0)} hours)`);
  
  milestone.tasks.forEach(task => {
    console.log(`- [ ] **${task.name}** (${task.hours}h, ${task.priority})`);
  });

  console.log(`\n## Success Criteria`);
  milestone.success_criteria.forEach(criteria => {
    console.log(`- [ ] ${criteria}`);
  });

  console.log(`\n## Deliverables`);
  milestone.deliverables.forEach(deliverable => {
    console.log(`- ${deliverable}`);
  });
}

// ===================================
// MAIN EXECUTION
// ===================================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'report':
      await generateDailyReport();
      break;
    
    case 'checklist':
      const milestoneId = process.argv[3];
      if (!milestoneId) {
        console.log('Usage: node progress_tracker.js checklist <MILESTONE_ID>');
        console.log('Example: node progress_tracker.js checklist M2.1');
        return;
      }
      generateMilestoneChecklist(milestoneId);
      break;
    
    case 'debt':
      const debt = await getTechnicalDebt();
      console.log('\nTECHNICAL DEBT SUMMARY:');
      console.log(JSON.stringify(debt, null, 2));
      break;
    
    default:
      console.log('WanaIQ Progress Tracker');
      console.log('\nCommands:');
      console.log('  report                 - Generate daily progress report');
      console.log('  checklist <MILESTONE>  - Show checklist for specific milestone');
      console.log('  debt                   - Show technical debt summary');
      console.log('\nExamples:');
      console.log('  node progress_tracker.js report');
      console.log('  node progress_tracker.js checklist M2.1');
      console.log('  node progress_tracker.js debt');
  }
}

// Create reports directory if it doesn't exist
if (!fs.existsSync('./reports')) {
  fs.mkdirSync('./reports');
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  MILESTONES,
  calculateMilestoneProgress,
  getCodeMetrics,
  getTechnicalDebt,
  generateDailyReport,
  generateMilestoneChecklist
};
