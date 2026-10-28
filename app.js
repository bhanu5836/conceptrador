/**
 * ConceptRadar — Smart Classroom Learning Analytics
 * Production Application Logic & Calculation Engine
 */

// ==========================================================================
// 1. Data Store & Configuration
// ==========================================================================

const TOPICS = [
  { id: 'arrays', name: 'Arrays', color: '#2563eb', lightColor: '#eff6ff', borderColor: '#3b82f6' },
  { id: 'loops', name: 'Loops', color: '#e11d48', lightColor: '#fff1f2', borderColor: '#f43f5e' },
  { id: 'functions', name: 'Functions', color: '#0d9488', lightColor: '#f0fdfa', borderColor: '#14b8a6' }
];

const DEMO_STUDENTS = [
  { id: 'std-1', name: 'Alex Rivera', arrays: 8, loops: 4, functions: 9 },
  { id: 'std-2', name: 'Maya Patel', arrays: 9, loops: 3, functions: 8 },
  { id: 'std-3', name: 'Liam Chen', arrays: 7, loops: 5, functions: 7 },
  { id: 'std-4', name: 'Sophia Gomez', arrays: 8, loops: 4, functions: 9 },
  { id: 'std-5', name: 'Ethan Miller', arrays: 6, loops: 6, functions: 6 },
  { id: 'std-6', name: 'Olivia Zhang', arrays: 9, loops: 3, functions: 8 }
];

let appState = {
  students: [],
  isDemo: true,
  activePage: 'dashboard',
  selectedFilter: 'all',
  searchQuery: '',
  sortCriteria: 'total_desc',
  analysis: null,
  charts: {
    avgScore: null,
    errorRate: null,
    radar: null
  }
};

// ==========================================================================
// 2. Analytical Engine (Exact Formulas from Prompt)
// ==========================================================================

/**
 * Calculates analytics according to exact rules:
 * - Total score = sum of student scores for a topic.
 * - Possible marks = number of students × 10.
 * - Average score = total score ÷ number of students.
 * - Mistakes = possible marks − total score.
 * - Error percentage = (mistakes ÷ possible marks) × 100.
 * - Weakest topic = topic with highest error percentage.
 */
function computeAnalytics(studentsList) {
  const count = studentsList.length;
  
  if (count === 0) {
    return {
      studentCount: 0,
      topicResults: [],
      weakestTopic: null,
      strongestTopic: null,
      classOverallAvg: 0,
      classOverallTotal: 0,
      passRate: 0,
      studentSummaries: []
    };
  }

  const topicResults = TOPICS.map(topic => {
    // 1. Total score = sum of student scores for a topic
    const totalScore = studentsList.reduce((sum, s) => sum + (Number(s[topic.id]) || 0), 0);
    
    // 2. Possible marks = number of students × 10
    const possibleMarks = count * 10;
    
    // 3. Average score = total score ÷ number of students
    const avgScore = count > 0 ? (totalScore / count) : 0;
    
    // 4. Mistakes = possible marks − total score
    const mistakes = possibleMarks - totalScore;
    
    // 5. Error percentage = (mistakes ÷ possible marks) × 100
    const errorPct = possibleMarks > 0 ? ((mistakes / possibleMarks) * 100) : 0;

    return {
      id: topic.id,
      name: topic.name,
      color: topic.color,
      totalScore,
      possibleMarks,
      averageScore: Number(avgScore.toFixed(2)),
      mistakes,
      errorPercentage: Number(errorPct.toFixed(1))
    };
  });

  // Rank topics from highest error percentage to lowest (Weakest first)
  const rankedByStruggle = [...topicResults].sort((a, b) => b.errorPercentage - a.errorPercentage);
  const weakestTopic = rankedByStruggle[0];
  const strongestTopic = rankedByStruggle[rankedByStruggle.length - 1];

  // Per-student summaries
  const studentSummaries = studentsList.map(s => {
    const arr = Number(s.arrays) || 0;
    const lop = Number(s.loops) || 0;
    const fn = Number(s.functions) || 0;
    const total = arr + lop + fn;
    const pct = Number(((total / 30) * 100).toFixed(1));
    
    let tier = 'Needs Support';
    let tierClass = 'badge-danger';
    if (pct >= 80) {
      tier = 'High Performer';
      tierClass = 'badge-success';
    } else if (pct >= 60) {
      tier = 'Average';
      tierClass = 'badge-teal';
    }

    return {
      ...s,
      arrays: arr,
      loops: lop,
      functions: fn,
      total,
      percentage: pct,
      tier,
      tierClass
    };
  });

  // Class overall
  const grandTotal = topicResults.reduce((acc, t) => acc + t.totalScore, 0);
  const maxPossibleGrand = count * 30;
  const overallAvgOutOf30 = Number((grandTotal / count).toFixed(1));
  const overallAvgOutOf10 = Number((overallAvgOutOf30 / 3).toFixed(1));
  
  const passedStudents = studentSummaries.filter(s => s.percentage >= 60).length;
  const passRate = Number(((passedStudents / count) * 100).toFixed(1));

  return {
    studentCount: count,
    topicResults,
    rankedByStruggle,
    weakestTopic,
    strongestTopic,
    overallAvgOutOf10,
    overallAvgOutOf30,
    maxPossibleGrand,
    grandTotal,
    passRate,
    passedStudents,
    studentSummaries
  };
}

