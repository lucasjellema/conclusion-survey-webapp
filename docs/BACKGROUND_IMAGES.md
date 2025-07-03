# Background Images for Survey Steps

This document explains how to use background images for survey steps in the cloud-survey-app.

## Overview

You can enhance the visual appearance of survey steps by adding background images. These images are displayed with a configurable opacity to ensure the content remains readable.

## Configuration

To add a background image to a survey step, add a `backgroundImage` property to the step object in your survey JSON:

```json
{
  "id": "step1",
  "title": "Step Title",
  "description": "Step description",
  "backgroundImage": {
    "url": "https://example.com/path/to/image.jpg",
    "opacity": "light",
    "position": "center"
  },
  "questions": [
    // ... questions go here
  ]
}
```

### Properties

- **url** (required): The URL to the background image. Can be an absolute URL or a relative path to an image in your project.
- **opacity** (optional): Controls how transparent the background image appears.
  - `"light"`: Very faint background (10% opacity)
  - `"medium"`: Moderate visibility (20% opacity)
  - `"heavy"`: More prominent background (30% opacity)
  - If omitted, defaults to 15% opacity
- **position** (optional): Controls the positioning of the background image.
  - `"center"`: Centers the image (default)
  - `"top"`: Positions the image at the top
  - `"bottom"`: Positions the image at the bottom

## Best Practices

1. **Choose appropriate images** - Use images that complement the content of the step without distracting from it.
2. **Consider contrast** - Ensure there's enough contrast between the text and the background image for good readability.
3. **File size** - Use optimized images to reduce load times, preferably under 300KB.
4. **Aspect ratio** - Images with a landscape orientation (wider than tall) work best.

## Examples

### Example 1: Simple Center-Positioned Image

```json
"backgroundImage": {
  "url": "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
  "opacity": "light"
}
```

### Example 2: Bottom-Positioned Image with Medium Opacity

```json
"backgroundImage": {
  "url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
  "opacity": "medium",
  "position": "bottom"
}
```

## Troubleshooting

- **Image not appearing**: Verify the image URL is correct and accessible.
- **Text hard to read**: Try using a lighter opacity setting or choose an image with less visual complexity.
- **Performance issues**: Optimize the image file size or use a content delivery network (CDN).
