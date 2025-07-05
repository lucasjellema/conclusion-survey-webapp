/**
 * textVisualizer.js
 * Visualization component for text questions (short and long)
 * 
 * This module creates visualizations and summaries for text-based responses
 * including word clouds, response lists, and basic statistics.
 */

import { aggregateTextResponses } from '../resultsDataService.js';

/**
 * Create a visualization/summary for text question responses
 * @param {HTMLElement} container - The DOM element to render the visualization in
 * @param {Array} responses - Array of question responses
 * @param {Object} question - The question definition
 * @param {string} [type='list'] - Type of visualization ('list', 'wordcloud')
 */
export function createTextSummary(container, responses, question, type = 'list') {
    if (!container || !Array.isArray(responses) || responses.length === 0) {
        container.innerHTML = '<p class="no-data">No data available for this question.</p>';
        return;
    }
    
    // Aggregate responses
    const aggregatedData = aggregateTextResponses(responses);
    
    // Don't render if no data
    if (aggregatedData.totalResponses === 0) {
        container.innerHTML = '<p class="no-data">No responses for this question yet.</p>';
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Add statistics section
    const stats = document.createElement('div');
    stats.className = 'text-statistics';
    stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${aggregatedData.totalResponses}</div>
            <div class="stat-label">Total Responses</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${aggregatedData.averageLength}</div>
            <div class="stat-label">Avg. Length (chars)</div>
        </div>
    `;
    container.appendChild(stats);
    
    // Render appropriate visualization based on type
    switch (type) {
        case 'wordcloud':
            renderWordCloud(container, aggregatedData, question);
            break;
        case 'list':
            renderResponseList(container, aggregatedData, question);
            break;
        default:
            renderResponseList(container, aggregatedData, question);
    }
}

/**
 * Render a word cloud visualization
 * @param {HTMLElement} container - Container element
 * @param {Object} data - Aggregated data
 * @param {Object} question - Question definition
 */
function renderWordCloud(container, data, question) {
    const wordcloudContainer = document.createElement('div');
    wordcloudContainer.className = 'wordcloud-container';
    wordcloudContainer.style.height = '300px';
    wordcloudContainer.style.position = 'relative';
    
    // Add placeholder for wordcloud libraries
    // In a production environment, you would use a dedicated word cloud library
    // like d3-cloud or wordcloud2.js
    
    // Since we don't want to add external dependencies for this example,
    // we'll create a simple visual representation
    
    // Sort words by frequency
    const words = [...data.topWords].sort((a, b) => b.weight - a.weight);
    
    // Calculate maximum weight for scaling
    const maxWeight = Math.max(...words.map(w => w.weight));
    
    // Create simple word cloud visualization
    const simpleCloud = document.createElement('div');
    simpleCloud.className = 'simple-wordcloud';
    simpleCloud.style.display = 'flex';
    simpleCloud.style.flexWrap = 'wrap';
    simpleCloud.style.justifyContent = 'center';
    simpleCloud.style.alignItems = 'center';
    simpleCloud.style.padding = '20px';
    
    words.forEach(word => {
        const wordElement = document.createElement('span');
        const fontSize = Math.max(14, Math.min(48, 14 + (word.weight / maxWeight) * 34));
        const opacity = 0.5 + (word.weight / maxWeight) * 0.5;
        
        wordElement.textContent = word.text;
        wordElement.style.fontSize = `${fontSize}px`;
        wordElement.style.padding = '5px 8px';
        wordElement.style.margin = '5px';
        wordElement.style.color = `rgba(74, 134, 232, ${opacity})`;
        wordElement.style.fontWeight = fontSize > 25 ? 'bold' : 'normal';
        wordElement.title = `${word.text}: ${word.weight} occurrences`;
        
        simpleCloud.appendChild(wordElement);
    });
    
    wordcloudContainer.appendChild(simpleCloud);
    container.appendChild(wordcloudContainer);
    
    // Add note about word cloud
    const note = document.createElement('p');
    note.className = 'wordcloud-note';
    note.textContent = 'Word cloud shows the most frequent words from all responses, with larger words appearing more frequently.';
    note.style.fontSize = '12px';
    note.style.color = '#666';
    note.style.textAlign = 'center';
    note.style.marginTop = '10px';
    container.appendChild(note);
}

/**
 * Render a list of responses
 * @param {HTMLElement} container - Container element
 * @param {Object} data - Aggregated data
 * @param {Object} question - Question definition
 */
function renderResponseList(container, data, question) {
    const listContainer = document.createElement('div');
    listContainer.className = 'response-list-container';
    
    // Top words section
    const topWordsContainer = document.createElement('div');
    topWordsContainer.className = 'top-words';
    topWordsContainer.innerHTML = '<h4>Common Terms</h4>';
    
    const topWordsList = document.createElement('div');
    topWordsList.className = 'top-words-list';
    
    // Display top 10 words with their counts
    const topWords = data.topWords.slice(0, 10);
    
    topWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        wordItem.innerHTML = `
            <span class="word-text">${word.text}</span>
            <span class="word-count">(${word.weight})</span>
            <div class="word-bar" style="width: ${Math.max(20, word.weight * 10)}px;"></div>
        `;
        
        topWordsList.appendChild(wordItem);
    });
    
    topWordsContainer.appendChild(topWordsList);
    listContainer.appendChild(topWordsContainer);
    
    // Sample responses section
    if (data.responses && data.responses.length > 0) {
        const samplesContainer = document.createElement('div');
        samplesContainer.className = 'sample-responses';
        samplesContainer.innerHTML = '<h4>Sample Responses</h4>';
        
        const responsesList = document.createElement('ul');
        responsesList.className = 'responses-list';
        
        data.responses.forEach(response => {
            const listItem = document.createElement('li');
            listItem.className = 'response-item';
            
            // Sanitize response - in a real app you would use a proper sanitizer like DOMPurify
            const sanitizedResponse = response
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            listItem.innerHTML = sanitizedResponse;
            responsesList.appendChild(listItem);
        });
        
        samplesContainer.appendChild(responsesList);
        listContainer.appendChild(samplesContainer);
    }
    
    // Show more responses button
    if (data.totalResponses > data.responses.length) {
        const moreButton = document.createElement('button');
        moreButton.className = 'btn secondary more-responses';
        moreButton.textContent = `Show All ${data.totalResponses} Responses`;
        
        moreButton.addEventListener('click', () => {
            // In a real app, this would fetch more responses
            // For now, just show a message
            alert(`In a real implementation, this would show all ${data.totalResponses} responses.`);
        });
        
        listContainer.appendChild(moreButton);
    }
    
    container.appendChild(listContainer);
}