// ==========================================================================
// 3. Persistence & State Management
// ==========================================================================

function loadState() {
  const savedData = localStorage.getItem('concept_radar_students');
  const savedDemoFlag = localStorage.getItem('concept_radar_is_demo');

  if (savedData) {
    try {
      appState.students = JSON.parse(savedData);
      appState.isDemo = savedDemoFlag === 'true';
    } catch (e) {
      console.error('Failed to parse cached student data:', e);
      initDemoState();
    }
  } else {
    initDemoState();
  }

  runAnalysis();
}

function initDemoState() {
  appState.students = JSON.parse(JSON.stringify(DEMO_STUDENTS));
  appState.isDemo = true;
  saveState();
}

function saveState() {
  localStorage.setItem('concept_radar_students', JSON.stringify(appState.students));
  localStorage.setItem('concept_radar_is_demo', appState.isDemo.toString());
}

function runAnalysis() {
  appState.analysis = computeAnalytics(appState.students);
  updateGlobalBanner();
  renderDashboard();
  renderScoreEntryTable();
  renderConceptAnalysis();
  renderStudentRecords();
  renderReports();
}

// ==========================================================================
// 4. UI Navigation & Page Views
// ==========================================================================

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.getAttribute('data-page');
      switchPage(pageId);
    });
  });

  // Header quick buttons
  document.getElementById('btnHeaderAddStudent').addEventListener('click', () => {
    switchPage('score-entry');
    addNewStudentRow();
  });

  document.getElementById('btnHeaderAnalyze').addEventListener('click', () => {
    switchPage('concept-analysis');
    showToast('Analyzed scores and updated curriculum diagnostics!', 'success');
  });

  document.getElementById('btnHeaderExportCsv').addEventListener('click', exportCsv);
  document.getElementById('btnQuickScoreEntry').addEventListener('click', () => switchPage('score-entry'));
  document.getElementById('btnGoToConceptDeepDive').addEventListener('click', () => switchPage('concept-analysis'));

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const mobileTrigger = document.getElementById('mobileNavTrigger');
  const sidebarToggle = document.getElementById('sidebarToggle');

  if (mobileTrigger) {
    mobileTrigger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }

  // Banner Actions
  document.getElementById('btnSwitchToDemo').addEventListener('click', () => {
    initDemoState();
    runAnalysis();
    showToast('Demo dataset loaded with 6 sample student scores.', 'success');
  });

  document.getElementById('btnSwitchToClean').addEventListener('click', () => {
    appState.students = [
      { id: 'std-1', name: '', arrays: '', loops: '', functions: '' }
    ];
    appState.isDemo = false;
    saveState();
    runAnalysis();
    switchPage('score-entry');
    showToast('Cleared dataset. Ready for live classroom score entry.', 'success');
  });
}

function switchPage(pageId) {
  appState.activePage = pageId;

  // Update nav item active states
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-page') === pageId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all pages, show target page
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  const titles = {
    'dashboard': {
      title: 'Classroom Learning Dashboard',
      subtitle: 'Real-time diagnosis of student strengths and algorithmic weak spots'
    },
    'score-entry': {
      title: 'Student Score Entry',
      subtitle: 'Input student quiz scores (0 to 10 points) across core topics'
    },
    'concept-analysis': {
      title: 'Concept Error & Mastery Analysis',
      subtitle: 'Deep-dive calculations ranked from highest to lowest mistake ratios'
    },
    'student-records': {
      title: 'Student Performance Records',
      subtitle: 'Individual student scorecards, rankings, and mastery tiers'
    },
    'reports': {
      title: 'Academic Diagnostic Reports & Export',
      subtitle: 'Generate print-ready summaries and CSV deliverables for instructors'
    }
  };

  const targetView = {
    'dashboard': 'pageDashboard',
    'score-entry': 'pageScoreEntry',
    'concept-analysis': 'pageConceptAnalysis',
    'student-records': 'pageStudentRecords',
    'reports': 'pageReports'
  }[pageId];

  if (targetView) {
    const el = document.getElementById(targetView);
    if (el) el.classList.add('active');
  }

  if (titles[pageId]) {
    document.getElementById('pageTitle').textContent = titles[pageId].title;
    document.getElementById('pageSubtitle').textContent = titles[pageId].subtitle;
  }

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('open');

  // Trigger chart re-render if switching to charts page
  if (pageId === 'dashboard') {
    renderDashboardCharts();
  } else if (pageId === 'concept-analysis') {
    renderConceptRadarChart();
  }
}

function updateGlobalBanner() {
  const bannerBadge = document.getElementById('bannerBadge');
  const banner = document.getElementById('demoBanner');
  const dashBadge = document.getElementById('dashSampleBadge');

  if (appState.isDemo) {
    banner.classList.remove('hidden');
    bannerBadge.className = 'badge badge-demo';
    bannerBadge.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      Demo Mode Active
    `;
    if (dashBadge) {
      dashBadge.className = 'badge badge-demo';
      dashBadge.textContent = 'Demo Dataset Active';
    }
  } else {
    bannerBadge.className = 'badge badge-success';
    bannerBadge.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Live Classroom Mode
    `;
    if (dashBadge) {
      dashBadge.className = 'badge badge-teal';
      dashBadge.textContent = 'Live Classroom Data';
    }
  }

  // Update cohort metadata in sidebar
  const metaEl = document.getElementById('sidebarCohortMeta');
  if (metaEl) {
    metaEl.textContent = `Quiz #1 • ${appState.students.length} Students • 3 Topics`;
  }

  const badgeCount = document.getElementById('navStudentCountBadge');
  if (badgeCount) {
    badgeCount.textContent = appState.students.length;
  }
}

