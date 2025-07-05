/**
 * resultsDashboard.js
 * Main controller for the survey results dashboard
 */

import { getResults, getQuestionDefinitions } from './resultsDataService.js';
import { createRadioVisualization } from './visualizations/radioVisualizer.js';
import { createCheckboxVisualization } from './visualizations/checkboxVisualizer.js';
import { createTextSummary } from './visualizations/textVisualizer.js';
import { createMatrixVisualization } from './visualizations/matrixVisualizer.js';
import { createSliderVisualization } from './visualizations/sliderVisualizer.js';
import { createRankVisualization } from './visualizations/rankVisualizer.js';
import { getVisualizationPreferences, saveVisualizationPreference } from './admin/visualizationSettings.js';

// Question type constants
const QUESTION_TYPES = {
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    SHORT_TEXT: 'shortText',
    LONG_TEXT: 'longText',
    MATRIX_2D: 'matrix2d',
    MULTI_VALUE_SLIDER: 'multiValueSlider',
    RANK_OPTIONS: 'rankOptions'
};

// Visualization type options by question type
const VISUALIZATION_TYPES = {
    [QUESTION_TYPES.RADIO]: ['pie', 'doughnut', 'horizontalBar', 'verticalBar'],
    [QUESTION_TYPES.CHECKBOX]: ['horizontalBar', 'verticalBar', 'stackedBar', 'radar'],
    [QUESTION_TYPES.MATRIX_2D]: ['heatmap', 'groupedBar', 'radar', 'bubble'],
    [QUESTION_TYPES.MULTI_VALUE_SLIDER]: ['histogram', 'boxplot', 'line'],
    [QUESTION_TYPES.RANK_OPTIONS]: ['rankedOrder', 'stackedPositions', 'horizontalBar', 'verticalBar'],
    [QUESTION_TYPES.SHORT_TEXT]: ['wordcloud', 'list'],
    [QUESTION_TYPES.LONG_TEXT]: ['wordcloud', 'list']
};

// Default visualization types
const DEFAULT_VISUALIZATION = {
    [QUESTION_TYPES.RADIO]: 'pie',
    [QUESTION_TYPES.CHECKBOX]: 'horizontalBar',
    [QUESTION_TYPES.MATRIX_2D]: 'heatmap',
    [QUESTION_TYPES.MULTI_VALUE_SLIDER]: 'histogram',
    [QUESTION_TYPES.RANK_OPTIONS]: 'rankedOrder',
    [QUESTION_TYPES.SHORT_TEXT]: 'list',
    [QUESTION_TYPES.LONG_TEXT]: 'wordcloud'
};

// State management
let questionDefinitions = [];
let surveyResults = [];
let currentFilters = {
    dateRange: 'all',
    industry: [],
    orgSize: []
};

// Wizard navigation state
let currentStepIndex = 0;
let stepIds = [];
let questionsByStep = {};

// DOM elements
const resultsContainer = document.getElementById('results-container');
const totalResponsesElement = document.getElementById('total-responses');
const lastResponseDateElement = document.getElementById('last-response-date');
const applyFiltersButton = document.getElementById('apply-filters');
const resetFiltersButton = document.getElementById('reset-filters');
const adminPanelElement = document.getElementById('admin-panel');
const industryFilterContainer = document.getElementById('industry-filter-container');
const orgSizeFilterContainer = document.getElementById('org-size-filter-container');

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    try {
        // Show loading state
        resultsContainer.innerHTML = '<div class="loading-indicator"><p>Loading survey results...</p></div>';
        
        // Fetch question definitions and results
        [questionDefinitions, surveyResults] = await Promise.all([
            getQuestionDefinitions(),
            getResults()
        ]);
        
        // Update overview statistics
        updateOverviewStats();
        
        // Setup filters
        setupFilters();
        
        // Render results
        renderResults();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check if admin and show admin controls
        checkAndSetupAdmin();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        resultsContainer.innerHTML = `<div class="error-message">
            <p>Failed to load survey results. Please try again later.</p>
            <p>Error: ${error.message}</p>
        </div>`;
    }
}

/**
 * Update overview statistics
 */
