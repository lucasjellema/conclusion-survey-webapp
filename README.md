# Cloud Survey Application

A secure, cloud-based survey application that provides dynamic question rendering with Microsoft Entra ID (Azure AD) authentication. This application allows organizations to create, deploy, and collect responses to sophisticated surveys with various question types.

## Features

- **Diverse Question Types**: Support for multiple question formats including text, radio, checkbox, Likert scales, ranking, and more
- **Microsoft Entra ID Authentication**: Secure user authentication via MSAL.js
- **Responsive Design**: Clean UI that works across devices
- **Advanced Question Rendering**: Specialized renderers for complex question types
- **Rich Text Support**: Enhanced text input with formatting options
- **Comment Fields**: Optional comment capability for any question type
- **Data Persistence**: Secure saving of survey responses with authentication
- **Modular Architecture**: Well-organized ES Modules structure for maintainability
- **Admin Capabilities**: Management interface for survey data and user responses

## Project Structure

```
/
├── index.html         - Main HTML file with application structure
├── styles.css         - General application styling
├── survey-styles.css  - Survey-specific styling
├── js/
│   ├── app.js         - Main application module
│   ├── auth.js        - Authentication module for Entra ID integration
│   ├── authConfig.js  - Authentication configuration
│   ├── dataConfig.js  - Data endpoint configuration
│   ├── dataService.js - Data fetching and persistence service
│   ├── surveyData.js  - Survey data management
│   ├── ui.js          - UI management module
│   ├── questionRenderers.js           - Base question rendering module
│   ├── questionRenderersExtended.js   - Extended question type renderers (Likert, Range, Matrix)
│   ├── questionRenderersRank.js       - Ranking question renderers
│   └── questionRenderersTags.js       - Tag-based question renderers
└── README.md          - This documentation file
```

## Survey Question Types

The application supports the following question types:

| Question Type | Description | Module |
|--------------|------------|--------|
| Short Text | Single-line text input | `questionRenderers.js` |
| Long Text | Rich text editor with formatting options | `questionRenderers.js` |
| Radio | Single-select option list with optional "Other" field | `questionRenderers.js` |
| Checkbox | Multi-select option list with optional "Other" field | `questionRenderers.js` |
| Likert Scale | Rating scale with customizable points | `questionRenderersExtended.js` |
| Range Slider | Slider for selecting numeric values in a range | `questionRenderersExtended.js` |
| Matrix 2D | Grid-based selection with rows and columns | `questionRenderersExtended.js` |
| Rank Options | Drag-and-drop ranking of options | `questionRenderersRank.js` |
| Tags | Tag-based selection and categorization | `questionRenderersTags.js` |

## Setup Instructions

### Prerequisites

- A Microsoft Azure account with permissions to register applications
- A registered application in the Microsoft Entra ID portal (Azure AD)
- A valid API endpoint for fetching authenticated data (for example on a API Gateway)
- A valid API endpoint for fetching user-specific data (for example on a API Gateway)

### Configuration

1. Register an application in the [Azure Portal](https://portal.azure.com):
   - Navigate to Microsoft Entra ID (Azure Active Directory)
   - Go to App Registrations and create a new registration
   - Set the redirect URI to match your deployment URL
   - Note the Application (client) ID and Directory (tenant) ID

2. Update `js/authConfig.js` with your application's details:
   - Replace the `clientId` with your application's client ID
   - If using a specific tenant, update the `authority` value with your tenant ID

3. Serve the application:
   - Use a local development server during development
   - For production, deploy to any static web hosting service - for example GitHub Pages

## Usage

### Taking a Survey

1. Open the application and authenticate with Microsoft Entra ID
2. Navigate through the survey sections
3. Complete questions of various types:
   - Enter text in short and long text fields
   - Select options from radio button and checkbox groups
   - Rate items on Likert scales
   - Use sliders to indicate values within ranges
   - Arrange items in rank order by dragging and dropping
   - Add tags to categorize responses
4. Add optional comments to questions when needed
5. Submit the survey after completion

### Administration

1. Access the admin section with appropriate authentication
2. View and download survey response data
3. Manage delta files for data synchronization
4. View aggregated survey analytics

## Development Principles

This project follows these development principles:

1. **Modular Code**: Uses ES Modules to break up functionality into logical units
2. **Size Limitations**: JavaScript files are kept under 200 lines for maintainability
3. **No Magic Values**: Constants are used instead of hardcoded values
4. **Documentation**: Comprehensive comments explain what the code does

## Authentication and Security

- ID tokens are stored in memory only, not in browser storage
- The application follows security best practices for authentication
- Authentication state is not persisted between browser sessions
- API requests include bearer tokens in Authorization headers
- Preflight requests are automatically handled by the browser for authenticated API calls with custom headers
- Data modification is secured with authenticated PUT requests
- User data changes are timestamped with lastModified property
- Admin functionality uses role-based access control (configurable)
- Admin API calls require proper authentication and custom headers

## Customization

The survey application can be extended in several ways:

1. **Add New Question Types**: Create new renderer modules for additional question formats
2. **Custom Styling**: Modify survey-styles.css for organization-specific branding
3. **Enhanced Validation**: Add custom validation rules for specific question types
4. **Data Export**: Implement export functionality for survey results
5. **Response Analytics**: Add visualization components for survey data analysis
6. **Conditional Logic**: Implement question branching based on previous responses



## License

This project is available for use under the MIT License.
