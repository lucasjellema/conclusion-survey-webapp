/**
 * rangeSliderVisualizer.js
 * 
 * This module renders a visualization for 'rangeSlider' question types.
 * It displays a histogram of the responses.
 */

const rangeSliderVisualizer = {
  /**
   * Renders the visualization for a range slider question.
   * @param {HTMLElement} container - The container to render the visualization in.
   * @param {Object} question - The question object from the survey definition.
   * @param {Array} responses - An array of response objects for this question.
   */
  render: function(container, question, responses) {
    if (!question.rangeSlider) {
      container.innerHTML = '<p>Question is missing rangeSlider configuration.</p>';
      return;
    }

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const labels = [];
    const min = question.rangeSlider.min || 0;
    const max = question.rangeSlider.max || 100;
    const step = question.rangeSlider.step || 1;

    for (let i = min; i <= max; i += step) {
      labels.push(i.toString());
    }

    const data = new Array(labels.length).fill(0);
    responses.forEach(response => {
      const value = parseInt(response.value, 10);
      const index = Math.round((value - min) / step);
      if (index >= 0 && index < data.length) {
        data[index]++;
      }
    });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Responses',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          },
          x: {
            title: {
              display: true,
              text: question.title
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Distribution of Responses for "${question.title}"`
          }
        }
      }
    });
  }
};

export default rangeSliderVisualizer;