// ==========================================================================
// 5. Page 1: Dashboard Rendering & Charts
// ==========================================================================

function renderDashboard() {
  const { studentCount, overallAvgOutOf10, overallAvgOutOf30, weakestTopic, topicResults, rankedByStruggle } = appState.analysis;

  document.getElementById('statTotalStudents').textContent = studentCount;
  document.getElementById('statClassAvgScore').textContent = overallAvgOutOf10;
  document.getElementById('statClassAvgTotal').textContent = `Overall ${overallAvgOutOf30} / 30.0 (${((overallAvgOutOf30 / 30) * 100).toFixed(1)}%)`;

  if (weakestTopic) {
    document.getElementById('statWeakestTopicName').textContent = weakestTopic.name;
    document.getElementById('statWeakestErrorRate').textContent = `${weakestTopic.errorPercentage}% Error Rate`;
    
    document.getElementById('alertWeakestTopicBold').textContent = weakestTopic.name;
    document.getElementById('alertWeakestTopicDesc').textContent = 
      `Students averaged ${weakestTopic.averageScore} / 10 in ${weakestTopic.name} with ${weakestTopic.mistakes} mistakes out of ${weakestTopic.possibleMarks} possible marks (${weakestTopic.errorPercentage}% error rate). Re-teaching core ${weakestTopic.name.toLowerCase()} patterns is recommended.`;
  } else {
    document.getElementById('statWeakestTopicName').textContent = 'None';
    document.getElementById('statWeakestErrorRate').textContent = '0% Error';
  }

  // Topic Cards
  const cardsContainer = document.getElementById('dashTopicCardsContainer');
  cardsContainer.innerHTML = '';

  topicResults.forEach(topic => {
    const isWeakest = weakestTopic && topic.id === weakestTopic.id;
    const card = document.createElement('div');
    card.className = `topic-card ${isWeakest ? 'is-weakest' : ''}`;
    
    const accuracy = (100 - topic.errorPercentage).toFixed(1);

    card.innerHTML = `
      <div class="topic-card-header">
        <h3 class="topic-title">${topic.name}</h3>
        ${isWeakest ? '<span class="badge badge-danger">Weakest Topic</span>' : '<span class="badge badge-success">Good Mastery</span>'}
      </div>
      <div class="topic-metrics-grid">
        <div class="topic-metric">
          <div class="topic-metric-label">Average Score</div>
          <div class="topic-metric-value">${topic.averageScore} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary);">/ 10</span></div>
        </div>
        <div class="topic-metric">
          <div class="topic-metric-label">Error Rate</div>
          <div class="topic-metric-value ${isWeakest ? 'text-rose' : ''}">${topic.errorPercentage}%</div>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-label-row">
          <span>Mastery Accuracy</span>
          <span>${accuracy}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${isWeakest ? 'fill-rose' : 'fill-teal'}" style="width: ${accuracy}%"></div>
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Actionable Revision Priority List
  const revisionList = document.getElementById('dashRevisionList');
  revisionList.innerHTML = '';

  rankedByStruggle.forEach((topic, idx) => {
    const item = document.createElement('div');
    let priorityClass = 'priority-good';
    let urgencyBadge = '<span class="badge badge-success">Mastered</span>';
    let advice = 'Students show solid grasp; assign extension problems.';

    if (idx === 0) {
      priorityClass = 'priority-urgent';
      urgencyBadge = '<span class="badge badge-danger">Urgent Revision</span>';
      advice = 'Dedicate the next 45-minute lab session to step-by-step tracing and live code walkthroughs.';
    } else if (idx === 1) {
      priorityClass = 'priority-moderate';
      urgencyBadge = '<span class="badge badge-warning">Moderate Review</span>';
      advice = 'Provide 15-minute quick warm-up drill and common error flashcards.';
    }

    item.className = `priority-item ${priorityClass}`;
    item.innerHTML = `
      <div class="priority-left">
        <div class="priority-rank-badge">#${idx + 1}</div>
        <div>
          <div class="priority-topic-name">${topic.name}</div>
          <div class="priority-topic-desc">${advice}</div>
        </div>
      </div>
      <div class="priority-stats">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Mistakes</div>
          <div style="font-weight: 700; color: var(--text-main);">${topic.mistakes} / ${topic.possibleMarks}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Error %</div>
          <div style="font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;" class="${idx === 0 ? 'text-rose' : ''}">${topic.errorPercentage}%</div>
        </div>
        <div>${urgencyBadge}</div>
      </div>
    `;
    revisionList.appendChild(item);
  });

  renderDashboardCharts();
}

function renderDashboardCharts() {
  if (typeof Chart === 'undefined') return;
  const { topicResults, weakestTopic } = appState.analysis;
  if (!topicResults || topicResults.length === 0) return;

  const labels = topicResults.map(t => t.name);
  const avgScores = topicResults.map(t => t.averageScore);
  const errorPcts = topicResults.map(t => t.errorPercentage);

  // 1. Average Score Bar Chart
  const ctxAvg = document.getElementById('chartAverageScores');
  if (ctxAvg) {
    if (appState.charts.avgScore) {
      appState.charts.avgScore.destroy();
    }

    const backgroundColors = topicResults.map(t => {
      return (weakestTopic && t.id === weakestTopic.id) ? '#f43f5e' : '#2563eb';
    });

    appState.charts.avgScore = new Chart(ctxAvg, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Average Score (/10)',
          data: avgScores,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          barThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Avg Score: ${context.parsed.y} / 10`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            ticks: { stepSize: 2, font: { family: 'Inter' } },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' } }
          }
        }
      }
    });
  }

  // 2. Error Rate Bar Chart
  const ctxErr = document.getElementById('chartErrorRates');
  if (ctxErr) {
    if (appState.charts.errorRate) {
      appState.charts.errorRate.destroy();
    }

    const errColors = topicResults.map(t => {
      return (weakestTopic && t.id === weakestTopic.id) ? '#e11d48' : '#0d9488';
    });

    appState.charts.errorRate = new Chart(ctxErr, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Error Rate (%)',
          data: errorPcts,
          backgroundColor: errColors,
          borderRadius: 6,
          barThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Error Rate: ${context.parsed.y}% mistakes`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (val) => `${val}%`,
              stepSize: 20,
              font: { family: 'Inter' }
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' } }
          }
        }
      }
    });
  }
}

// ==========================================================================
// 6. Page 2: Student Score Entry Form & Validation
// ==========================================================================

function renderScoreEntryTable() {
  const tbody = document.getElementById('scoreEntryTableBody');
  const counter = document.getElementById('entryStudentCounter');
  const addBtn = document.getElementById('btnAddRow');

  tbody.innerHTML = '';
  counter.textContent = appState.students.length;

  if (appState.students.length >= 10) {
    addBtn.disabled = true;
    addBtn.title = 'Maximum cohort limit of 10 students reached';
  } else {
    addBtn.disabled = false;
    addBtn.title = 'Add new student row';
  }

  appState.students.forEach((student, index) => {
    const tr = document.createElement('tr');
    tr.dataset.id = student.id;

    const arrVal = student.arrays !== undefined && student.arrays !== null ? student.arrays : '';
    const lopVal = student.loops !== undefined && student.loops !== null ? student.loops : '';
    const fnVal = student.functions !== undefined && student.functions !== null ? student.functions : '';
    
    const rowTotal = (Number(arrVal) || 0) + (Number(lopVal) || 0) + (Number(fnVal) || 0);

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-secondary);">${index + 1}</td>
      <td>
        <input type="text" class="input-student-name" placeholder="e.g. Jordan Lee" value="${escapeHtml(student.name || '')}" data-field="name">
        <span class="input-validation-msg hidden"></span>
      </td>
      <td>
        <input type="number" class="input-score" min="0" max="10" step="1" placeholder="0–10" value="${arrVal}" data-field="arrays">
        <span class="input-validation-msg hidden"></span>
      </td>
      <td>
        <input type="number" class="input-score" min="0" max="10" step="1" placeholder="0–10" value="${lopVal}" data-field="loops">
        <span class="input-validation-msg hidden"></span>
      </td>
      <td>
        <input type="number" class="input-score" min="0" max="10" step="1" placeholder="0–10" value="${fnVal}" data-field="functions">
        <span class="input-validation-msg hidden"></span>
      </td>
      <td>
        <span class="entry-row-total">${rowTotal}</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">/ 30</span>
      </td>
      <td style="text-align: center;">
        <button class="btn-icon btn-delete-row" title="Remove this student" data-index="${index}" ${appState.students.length <= 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  attachEntryInputListeners();
}

function attachEntryInputListeners() {
  const tbody = document.getElementById('scoreEntryTableBody');

  // Input changes
  tbody.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      const studentId = tr.dataset.id;
      const field = e.target.dataset.field;
      const student = appState.students.find(s => s.id === studentId);

      if (!student) return;

      if (field === 'name') {
        student.name = e.target.value;
      } else {
        const val = e.target.value.trim();
        student[field] = val === '' ? '' : Number(val);
      }

      // Recompute row total visually
      const arr = Number(student.arrays) || 0;
      const lop = Number(student.loops) || 0;
      const fn = Number(student.functions) || 0;
      const totalEl = tr.querySelector('.entry-row-total');
      if (totalEl) totalEl.textContent = arr + lop + fn;

      // Validate single field
      validateInputField(e.target);
    });
  });

  // Delete row buttons
  tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(btn.dataset.index, 10);
      if (appState.students.length <= 1) {
        showToast('At least 1 student is required in the cohort.', 'error');
        return;
      }
      const removed = appState.students.splice(index, 1);
      saveState();
      renderScoreEntryTable();
      showToast(`Removed student record "${removed[0].name || 'Row'}".`, 'success');
    });
  });
}

function validateInputField(input) {
  const field = input.dataset.field;
  const val = input.value.trim();
  const parentTd = input.closest('td');
  const msgEl = parentTd.querySelector('.input-validation-msg');

  let isValid = true;
  let message = '';

  if (field === 'name') {
    if (val === '') {
      isValid = false;
      message = 'Student name required';
    }
  } else {
    if (val === '') {
      isValid = false;
      message = 'Score required (0–10)';
    } else {
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num)) {
        isValid = false;
        message = 'Must be whole number';
      } else if (num < 0 || num > 10) {
        isValid = false;
        message = 'Must be between 0 and 10';
      }
    }
  }

  if (!isValid) {
    input.classList.add('is-invalid');
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.classList.remove('hidden');
    }
  } else {
    input.classList.remove('is-invalid');
    if (msgEl) {
      msgEl.classList.add('hidden');
    }
  }

  return isValid;
}

function validateAllEntryRows() {
  const table = document.getElementById('scoreEntryTable');
  const inputs = table.querySelectorAll('input');
  let allValid = true;
  let firstInvalid = null;

  inputs.forEach(input => {
    const valid = validateInputField(input);
    if (!valid && allValid) {
      allValid = false;
      firstInvalid = input;
    }
  });

  const alertBox = document.getElementById('entryValidationAlert');
  const alertText = document.getElementById('entryValidationText');

  if (!allValid) {
    alertBox.classList.remove('hidden');
    alertText.textContent = 'Please fix the highlighted validation errors. Names cannot be blank and scores must be integers from 0 to 10.';
    if (firstInvalid) firstInvalid.focus();
    return false;
  }

  alertBox.classList.add('hidden');
  return true;
}

function addNewStudentRow() {
  if (appState.students.length >= 10) {
    showToast('Cohort maximum of 10 students reached.', 'error');
    return;
  }

  const newId = 'std-' + (Date.now() % 10000);
  appState.students.push({
    id: newId,
    name: '',
    arrays: '',
    loops: '',
    functions: ''
  });

  renderScoreEntryTable();

  // Focus the newly added name input
  const lastRow = document.querySelector(`#scoreEntryTableBody tr[data-id="${newId}"]`);
  if (lastRow) {
    const nameInput = lastRow.querySelector('.input-student-name');
    if (nameInput) nameInput.focus();
  }

  showToast('Added new student entry row.', 'success');
}

function setupScoreEntryActions() {
  document.getElementById('btnAddRow').addEventListener('click', addNewStudentRow);

  document.getElementById('btnClearAllRows').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all student rows?')) {
      appState.students = [
        { id: 'std-1', name: '', arrays: '', loops: '', functions: '' }
      ];
      appState.isDemo = false;
      saveState();
      renderScoreEntryTable();
      showToast('Cleared all rows. Enter fresh student data.', 'success');
    }
  });

  document.getElementById('btnLoadDemoInEntry').addEventListener('click', () => {
    initDemoState();
    runAnalysis();
    showToast('Demo dataset loaded with 6 student scores.', 'success');
  });

  document.getElementById('btnSaveAndAnalyze').addEventListener('click', () => {
    if (!validateAllEntryRows()) {
      showToast('Validation failed: check score values (0–10) and names.', 'error');
      return;
    }

    saveState();
    runAnalysis();
    showToast('Score analysis updated successfully! Navigating to Concept Analysis...', 'success');
    switchPage('concept-analysis');
  });
}

