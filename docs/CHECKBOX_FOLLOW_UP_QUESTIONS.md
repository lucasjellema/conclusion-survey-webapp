# Checkbox-Specific Follow-Up Questions

This document explains how to use the checkbox-specific follow-up questions feature in the cloud-survey-app.

## Overview

The checkbox-specific follow-up questions feature allows you to dynamically show specific questions when a checkbox option is selected, and hide them when the option is unchecked. This creates a more interactive and streamlined survey experience, where users only see relevant questions based on their specific selections.

## How It Works

When a user checks an option in a checkbox question, any questions linked to that specific option will be dynamically inserted into the survey. If the user later unchecks the option, those linked questions will be removed with a smooth animation.

## Configuration

To add a follow-up question for a specific checkbox option, use the following structure in your survey JSON:

```json
{
  "id": "follow_up_question_id",
  "type": "any_question_type",
  "title": "Question about {{option}}",
  "description": "More details about {{option}}",
  "linkedQuestionId": "checkbox_question_id",
  "forOptionId": "specific_option_id"
}
```

### Required Properties

- **id**: Unique identifier for the follow-up question
- **type**: Any valid question type (shortText, longText, checkbox, etc.)
- **linkedQuestionId**: The ID of the checkbox question this follow-up is linked to
- **forOptionId**: The specific option value that triggers this question

### Template Variables

You can use the following template variables in your question title and description:

- **{{option}}**: Will be replaced with the label of the checkbox option

## Example

This example shows a checkbox question about challenges, with follow-up questions for specific options:

```json
{
  "id": "challenges",
  "type": "checkbox",
  "title": "Which challenges has your organization faced?",
  "options": [
    { "value": "cost", "label": "Cost management" },
    { "value": "skills", "label": "Skills gap" }
  ]
},
{
  "id": "cost_details",
  "type": "shortText",
  "title": "How much has {{option}} impacted your organization?",
  "description": "Provide details about {{option}} issues",
  "linkedQuestionId": "challenges",
  "forOptionId": "cost"
}
```

When the user checks "Cost management," a follow-up question will appear with the title "How much has Cost management impacted your organization?"

## Best Practices

1. **Keep follow-ups focused**: Make sure each follow-up question is specifically related to its parent checkbox option.
2. **Use templating**: Utilize the `{{option}}` template variable to personalize the question text.
3. **Consider nesting**: You can create checkbox questions as follow-ups to other checkbox options for deeper hierarchies.
4. **Animation**: Follow-up questions appear and disappear with subtle animations to enhance user experience.

## Technical Notes

- Follow-up questions are managed via custom events (`checkbox-option-change`)
- Template processing happens dynamically when questions are rendered
- The system ensures proper positioning of follow-up questions in the survey flow
