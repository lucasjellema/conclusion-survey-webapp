/**
 * resultsDataService.js
 * Service for retrieving and processing survey results data
 * 
 * This module is designed to be generic and work with any survey structure,
 * retrieving both the survey definition and results data.
 */

import { getData } from '../../js/dataService.js';

// Cache for survey definition and results
let surveyDefinitionCache = null;
let surveyResultsCache = null;

/**
 * Get survey definition with questions and steps
 * @returns {Promise<Array>} Array of question definitions
 */
export async function getQuestionDefinitions() {
    if (surveyDefinitionCache) {
        return surveyDefinitionCache;
    }
    
    try {
        // Load survey definition from file/API
        // For demo purposes, we're loading from a static file path
        // In production, this would come from an API endpoint
        const response = await fetch('../js/data/sampleSurvey.json');
        const surveyData = await response.json();
        
        if (!surveyData || !surveyData.steps) {
            console.error('Invalid survey definition format');
            return [];
        }
        
        // Extract all questions from all steps and add step information to each question
        const questions = [];
        
        surveyData.steps.forEach(step => {
            if (step.questions && Array.isArray(step.questions)) {
                step.questions.forEach(question => {
                    // Add step info to the question for context
                    questions.push({
                        ...question,
                        stepId: step.id,
                        stepTitle: step.title,
                        stepDescription: step.description
                    });
                });
            }
        });
        
        // Cache results
        surveyDefinitionCache = questions;
        return questions;
    } catch (error) {
        console.error('Error loading survey definition:', error);
        return [];
    }
}

/**
 * Get survey results
 * @param {boolean} [forceRefresh=false] Force refresh from source
 * @returns {Promise<Array>} Array of survey responses
 */
export async function getResults(forceRefresh = false) {
    if (surveyResultsCache && !forceRefresh) {
        return surveyResultsCache;
    }
    
    try {
        // For demo purposes, we're loading from a static file
        // In production, this would come from getData() from dataService.js
        // which fetches from an API endpoint
        
        // Try to get data from the actual API first
        try {
            const apiData = await getData(forceRefresh);
            if (apiData && apiData.responses && Array.isArray(apiData.responses)) {
                // Format might be different based on API structure
                surveyResultsCache = apiData.responses;
                return surveyResultsCache;
            }
        } catch (apiError) {
            console.log('API data not available, falling back to sample data:', apiError);
        }
        
        // Fall back to sample data
        const response = await fetch('../js/data/sampleSurveyResponse.json');
        const data = await response.json();
        
        if (!data || !data.responses || !Array.isArray(data.responses)) {
            console.error('Invalid survey results format');
            return [];
        }
        
        // Cache results
        surveyResultsCache = data.responses;
        return data.responses;
    } catch (error) {
        console.error('Error loading survey results:', error);
        return [];
    }
}

/**
 * Get aggregated data for a radio question
 * @param {Array} responses - Question responses
 * @param {Object} question - Question definition
 * @returns {Object} Aggregated data ready for visualization
 */
export function aggregateRadioResponses(responses, question) {
    // Count occurrences of each option
    const counts = {};
    let total = 0;
    
    // Initialize counts for all options
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
            counts[option.value] = 0;
        });
    }
    
    // Count responses
    responses.forEach(response => {
        const value = response;
        if (value) {
            counts[value] = (counts[value] || 0) + 1;
            total++;
        }
    });
    
    // Convert to arrays for visualization
    const labels = [];
    const data = [];
    const colors = [];
    
    // Default color palette
    const defaultColors = [
        '#4a86e8', '#6aa84f', '#e69138', '#8e63ce', '#d5573b',
        '#45818e', '#a64d79', '#674ea7', '#990000', '#0c343d'
    ];
    
    Object.entries(counts).forEach(([value, count], index) => {
        // Find label for this value
        let label = value;
        if (question.options && Array.isArray(question.options)) {
            const option = question.options.find(opt => opt.value === value);
            if (option && option.label) {
                label = option.label;
            }
        }
        
        labels.push(label);
        data.push(count);
        colors.push(defaultColors[index % defaultColors.length]);
    });
    
    return {
        labels,
        data,
        colors,
        total,
        percentages: data.map(value => total > 0 ? Math.round((value / total) * 100) : 0)
    };
}

/**
 * Get aggregated data for a checkbox question
 * @param {Array} responses - Question responses
 * @param {Object} question - Question definition
 * @returns {Object} Aggregated data ready for visualization
 */