// ==========================================================================
// 7. Page 3: Concept Analysis & Radar Chart
// ==========================================================================

function renderConceptAnalysis() {
  const { studentCount, rankedByStruggle, weakestTopic } = appState.analysis;

  // Hero Banner
  if (weakestTopic) {
    document.getElementById('heroWeakestTitle').textContent = weakestTopic.name;
    document.getElementById('heroWeakestErrorRate').textContent = `${weakestTopic.errorPercentage}%`;
    document.getElementById('heroWeakestAvg').textContent = `${weakestTopic.averageScore} / 10`;
    document.getElementById('heroWeakestMistakes').textContent = `${weakestTopic.mistakes} / ${weakestTopic.possibleMarks}`;
    document.getElementById('heroWeakestStudents').textContent = `${studentCount} Students`;
    document.getElementById('heroCircleErrorVal').textContent = `${weakestTopic.errorPercentage}%`;

    document.getElementById('heroWeakestDesc').textContent = 
      `With an error rate of ${weakestTopic.errorPercentage}%, ${weakestTopic.name} generated ${weakestTopic.mistakes} incorrect responses out of ${weakestTopic.possibleMarks} possible questions. Prioritize targeted remedial instruction on this concept.`;
  }

  // Diagnostic Table (Ranked from highest error percentage to lowest)
  const tbody = document.getElementById('conceptAnalysisTableBody');
  tbody.innerHTML = '';

  rankedByStruggle.forEach((topic, idx) => {
    const tr = document.createElement('tr');
    const isWeakest = idx === 0;

    let statusBadge = '<span class="badge badge-success">Mastered</span>';
    if (isWeakest) {
      statusBadge = '<span class="badge badge-danger">Weakest Topic</span>';
    } else if (topic.errorPercentage > 30) {
      statusBadge = '<span class="badge badge-warning">Needs Review</span>';
    }

    tr.innerHTML = `
      <td style="font-weight: 700;">#${idx + 1}</td>
      <td style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${topic.name}</td>
      <td><strong>${topic.averageScore}</strong> <span style="font-size: 0.75rem; color: var(--text-secondary);">/ 10</span></td>
      <td>${topic.totalScore}</td>
      <td>${topic.possibleMarks}</td>
      <td style="font-weight: 600; color: var(--text-body);">${topic.mistakes}</td>
      <td>
        <span style="font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;" class="${isWeakest ? 'text-rose' : ''}">${topic.errorPercentage}%</span>
      </td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  renderConceptRadarChart();
  renderTeachingRecommendations();
}

function renderConceptRadarChart() {
  if (typeof Chart === 'undefined') return;
  const ctxRadar = document.getElementById('chartConceptRadar');
  if (!ctxRadar) return;

  const { topicResults } = appState.analysis;
  if (!topicResults || topicResults.length === 0) return;

  if (appState.charts.radar) {
    appState.charts.radar.destroy();
  }

  const labels = topicResults.map(t => t.name);
  const masteryScores = topicResults.map(t => t.averageScore);

  appState.charts.radar = new Chart(ctxRadar, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Concept Mastery Score (/10)',
        data: masteryScores,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563eb',
        borderWidth: 2.5,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#2563eb',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: '#e2e8f0' },
          grid: { color: '#e2e8f0' },
          pointLabels: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
            color: '#0f172a'
          },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { stepSize: 2, font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}

function renderTeachingRecommendations() {
  const container = document.getElementById('recommendationsList');
  container.innerHTML = '';

  const { weakestTopic, rankedByStruggle } = appState.analysis;
  if (!weakestTopic) return;

  const topicRecs = {
    'loops': [
      {
        icon: '🔁',
        bg: '#fff1f2',
        title: 'Interactive Trace-Table Drill for Nested Loops',
        desc: 'Have students trace variable states across iterations using a visual pen-and-paper matrix to prevent off-by-one and termination mistakes.',
        meta: 'Estimated time: 30 mins • High Impact'
      },
      {
        icon: '🛑',
        bg: '#fff7ed',
        title: 'Boundary & Sentinel Value Walkthroughs',
        desc: 'Review `i < n` versus `i <= n` comparisons and break condition pitfalls with quick 5-minute warm-up questions.',
        meta: 'Estimated time: 15 mins • Core Concept'
      },
      {
        icon: '💻',
        bg: '#eff6ff',
        title: 'Live Debugging Challenge (Find the Infinite Loop)',
        desc: 'Provide 3 short code snippets containing subtle loop condition bugs and have peer groups find and fix them.',
        meta: 'Estimated time: 20 mins • Active Learning'
      }
    ],
    'arrays': [
      {
        icon: '📦',
        bg: '#fff1f2',
        title: 'Zero-Indexed Memory Layout Demonstration',
        desc: 'Visual representation of contiguous memory cells and array index bounds to eliminate out-of-bounds runtime exceptions.',
        meta: 'Estimated time: 25 mins • High Impact'
      },
      {
        icon: '🔍',
        bg: '#fff7ed',
        title: 'Array Traversal & In-Place Modification Labs',
        desc: 'Hands-on practice shifting elements, searching for max/min values, and reversing arrays.',
        meta: 'Estimated time: 20 mins • Practice'
      }
    ],
    'functions': [
      {
        icon: '⚡',
        bg: '#fff1f2',
        title: 'Call Stack & Scope Execution Diagrams',
        desc: 'Draw visual call stack frames showing how arguments are passed and return values resolve back to callers.',
        meta: 'Estimated time: 30 mins • High Impact'
      },
      {
        icon: '🔄',
        bg: '#fff7ed',
        title: 'Pass-by-Value vs Reference Hands-On Workshop',
        desc: 'Demonstrate function side-effects when mutating array structures versus primitive integers.',
        meta: 'Estimated time: 20 mins • Core Concept'
      }
    ]
  };

  const recs = topicRecs[weakestTopic.id] || topicRecs['loops'];

  recs.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="rec-icon" style="background: ${rec.bg}; font-size: 1.1rem;">
        ${rec.icon}
      </div>
      <div>
        <div class="rec-title">${rec.title}</div>
        <div class="rec-desc">${rec.desc}</div>
        <div class="rec-meta">
          <span class="badge badge-neutral">${rec.meta}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// 8. Page 4: Student Records & Search / Sort / Filter
// ==========================================================================

function renderStudentRecords() {
  const { studentSummaries } = appState.analysis;
  const tbody = document.getElementById('studentRecordsTableBody');
  const emptyState = document.getElementById('studentSearchEmpty');

  // Filter counts
  const allCount = studentSummaries.length;
  const supportCount = studentSummaries.filter(s => s.percentage < 60).length;
  const avgCount = studentSummaries.filter(s => s.percentage >= 60 && s.percentage < 80).length;
  const topCount = studentSummaries.filter(s => s.percentage >= 80).length;

  document.getElementById('countFilterAll').textContent = allCount;
  document.getElementById('countFilterSupport').textContent = supportCount;
  document.getElementById('countFilterAvg').textContent = avgCount;
  document.getElementById('countFilterTop').textContent = topCount;

  // Filter by category
  let filtered = studentSummaries.filter(student => {
    if (appState.selectedFilter === 'needs_support') return student.percentage < 60;
    if (appState.selectedFilter === 'average') return student.percentage >= 60 && student.percentage < 80;
    if (appState.selectedFilter === 'top') return student.percentage >= 80;
    return true;
  });

  // Filter by search query
  if (appState.searchQuery.trim() !== '') {
    const q = appState.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(student => (student.name || '').toLowerCase().includes(q));
  }

  // Sort
  filtered.sort((a, b) => {
    switch (appState.sortCriteria) {
      case 'total_desc': return b.total - a.total;
      case 'total_asc': return a.total - b.total;
      case 'name_asc': return (a.name || '').localeCompare(b.name || '');
      case 'name_desc': return (b.name || '').localeCompare(a.name || '');
      case 'loops_asc': return a.loops - b.loops;
      case 'arrays_asc': return a.arrays - b.arrays;
      case 'functions_asc': return a.functions - b.functions;
      default: return b.total - a.total;
    }
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(student => {
    const tr = document.createElement('tr');
    const initials = getInitials(student.name);

    tr.innerHTML = `
      <td>
        <div class="student-col">
          <div class="avatar">${initials}</div>
          <div>
            <div class="student-meta-name">${escapeHtml(student.name || 'Unnamed Student')}</div>
            <div class="student-meta-sub">${student.percentage}% Total Mastery</div>
          </div>
        </div>
      </td>
      <td>
        <strong>${student.arrays}</strong> / 10
      </td>
      <td>
        <strong class="${student.loops <= 4 ? 'text-rose' : ''}">${student.loops}</strong> / 10
      </td>
      <td>
        <strong>${student.functions}</strong> / 10
      </td>
      <td>
        <div style="font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.05rem;">
          ${student.total} <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-secondary);">/ 30</span>
        </div>
      </td>
      <td>
        <span class="badge ${student.tierClass}">${student.tier}</span>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-sm btn-outline btn-inspect-student" data-id="${student.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>View Details</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach inspection handlers
  tbody.querySelectorAll('.btn-inspect-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.dataset.id;
      openStudentModal(studentId);
    });
  });
}

