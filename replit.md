# FRA Atlas - Forest Rights Administration

## Overview

FRA Atlas is a production-ready web application for managing forest rights claims with OCR processing capabilities. The system provides an interactive mapping interface, document processing with OCR and NLP, comprehensive claim management, and analytics dashboard. Built with a modern full-stack architecture, it serves as a centralized platform for forest rights administration across regions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and developer experience
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system using CSS variables for consistent theming
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mapping**: React-Leaflet with Leaflet Draw for interactive mapping and boundary drawing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js for REST API server
- **Language**: TypeScript throughout for end-to-end type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Processing**: Multer for handling file uploads with size and type restrictions
- **Shared Types**: Common schema definitions shared between frontend and backend

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema**: Drizzle schema with proper relations between users, claims, and uploaded files
- **File Storage**: Local filesystem storage for uploaded documents
- **Geospatial Data**: PostGIS support for storing boundary geometry as GeoJSON

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User System**: Basic user authentication with username/password
- **Role-Based Access**: User-based claim ownership and management

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Maps**: Multiple tile layer providers (OpenStreetMap, Esri World Imagery)
- **OCR Processing**: Mock OCR service ready for integration with EasyOCR/TrOCR and spaCy
- **Development Tools**: Vite for development server with HMR, Replit-specific plugins for development environment
- **UI Components**: Extensive Radix UI component library for accessibility
- **Validation**: Zod for runtime type validation
- **Date Handling**: date-fns for date manipulation
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer