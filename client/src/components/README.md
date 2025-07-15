# BuildBoss Component Documentation

This directory contains all React components for the BuildBoss application, organized by feature and type. All components are built with TypeScript and follow consistent design patterns.

## 📁 Directory Structure

```
components/
├── analytics/          # Analytics and reporting components
├── auth/               # Authentication related components
├── common/             # Shared/reusable components
├── companies/          # Company management components
├── jobs/               # Job posting and management
├── layout/             # Layout and navigation components
├── legal/              # Legal documents and compliance
├── materials/          # Material management components
├── messages/           # Messaging and communication
├── notifications/      # Notification components
├── projects/           # Project management components
├── reports/            # Report generation components
├── search/             # Search and filtering components
├── tasks/              # Task management components
└── ui/                 # Base UI components (buttons, cards, etc.)
```

## 🎨 UI Components (`ui/`)

Base building blocks with consistent styling and behavior:

### Button Component
```tsx
import { Button } from './ui/Button';

// Basic usage
<Button>Click me</Button>

// Variants and sizes
<Button variant="primary" size="lg">Save Changes</Button>
<Button variant="danger" loading={isDeleting}>Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

**Features:**
- 5 visual variants (primary, secondary, danger, outline, white)
- 3 sizes (sm, md, lg)
- Loading state with spinner
- Full accessibility support

### Card Components
```tsx
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Project Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <p>This project involves construction of a new office building.</p>
  </CardContent>
</Card>
```

**Features:**
- Flexible container with consistent styling
- Composable header/content structure
- Interactive card support with onClick
- 3 padding sizes (sm, md, lg)

### Badge Component
```tsx
import { Badge } from './ui/Badge';

<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="danger">Overdue</Badge>
```

**Features:**
- 5 semantic color variants
- Perfect for status indicators and counts
- Accessible contrast ratios

### Modal Component
```tsx
import { Modal } from './ui/Modal';

<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  size="lg"
>
  <p>Are you sure you want to delete this project?</p>
</Modal>
```

**Features:**
- Backdrop blur and smooth animations
- Keyboard navigation (Esc to close)
- Click-outside-to-close
- 5 responsive sizes
- Full accessibility support

### Breadcrumbs Component
```tsx
import Breadcrumbs from './ui/Breadcrumbs';

<Breadcrumbs 
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Office Building', current: true }
  ]} 
/>
```

**Features:**
- React Router integration
- Accessibility compliant navigation
- Current page indication

## 🌍 Common Components (`common/`)

Shared components used across features:

### OptimizedImage Component
```tsx
import { OptimizedImage } from './common/OptimizedImage';

<OptimizedImage
  src="/images/project-photo.jpg"
  alt="Construction project overview"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  className="rounded-lg"
/>
```

**Features:**
- WebP/AVIF format support with fallbacks
- Responsive image sizing with srcset
- Lazy loading with Intersection Observer
- Progressive loading with placeholders
- Error handling with fallback images
- 60-80% size reduction compared to standard images

### LanguageSelector Component
```tsx
import { LanguageSelector } from './common/LanguageSelector';

// Standard usage
<LanguageSelector />

// Compact mode for toolbars
<LanguageSelector compact showLabel={false} />
```

**Features:**
- 4 language support (Polish, English, German, Ukrainian)
- Persistent selection in localStorage
- react-i18next integration
- Full accessibility support
- Dark mode compatible

### AddressAutocomplete Component
```tsx
import { AddressAutocomplete } from './common/AddressAutocomplete';

<AddressAutocomplete
  value={address}
  onChange={setAddress}
  placeholder="Enter address"
  required
/>
```

**Features:**
- Google Places API integration
- Real-time address suggestions
- Geocoding support
- Form integration ready

## 🏗️ Business Components

### Project Components (`projects/`)

#### ProjectCard
```tsx
import { ProjectCard } from './projects/ProjectCard';

<ProjectCard
  project={projectData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  canEdit={userCanEdit}
/>
```

**Features:**
- Comprehensive project information display
- Progress tracking with visual indicators
- Status and priority badges
- Task statistics overview
- Interactive edit/delete actions

#### ProjectForm
```tsx
import { ProjectForm } from './projects/ProjectForm';

<ProjectForm
  project={existingProject} // Optional for edit mode
  companyId={companyId}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Features:**
- Create and edit project functionality
- Form validation and error handling
- Date picker integration
- Status and priority selection
- Budget and location fields

### Task Components (`tasks/`)

#### TaskCard
```tsx
import { TaskCard } from './tasks/TaskCard';

<TaskCard
  task={taskData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
  canEdit={userCanEdit}
/>
```

**Features:**
- Task information display
- Status change functionality
- Priority and deadline indicators
- Assignment information
- Progress tracking

## 🔧 Development Guidelines

### Component Structure
All components follow this structure:
```tsx
import React from 'react';

/**
 * Component description with examples
 * 
 * @component
 * @example
 * ```tsx
 * <MyComponent prop="value" />
 * ```
 */
interface ComponentProps {
  /** Prop description */
  prop: string;
}

export const MyComponent: React.FC<ComponentProps> = ({ prop }) => {
  return <div>{prop}</div>;
};
```

### Documentation Standards
- **JSDoc comments** for all components and interfaces
- **@component** tag for component documentation
- **@example** sections with practical usage
- **@param** descriptions for all props
- **@returns** description of rendered output
- **@features** list for complex components
- **@accessibility** notes where applicable

### TypeScript Requirements
- All components use TypeScript interfaces for props
- Props are properly typed and documented
- Optional props have default values
- Generic types used where appropriate

### Styling Conventions
- Tailwind CSS for all styling
- Consistent color palette using CSS custom properties
- Responsive design with mobile-first approach
- Dark mode support where applicable
- Accessibility-compliant color contrasts

### Testing Approach
- Jest and React Testing Library for unit tests
- Component testing focuses on user interactions
- Accessibility testing included
- Mock external dependencies (APIs, services)

## 🎯 Usage Examples

### Form Components
```tsx
// Complete form with validation
<form onSubmit={handleSubmit}>
  <Card>
    <CardHeader>
      <CardTitle>Create New Project</CardTitle>
    </CardHeader>
    <CardContent>
      <ProjectForm
        companyId={companyId}
        onSubmit={handleProjectCreate}
        onCancel={() => setShowForm(false)}
      />
    </CardContent>
  </Card>
</form>
```

### List Components
```tsx
// Project listing with cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => (
    <ProjectCard
      key={project.id}
      project={project}
      onEdit={handleEdit}
      onDelete={handleDelete}
      canEdit={userPermissions.canEdit}
    />
  ))}
</div>
```

### Interactive Modals
```tsx
// Confirmation modal with actions
<Modal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  title="Delete Project"
  size="md"
>
  <div className="space-y-4">
    <p>Are you sure you want to delete "{selectedProject?.name}"?</p>
    <div className="flex gap-3">
      <Button 
        variant="danger" 
        onClick={handleConfirmDelete}
        loading={isDeleting}
      >
        Delete Project
      </Button>
      <Button 
        variant="outline" 
        onClick={() => setShowDeleteModal(false)}
      >
        Cancel
      </Button>
    </div>
  </div>
</Modal>
```

## 📝 Contributing

When adding new components:

1. **Choose the correct directory** based on component purpose
2. **Add comprehensive JSDoc** documentation
3. **Include practical examples** in documentation
4. **Follow TypeScript** interface patterns
5. **Ensure accessibility** compliance
6. **Add responsive design** considerations
7. **Test component** thoroughly
8. **Update this README** if adding new categories

## 🔗 Related Documentation

- [API Documentation](../../../docs/API_DOCUMENTATION.md)
- [PWA Guide](../../../docs/PWA_GUIDE.md)
- [Image Optimization Guide](../../../docs/IMAGE_OPTIMIZATION_GUIDE.md)
- [Bundle Analysis Guide](../../../docs/BUNDLE_ANALYSIS_GUIDE.md) 