function setupStudentRecordsActions() {
  const searchInput = document.getElementById('studentSearchInput');
  const clearSearchBtn = document.getElementById('btnClearSearch');
  const sortSelect = document.getElementById('studentSortSelect');
  const resetBtn = document.getElementById('btnResetSearch');

  searchInput.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value;
    if (appState.searchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderStudentRecords();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    appState.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderStudentRecords();
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      appState.searchQuery = '';
      appState.selectedFilter = 'all';
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.filter-tab[data-filter="all"]').classList.add('active');
      renderStudentRecords();
    });
  }

  sortSelect.addEventListener('change', (e) => {
    appState.sortCriteria = e.target.value;
    renderStudentRecords();
  });

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      appState.selectedFilter = tab.dataset.filter;
      renderStudentRecords();
    });
  });
}

// ==========================================================================
// 9. Student Detail Modal
// ==========================================================================

function openStudentModal(studentId) {
  const { studentSummaries, studentCount } = appState.analysis;
  const student = studentSummaries.find(s => s.id === studentId);
  if (!student) return;

  const modal = document.getElementById('studentDetailModal');
  document.getElementById('modalStudentAvatar').textContent = getInitials(student.name);
  document.getElementById('modalStudentName').textContent = student.name || 'Student';
  document.getElementById('modalStudentTier').textContent = `Performance Tier: ${student.tier} (${student.percentage}%)`;

  document.getElementById('modalTotalScore').textContent = student.total;
  document.getElementById('modalAccuracy').textContent = `${student.percentage}%`;

  // Calculate Rank in cohort
  const sorted = [...studentSummaries].sort((a, b) => b.total - a.total);
  const rank = sorted.findIndex(s => s.id === studentId) + 1;
  document.getElementById('modalRank').textContent = `#${rank}`;

  // Topic breakdown bars
  const barsContainer = document.getElementById('modalTopicBars');
  barsContainer.innerHTML = '';

  TOPICS.forEach(topic => {
    const score = student[topic.id] || 0;
    const pct = (score / 10) * 100;
    const isWeak = score <= 4;

    const row = document.createElement('div');
    row.innerHTML = `
      <div class="progress-label-row">
        <span><strong>${topic.name}:</strong> ${score} / 10</span>
        <span>${pct.toFixed(0)}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${isWeak ? 'fill-rose' : 'fill-blue'}" style="width: ${pct}%"></div>
      </div>
    `;
    barsContainer.appendChild(row);
  });

  // Dynamic feedback
  const feedbackEl = document.getElementById('modalPersonalizedFeedback');
  let weakest = 'loops';
  let minScore = student.loops;
  if (student.arrays < minScore) { weakest = 'arrays'; minScore = student.arrays; }
  if (student.functions < minScore) { weakest = 'functions'; minScore = student.functions; }

  const tips = {
    'loops': `<strong>Focus Area: Loop Logic & Bounds.</strong> ${student.name.split(' ')[0]} scored lowest in Loops (${student.loops}/10). Recommend 20 minutes of nested iteration tracing exercises.`,
    'arrays': `<strong>Focus Area: Array Indices.</strong> ${student.name.split(' ')[0]} had trouble with Arrays (${student.arrays}/10). Review boundary conditions and off-by-one errors.`,
    'functions': `<strong>Focus Area: Functions & Scope.</strong> ${student.name.split(' ')[0]} scored ${student.functions}/10 in Functions. Recommend practicing parameter passing and return types.`
  };

  feedbackEl.innerHTML = tips[weakest] || tips['loops'];

  // Edit student button
  const editBtn = document.getElementById('btnModalEditStudent');
  editBtn.onclick = () => {
    closeModal();
    switchPage('score-entry');
    const row = document.querySelector(`#scoreEntryTableBody tr[data-id="${studentId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth' });
      const nameInput = row.querySelector('.input-student-name');
      if (nameInput) nameInput.focus();
    }
  };

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('studentDetailModal').classList.add('hidden');
}

function setupModalActions() {
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnModalCloseSecondary').addEventListener('click', closeModal);
  document.getElementById('studentDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'studentDetailModal') closeModal();
  });
}

// ==========================================================================
// 10. Page 5: Reports & PDF Print & CSV Export
// ==========================================================================

function renderReports() {
  const { studentCount, overallAvgOutOf30, grandTotal, maxPossibleGrand, weakestTopic, strongestTopic, passRate, passedStudents, rankedByStruggle, studentSummaries } = appState.analysis;

  document.getElementById('reportClassSize').textContent = `${studentCount} Students`;
  const now = new Date();
  document.getElementById('reportGenDate').textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('repClassAvg').textContent = `${overallAvgOutOf30} / 30`;
  document.getElementById('repWeakestConcept').textContent = weakestTopic ? weakestTopic.name : 'N/A';
  document.getElementById('repWeakestPct').textContent = weakestTopic ? `${weakestTopic.errorPercentage}% Error Rate` : '';
  document.getElementById('repStrongestConcept').textContent = strongestTopic ? strongestTopic.name : 'N/A';
  document.getElementById('repStrongestPct').textContent = strongestTopic ? `${strongestTopic.errorPercentage}% Error Rate` : '';
  document.getElementById('repPassRate').textContent = `${passRate}%`;
  document.getElementById('repPassRateFoot').textContent = `${passedStudents} of ${studentCount} students passed`;

  // Revision Table in Report
  const revBody = document.getElementById('reportRevisionTableBody');
  revBody.innerHTML = '';

  rankedByStruggle.forEach((topic, idx) => {
    const tr = document.createElement('tr');
    let priorityBadge = '<span class="badge badge-success">Low</span>';
    let action = 'Self-paced review exercises';
    let time = '15 mins';

    if (idx === 0) {
      priorityBadge = '<span class="badge badge-danger">High (Urgent)</span>';
      action = 'Instructor-led lecture review & trace tables';
      time = '45 mins';
    } else if (idx === 1) {
      priorityBadge = '<span class="badge badge-warning">Medium</span>';
      action = 'Small group debugging lab';
      time = '30 mins';
    }

    tr.innerHTML = `
      <td>${priorityBadge}</td>
      <td style="font-weight: 700;">${topic.name}</td>
      <td>${topic.averageScore} / 10</td>
      <td>${topic.mistakes} / ${topic.possibleMarks}</td>
      <td style="font-weight: 700;" class="${idx === 0 ? 'text-rose' : ''}">${topic.errorPercentage}%</td>
      <td>${action}</td>
      <td><strong>${time}</strong></td>
    `;
    revBody.appendChild(tr);
  });

  // Student Score Summary in Report
  const repStudBody = document.getElementById('reportStudentTableBody');
  repStudBody.innerHTML = '';

  studentSummaries.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td style="font-weight: 600;">${escapeHtml(s.name || 'Student')}</td>
      <td>${s.arrays}</td>
      <td>${s.loops}</td>
      <td>${s.functions}</td>
      <td style="font-weight: 700;">${s.total} / 30</td>
      <td>${s.percentage}%</td>
      <td><span class="badge ${s.tierClass}">${s.tier}</span></td>
    `;
    repStudBody.appendChild(tr);
  });
}