function updateOverviewStats() {
    // Update response count
    totalResponsesElement.textContent = surveyResults.length;
    
    // Find the most recent response
    if (surveyResults.length > 0) {
        const dates = surveyResults.map(r => new Date(r.completedAt || r.lastModified));
        const mostRecent = new Date(Math.max(...dates));
        lastResponseDateElement.textContent = mostRecent.toLocaleDateString();
    }
    
    // Update overview stats section
    const overviewStats = document.querySelector('.overview-stats');
    
    // Calculate some high-level statistics
    const stats = calculateOverviewStats();
    
    overviewStats.innerHTML = Object.entries(stats).map(([key, value]) => `
        <div class="stat-card">
            <h3>${key}</h3>
            <div class="stat-value">${value.value}</div>
            ${value.subtext ? `<div class="stat-subtext">${value.subtext}</div>` : ''}
        </div>
    `).join('');
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats() {
    // Find industry distribution
    const industries = {};
    let topIndustry = { name: 'Unknown', count: 0 };
    
    surveyResults.forEach(response => {
        const industry = response.responses?.industry?.value;
        if (industry) {
            industries[industry] = (industries[industry] || 0) + 1;
            if (industries[industry] > topIndustry.count) {
                topIndustry = { name: industry, count: industries[industry] };
            }
        }
    });
    
    // Find organization size distribution
    const orgSizes = {};
    let topOrgSize = { name: 'Unknown', count: 0 };
    
    surveyResults.forEach(response => {
        const orgSize = response.responses?.orgSize?.value;
        if (orgSize) {
            orgSizes[orgSize] = (orgSizes[orgSize] || 0) + 1;
            if (orgSizes[orgSize] > topOrgSize.count) {
                topOrgSize = { name: orgSize, count: orgSizes[orgSize] };
            }
        }
    });
    
    // Format industry name for display
    let formattedIndustryName = topIndustry.name;
    
    // Look up industry label from question definition
    const industryQuestion = questionDefinitions.find(q => q.id === 'industry');
    if (industryQuestion && industryQuestion.options) {
        const industryOption = industryQuestion.options.find(opt => opt.value === topIndustry.name);
        if (industryOption) {
            formattedIndustryName = industryOption.label;
        }
    }
    
    // Format org size name for display
    let formattedOrgSizeName = topOrgSize.name;
    
    // Look up org size label from question definition
    const orgSizeQuestion = questionDefinitions.find(q => q.id === 'orgSize');
    if (orgSizeQuestion && orgSizeQuestion.options) {
        const orgSizeOption = orgSizeQuestion.options.find(opt => opt.value === topOrgSize.name);
        if (orgSizeOption) {
            formattedOrgSizeName = orgSizeOption.label;
        }
    }
    
    return {
        'Total Responses': {
            value: surveyResults.length,
            subtext: 'responses collected'
        },
        'Top Industry': {
            value: formattedIndustryName,
            subtext: `${topIndustry.count} responses (${Math.round((topIndustry.count / surveyResults.length) * 100)}%)`
        },
        'Top Organization Size': {
            value: formattedOrgSizeName,
            subtext: `${topOrgSize.count} responses (${Math.round((topOrgSize.count / surveyResults.length) * 100)}%)`
        },
        'Avg. Cloud ROI': {
            value: calculateAverageROI() + '%',
            subtext: 'average reported ROI'
        }
    };
}

/**
 * Calculate average ROI from responses
 */
function calculateAverageROI() {
    let totalROI = 0;
    let roiCount = 0;
    
    surveyResults.forEach(response => {
        if (response.responses?.roi?.value) {
            totalROI += Number(response.responses.roi.value);
            roiCount++;
        }
    });
    
    return roiCount > 0 ? Math.round(totalROI / roiCount) : 0;
}

/**
 * Setup filter controls
 */
function setupFilters() {
    // Setup industry filter
    const industryQuestion = questionDefinitions.find(q => q.id === 'industry');
    if (industryQuestion && industryQuestion.options) {
        industryFilterContainer.innerHTML = `
            <label for="industry-filter">Industry</label>
            <select id="industry-filter" multiple>
                ${industryQuestion.options.map(option => `
                    <option value="${option.value}">${option.label}</option>
                `).join('')}
            </select>
        `;
    }
    
    // Setup org size filter
    const orgSizeQuestion = questionDefinitions.find(q => q.id === 'orgSize');
    if (orgSizeQuestion && orgSizeQuestion.options) {
        orgSizeFilterContainer.innerHTML = `
            <label for="org-size-filter">Organization Size</label>
            <select id="org-size-filter" multiple>
                ${orgSizeQuestion.options.map(option => `
                    <option value="${option.value}">${option.label}</option>
                `).join('')}
            </select>
        `;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Apply filters
    applyFiltersButton.addEventListener('click', () => {
        // Get filter values
        const dateRangeFilter = document.getElementById('date-range').value;
        const industryFilter = Array.from(document.getElementById('industry-filter')?.selectedOptions || [])
            .map(option => option.value);
        const orgSizeFilter = Array.from(document.getElementById('org-size-filter')?.selectedOptions || [])
            .map(option => option.value);
        
        // Update current filters
        currentFilters = {
            dateRange: dateRangeFilter,
            industry: industryFilter,
            orgSize: orgSizeFilter
        };
        
        // Re-render results with filters
        renderResults();
    });
    
    // Reset filters
    resetFiltersButton.addEventListener('click', () => {
        // Reset filter controls
        document.getElementById('date-range').value = 'all';
        
        const industryFilterElement = document.getElementById('industry-filter');
        if (industryFilterElement) {
            Array.from(industryFilterElement.options).forEach(option => {
                option.selected = false;
            });
        }
        
        const orgSizeFilterElement = document.getElementById('org-size-filter');
        if (orgSizeFilterElement) {
            Array.from(orgSizeFilterElement.options).forEach(option => {
                option.selected = false;
            });
        }
        
        // Reset current filters
        currentFilters = {
            dateRange: 'all',
            industry: [],
            orgSize: []
        };
        
        // Re-render results
        renderResults();
    });
}

/**
 * Apply filters to results data
 * @param {Array} results - Survey results
 * @returns {Array} - Filtered results
 */
function applyFilters(results) {
    return results.filter(response => {
        // Date range filter
        if (currentFilters.dateRange !== 'all') {
            const responseDate = new Date(response.completedAt || response.lastModified);
            const now = new Date();
            let cutoffDate;
            
            switch (currentFilters.dateRange) {
                case 'week':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'quarter':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
            }
            
            if (responseDate < cutoffDate) {
                return false;
            }
        }
        
        // Industry filter
        if (currentFilters.industry.length > 0) {
            const industry = response.responses?.industry?.value;
            if (!industry || !currentFilters.industry.includes(industry)) {
                return false;
            }
        }
        
        // Org size filter
        if (currentFilters.orgSize.length > 0) {
            const orgSize = response.responses?.orgSize?.value;
            if (!orgSize || !currentFilters.orgSize.includes(orgSize)) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Render survey results in wizard format
 */
function renderResults() {
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Filter results
    const filteredResults = applyFilters(surveyResults);
    
    // Update overview stats with filtered results
    updateOverviewStats();
    
    // Group questions by step
    questionsByStep = groupQuestionsByStep();
    
    // Get an array of step IDs to use for navigation
    stepIds = Object.keys(questionsByStep);
    
    // If no steps or steps is empty, show a message
    if (stepIds.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No questions found or no responses match the current filters.</p>
            </div>
        `;
        return;
    }
    
    // Create wizard container
    const wizardContainer = document.createElement('div');
    wizardContainer.className = 'results-wizard';
    
    // Create progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'wizard-progress';
    
    // Create progress dots
    const progressDots = document.createElement('div');
    progressDots.className = 'progress-dots';
    
    stepIds.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'progress-dot';
        dot.setAttribute('data-step', index);
        dot.title = `Step ${index + 1} ${questionsByStep[stepIds[index]].title}`;
        
        // Add click event to jump to step
        dot.addEventListener('click', () => navigateToStep(index));
        
        progressDots.appendChild(dot);
    });
    
    progressContainer.appendChild(progressDots);
    
    // Create step navigation
    const wizardNavigation = document.createElement('div');
    wizardNavigation.className = 'wizard-navigation';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.id = 'prev-step';
    prevButton.className = 'nav-button prev';
    prevButton.innerHTML = '<span class="nav-arrow">←</span> Previous Step';
    prevButton.addEventListener('click', navigateToPrevStep);
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.id = 'next-step';
    nextButton.className = 'nav-button next';
    nextButton.innerHTML = 'Next Step <span class="nav-arrow">→</span>';
    nextButton.addEventListener('click', navigateToNextStep);
    
    // Step counter
    const stepCounter = document.createElement('div');
    stepCounter.className = 'step-counter';
    stepCounter.id = 'step-counter';
    
    wizardNavigation.appendChild(prevButton);
    wizardNavigation.appendChild(stepCounter);
    wizardNavigation.appendChild(nextButton);
    
    // Create step content container
    const stepContentContainer = document.createElement('div');
    stepContentContainer.className = 'step-content-container';
    stepContentContainer.id = 'step-content';
    
    // Assemble the wizard
    wizardContainer.appendChild(progressContainer);
    wizardContainer.appendChild(stepContentContainer);
    wizardContainer.appendChild(wizardNavigation);
    
    resultsContainer.appendChild(wizardContainer);
    
    // Initialize the first step (or the current step if already set)
    currentStepIndex = Math.min(currentStepIndex, stepIds.length - 1);
    renderCurrentStep(filteredResults);
}

/**
 * Render the current step content
 * @param {Array} filteredResults - Filtered survey responses
 */
function renderCurrentStep(filteredResults) {
    // Get the current step ID and step data
    const stepId = stepIds[currentStepIndex];
    const step = questionsByStep[stepId];
    
    // Get the step content container
    const stepContentContainer = document.getElementById('step-content');
    stepContentContainer.innerHTML = '';
    
    // Create step header
    const stepHeader = document.createElement('div');
    stepHeader.className = 'wizard-step-header';
    stepHeader.innerHTML = `
        <h2 class="step-title">
            <span class="step-badge">${currentStepIndex + 1}</span>
            ${step.title}
        </h2>
    `;
    
    // Add step description if available
    if (step.description) {
        const stepDescription = document.createElement('p');
        stepDescription.className = 'step-description';
        stepDescription.textContent = step.description;
        stepHeader.appendChild(stepDescription);
    }
    
    stepContentContainer.appendChild(stepHeader);
    
    // Render each question in the step
    step.questions.forEach(question => {
        const questionResultElement = renderQuestionResult(question, filteredResults);
        if (questionResultElement) {
            stepContentContainer.appendChild(questionResultElement);
        }
    });
    
    // Update progress dots
    updateProgressDots();
    
    // Update step counter
    updateStepCounter();
    
    // Update navigation buttons
    updateNavigationButtons();
}

/**
 * Update the progress dots to reflect the current step
 */
function updateProgressDots() {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentStepIndex);
        dot.classList.toggle('completed', index < currentStepIndex);
    });
}

/**
 * Update the step counter display
 */
function updateStepCounter() {
    const stepCounter = document.getElementById('step-counter');
    stepCounter.textContent = `Step ${currentStepIndex + 1} of ${stepIds.length}`;
}

/**
 * Update the navigation buttons based on current step
 */
function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    
    // Disable/enable previous button
    prevButton.disabled = currentStepIndex === 0;
    
    // Update next button text and state
    if (currentStepIndex === stepIds.length - 1) {
        nextButton.innerHTML = 'Finish <span class="nav-arrow">→</span>';
        nextButton.classList.add('finish');
    } else {
        nextButton.innerHTML = 'Next Step <span class="nav-arrow">→</span>';
        nextButton.classList.remove('finish');
    }
}

/**
 * Navigate to a specific step by index
 * @param {number} stepIndex - The index of the step to navigate to
 */
function navigateToStep(stepIndex) {
    // Validate index
    if (stepIndex < 0 || stepIndex >= stepIds.length) return;
    
    // Update current step index
    currentStepIndex = stepIndex;
    
    // Render the new step
    renderCurrentStep(applyFilters(surveyResults));
}

/**
 * Navigate to the previous step
 */
function navigateToPrevStep() {
    if (currentStepIndex > 0) {
        navigateToStep(currentStepIndex - 1);
    }
}

/**
 * Navigate to the next step or finish
 */
function navigateToNextStep() {
    if (currentStepIndex < stepIds.length - 1) {
        navigateToStep(currentStepIndex + 1);
    } else {
        // Handle finish action (e.g., show summary or return to first step)
        currentStepIndex = 0;
        renderCurrentStep(applyFilters(surveyResults));
    }
}

/**
 * Group questions by their parent step
 * @returns {Object} - Questions grouped by step
 */
function groupQuestionsByStep() {
    const steps = {};
    
    questionDefinitions.forEach(question => {
        const stepId = question.stepId || 'unknown';
        
        if (!steps[stepId]) {
            // Find step info from the first question's metadata
            const stepInfo = {
                id: stepId,
                title: question.stepTitle || `Step ${stepId}`,
                description: question.stepDescription || '',
                questions: []
            };
            
            steps[stepId] = stepInfo;
        }
        
        steps[stepId].questions.push(question);
    });
    
    return steps;
}

/**
 * Render a single question's results
 * @param {Object} question - Question definition
 * @param {Array} results - Survey results
 * @returns {HTMLElement} - Question result element
 */
function renderQuestionResult(question, results) {
    // Skip questions without an ID or type
    if (!question.id || !question.type) return null;
    
    // Create container for question result
    const questionResult = document.createElement('div');
    questionResult.className = 'question-result';
    questionResult.id = `result-${question.id}`;
    
    // Add question title and description
    questionResult.innerHTML = `
        <div class="question-header">
            <h3>${question.title}</h3>
            ${question.description ? `<p class="description">${question.description}</p>` : ''}
        </div>
    `;
    
    // Get visualization preferences
    const visualizationPreferences = getVisualizationPreferences();
    const preferredType = visualizationPreferences[question.id]?.type || 
                         (question.visualization?.type || DEFAULT_VISUALIZATION[question.type]);
    
    // Create visualization container
    const visualizationContainer = document.createElement('div');
    visualizationContainer.className = 'visualization-container';
    visualizationContainer.id = `viz-${question.id}`;
    
    // Add visualization toolbar for admins
    const isAdmin = checkIfAdmin();
    if (isAdmin) {
        const toolbar = createVisualizationToolbar(question, preferredType);
        questionResult.appendChild(toolbar);
    }
    
    questionResult.appendChild(visualizationContainer);
    
    // Extract responses for this question
    const questionResponses = results.map(response => {
        return response.responses && response.responses[question.id] 
            ? response.responses[question.id].value 
            : null;
    }).filter(Boolean);
    
    // Generate visualization based on question type
    try {
        switch (question.type) {
            case QUESTION_TYPES.RADIO:
                createRadioVisualization(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            case QUESTION_TYPES.CHECKBOX:
                createCheckboxVisualization(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            case QUESTION_TYPES.SHORT_TEXT:
            case QUESTION_TYPES.LONG_TEXT:
                createTextSummary(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            case QUESTION_TYPES.MATRIX_2D:
                createMatrixVisualization(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            case QUESTION_TYPES.MULTI_VALUE_SLIDER:
                createSliderVisualization(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            case QUESTION_TYPES.RANK_OPTIONS:
                createRankVisualization(
                    visualizationContainer, 
                    questionResponses, 
                    question, 
                    preferredType
                );
                break;
                
            default:
                visualizationContainer.innerHTML = `
                    <p class="no-visualization">No visualization available for question type: ${question.type}</p>
                `;
        }
    } catch (error) {
        console.error(`Error rendering visualization for question ${question.id}:`, error);
        visualizationContainer.innerHTML = `
            <p class="visualization-error">Error rendering visualization: ${error.message}</p>
        `;
    }
    
    return questionResult;
}

/**
 * Create the visualization toolbar
 * @param {Object} question - Question definition
 * @param {string} currentType - Current visualization type
 * @returns {HTMLElement} - Toolbar element
 */
function createVisualizationToolbar(question, currentType) {
    const toolbar = document.createElement('div');
    toolbar.className = 'visualization-toolbar';
    
    // Only show the type selector if there are options for this question type
    const options = VISUALIZATION_TYPES[question.type];
    if (options && options.length > 0) {
        const selector = document.createElement('div');
        selector.className = 'visualization-type-selector';
        
        selector.innerHTML = `
            <label for="viz-type-${question.id}">Chart Type:</label>
            <select id="viz-type-${question.id}">
                ${options.map(option => `
                    <option value="${option}" ${option === currentType ? 'selected' : ''}>
                        ${formatVisualizationType(option)}
                    </option>
                `).join('')}
            </select>
        `;
        
        // Add change event listener
        const selectElement = selector.querySelector(`#viz-type-${question.id}`);
        selectElement.addEventListener('change', (e) => {
            const newType = e.target.value;
            
            // Save preference
            saveVisualizationPreference(question.id, newType);
            
            // Re-render this question's visualization
            const container = document.getElementById(`viz-${question.id}`);
            container.innerHTML = ''; // Clear container
            
            // Re-create visualization with the new type
            switch (question.type) {
                case QUESTION_TYPES.RADIO:
                    createRadioVisualization(container, getResponsesForQuestion(question.id), question, newType);
                    break;
                case QUESTION_TYPES.CHECKBOX:
                    createCheckboxVisualization(container, getResponsesForQuestion(question.id), question, newType);
                    break;
                case QUESTION_TYPES.SHORT_TEXT:
                case QUESTION_TYPES.LONG_TEXT:
                    createTextSummary(container, getResponsesForQuestion(question.id), question, newType);
                    break;
                case QUESTION_TYPES.MATRIX_2D:
                    createMatrixVisualization(container, getResponsesForQuestion(question.id), question, newType);
                    break;
                case QUESTION_TYPES.MULTI_VALUE_SLIDER:
                    createSliderVisualization(container, getResponsesForQuestion(question.id), question, newType);
                    break;
                case QUESTION_TYPES.RANK_OPTIONS:
                    createRankVisualization(container, getResponsesForQuestion(question.id), question, newType);
                    break;
            }
        });
        
        toolbar.appendChild(selector);
    }
    
    return toolbar;
}

/**
 * Get all responses for a specific question
 * @param {string} questionId - Question ID
 * @returns {Array} - Array of responses
 */
function getResponsesForQuestion(questionId) {
    // Apply current filters to the results
    const filteredResults = applyFilters(surveyResults);
    
    return filteredResults.map(response => {
        return response.responses && response.responses[questionId] 
            ? response.responses[questionId].value 
            : null;
    }).filter(Boolean);
}

/**
 * Format visualization type for display
 * @param {string} type - Visualization type
 * @returns {string} - Formatted type
 */
function formatVisualizationType(type) {
    return type
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between words
}

/**
 * Check if the current user is an admin and set up admin panel
 */
function checkAndSetupAdmin() {
    if (checkIfAdmin()) {
        setupAdminPanel();
    } else {
        // Hide admin panel
        adminPanelElement.style.display = 'none';
    }
}

/**
 * Check if the current user has admin privileges
 * @returns {boolean} - True if the user is an admin
 */
function checkIfAdmin() {
    // For now, always return true for demonstration purposes
    // In a real app, this would check user permissions
    return true;
}

/**
 * Set up the admin panel
 */
function setupAdminPanel() {
    adminPanelElement.innerHTML = `
        <h3>Admin Controls</h3>
        <div class="admin-actions">
            <button id="export-viz-settings" class="btn accent">Export Visualization Settings</button>
            <button id="import-viz-settings" class="btn secondary">Import Settings</button>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('export-viz-settings').addEventListener('click', exportVisualizationSettings);
    document.getElementById('import-viz-settings').addEventListener('click', importVisualizationSettings);
}

/**
 * Export visualization settings
 */
function exportVisualizationSettings() {
    const preferences = getVisualizationPreferences();
    
    // Convert to survey definition format
    const visualizationSettings = {};
    
    Object.entries(preferences).forEach(([questionId, pref]) => {
        visualizationSettings[questionId] = {
            visualization: {
                type: pref.type,
                options: pref.options || {}
            }
        };
    });
    
    // Format as JSON
    const settingsJson = JSON.stringify(visualizationSettings, null, 2);
    
    // Create a download link
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visualization-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Visualization settings exported. You can now copy these settings into your survey definition file.');
}

/**
 * Import visualization settings
 */
function importVisualizationSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const settings = JSON.parse(event.target.result);
                
                // Process and save settings
                Object.entries(settings).forEach(([questionId, data]) => {
                    if (data.visualization && data.visualization.type) {
                        saveVisualizationPreference(questionId, data.visualization.type, data.visualization.options);
                    }
                });
                
                // Re-render results
                renderResults();
                
                alert('Visualization settings imported successfully.');
            } catch (error) {
                console.error('Error importing settings:', error);
                alert('Error importing settings: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    });
    
    input.click();
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);
