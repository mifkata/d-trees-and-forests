# Frontend Layout

## Overview
Page structure and component composition for the training interface.

## Requirements
- Next.js App Router layout with metadata
- Inter font from Google Fonts
- Responsive container with max-width constraint
- Loading skeleton while hydrating from localStorage
- Single-page application with vertically stacked sections

## Root Layout
- HTML document with Inter font
- Metadata title: "D-Trees & Random Forests"
- Body renders page children directly

## Page Composition

**Header**: Page title "D-Trees & Random Forests"

**Main Content**: Two-column layout on desktop, stacked on mobile.

**Left Column (Form)**:
- DatasetSelector and ModelSelector in a row
- DatasetParams with mask slider, impute checkbox, use cached checkbox, generate images checkbox, and reset button
- ModelParams renders the appropriate form based on selected model type, with reset button
- TrainButton, disabled during training with loading indicator

**Right Column (Output)**:
- ErrorDisplay (dismissible) when training fails
- ResultsDisplay when training succeeds
- Empty state or placeholder when no results yet

## Hydration
Skeleton placeholder shown until client hydration completes, preventing flash of default values before localStorage loads. Skeleton mimics the layout structure with animated gray blocks.

## State Management
- useParamsCache: manages dataset, model, and parameters with localStorage persistence
- useTraining: manages loading state, results, and errors
- Parameters cached per dataset+model combination

## Related specs
- [frontend/Form](Form.md) - Form input components
- [frontend/Output](Output.md) - Results and error display