export function aggregateCheckboxResponses(responses, question) {
    // Count occurrences of each option
    const counts = {};
    let totalResponses = responses.length;
    
    // Initialize counts for all options
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
            counts[option.value] = 0;
        });
    }
    
    // Process responses - these can be arrays or objects depending on format
    responses.forEach(response => {
        if (Array.isArray(response)) {
            // Array format: ['option1', 'option2']
            response.forEach(value => {
                if (typeof value === 'string') {
                    counts[value] = (counts[value] || 0) + 1;
                } else if (value && value.isOther && value.otherValue) {
                    counts['other'] = (counts['other'] || 0) + 1;
                }
            });
        } else if (typeof response === 'object' && response !== null) {
            // Object format: { option1: true, option2: true }
            Object.entries(response).forEach(([key, value]) => {
                if (value === true && key !== 'other') {
                    counts[key] = (counts[key] || 0) + 1;
                } else if (key === 'other' && (value === true || typeof value === 'string')) {
                    counts['other'] = (counts['other'] || 0) + 1;
                }
            });
        }
    });
    
    // Convert to arrays for visualization
    const labels = [];
    const data = [];
    const percentages = [];
    
    Object.entries(counts).forEach(([value, count]) => {
        // Find label for this value
        let label = value;
        if (question.options && Array.isArray(question.options)) {
            const option = question.options.find(opt => opt.value === value);
            if (option && option.label) {
                label = option.label;
            }
        }
        
        labels.push(label);
        data.push(count);
        percentages.push(totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0);
    });
    
    return {
        labels,
        data,
        percentages,
        totalResponses
    };
}

/**
 * Get aggregated data for a text question
 * @param {Array} responses - Question responses
 * @returns {Object} Aggregated data ready for visualization
 */
export function aggregateTextResponses(responses) {
    // Filter out empty responses
    const validResponses = responses.filter(response => 
        response && typeof response === 'string' && response.trim() !== '');
    
    // Calculate statistics
    const totalResponses = validResponses.length;
    const averageLength = totalResponses > 0 
        ? Math.round(validResponses.reduce((sum, text) => sum + text.length, 0) / totalResponses) 
        : 0;
    
    // Word frequency analysis
    const wordCounts = {};
    const commonWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'is', 'are', 'was', 'were']);
    
    validResponses.forEach(text => {
        // Tokenize and count words (simple implementation)
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/);        // Split on whitespace
        
        words.forEach(word => {
            if (word && word.length > 2 && !commonWords.has(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });
    
    // Get top words
    const topWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ text: word, weight: count }));
    
    return {
        totalResponses,
        averageLength,
        topWords,
        responses: validResponses.slice(0, 5) // Only include a few sample responses
    };
}

/**
 * Get aggregated data for a matrix question
 * @param {Array} responses - Question responses
 * @param {Object} question - Question definition
 * @returns {Object} Aggregated data ready for visualization
 */
export function aggregateMatrixResponses(responses, question) {
    // Initialize data structure
    const rows = question.matrix?.rows || [];
    const columns = question.matrix?.columns || [];
    const totals = {};
    
    // Initialize counts matrix
    const counts = {};
    rows.forEach(row => {
        counts[row.id] = {};
        columns.forEach(col => {
            counts[row.id][col.id] = 0;
        });
    });
    
    // Count responses
    responses.forEach(response => {
        if (typeof response !== 'object' || response === null) return;
        
        Object.entries(response).forEach(([rowId, colId]) => {
            if (counts[rowId] && counts[rowId][colId] !== undefined) {
                counts[rowId][colId]++;
                
                // Track totals for percentages
                totals[rowId] = (totals[rowId] || 0) + 1;
            }
        });
    });
    
    // Calculate percentages
    const percentages = {};
    rows.forEach(row => {
        percentages[row.id] = {};
        columns.forEach(col => {
            const rowTotal = totals[row.id] || 0;
            percentages[row.id][col.id] = rowTotal > 0 
                ? Math.round((counts[row.id][col.id] / rowTotal) * 100) 
                : 0;
        });
    });
    
    return {
        rows,
        columns,
        counts,
        percentages,
        totalResponses: responses.length
    };
}

/**
 * Get aggregated data for a multi-value slider question
 * @param {Array} responses - Question responses
 * @param {Object} question - Question definition
 * @returns {Object} Aggregated data ready for visualization
 */
export function aggregateSliderResponses(responses, question) {
    // Get all possible options/sliders
    const options = [];
    
    // Try to extract options from responses
    const validResponses = responses.filter(r => r && typeof r === 'object' && r.value);
    
    // If we have values in the response, use those to determine options
    if (validResponses.length > 0) {
        const firstResponse = validResponses[0].value;
        
        if (typeof firstResponse === 'object') {
            Object.keys(firstResponse).forEach(key => {
                if (key !== 'comment') {
                    options.push(key);
                }
            });
        }
    }
    
    // If we couldn't extract options from responses, try from the question definition
    if (options.length === 0 && question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
            options.push(option.value);
        });
    }
    
    // Calculate averages and ranges for each option
    const statistics = {};
    
    options.forEach(option => {
        // Collect all values for this option
        const values = [];
        
        validResponses.forEach(response => {
            const value = response.value[option];
            if (typeof value === 'number') {
                values.push(value);
            }
        });
        
        // Calculate statistics
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / values.length);
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            // Store statistics
            statistics[option] = {
                average: avg,
                min,
                max,
                count: values.length
            };
        } else {
            statistics[option] = {
                average: 0,
                min: 0,
                max: 0,
                count: 0
            };
        }
    });
    
    return {
        options,
        statistics,
        totalResponses: validResponses.length
    };
}

/**
 * Clear the data cache
 */
export function clearCache() {
    surveyDefinitionCache = null;
    surveyResultsCache = null;
}