function setupReportActions() {
  document.getElementById('btnDownloadCsvReport').addEventListener('click', exportCsv);
  document.getElementById('btnPrintReport').addEventListener('click', () => {
    window.print();
  });
}

function exportCsv() {
  const { studentCount, topicResults, weakestTopic, studentSummaries } = appState.analysis;

  let csv = 'ConceptRadar — Classroom Diagnostic Report\n';
  csv += `Generated On: ${new Date().toISOString()}\n`;
  csv += `Total Students: ${studentCount}\n`;
  csv += `Weakest Topic: ${weakestTopic ? weakestTopic.name : 'None'} (${weakestTopic ? weakestTopic.errorPercentage : 0}% Error Rate)\n\n`;

  // Section 1: Concept Diagnostics
  csv += 'TOPIC PERFORMANCE BREAKDOWN\n';
  csv += 'Topic Name,Average Score (out of 10),Total Marks,Possible Marks,Mistakes,Error Percentage (%)\n';
  topicResults.forEach(t => {
    csv += `"${t.name}",${t.averageScore},${t.totalScore},${t.possibleMarks},${t.mistakes},${t.errorPercentage}%\n`;
  });

  csv += '\nSTUDENT INDIVIDUAL ROSTER\n';
  csv += 'Student Name,Arrays Score,Loops Score,Functions Score,Total Score (out of 30),Percentage (%),Performance Tier\n';
  studentSummaries.forEach(s => {
    csv += `"${escapeCsv(s.name)}",${s.arrays},${s.loops},${s.functions},${s.total},${s.percentage}%,${s.tier}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `conceptradar-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Downloaded analytics CSV report!', 'success');
}

// ==========================================================================
// 11. Toast Notifications & Helpers
// ==========================================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function getInitials(name) {
  if (!name || !name.trim()) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsv(str) {
  return String(str || '').replace(/"/g, '""');
}

// ==========================================================================
// 12. Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupScoreEntryActions();
  setupStudentRecordsActions();
  setupModalActions();
  setupReportActions();

  // Load state and compute initial analytics
  loadState();
});
