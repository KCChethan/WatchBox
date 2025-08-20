# Device Monitor

## Overview

Device Monitor is a fullstack web application designed to manage and monitor network devices across an organization. The application provides real-time device monitoring capabilities, allowing users to view device status, manage availability states, and coordinate device usage through an integrated access request system. Built with modern web technologies, it offers an intuitive interface for tracking device information including IP addresses, software versions, uptime, and current usage status.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Colorful, creative, dark-themed UI with innovative visual elements instead of rectangular layouts.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with custom styling via Tailwind CSS
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom CSS variables for theming, dark mode support
- **Real-time Updates**: WebSocket integration for live device status updates

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **Middleware**: Express middleware for request logging, JSON parsing, and error handling
- **Development**: Hot reloading with Vite integration in development mode

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Connection**: Neon Database serverless PostgreSQL integration
- **Fallback Storage**: In-memory storage implementation for development/testing

### Database Schema
- **Devices Table**: Stores device information including IP addresses, status, version, uptime, current user, and online status
- **Access Requests Table**: Manages user requests to access devices with approval workflow

### Authentication and Authorization
- Currently implements session-based approach with PostgreSQL session storage via connect-pg-simple
- No explicit user authentication system in current implementation (designed for internal network use)

### External Service Integrations
- **SSH Integration**: SSH service (ssh2) for fetching device information (version, uptime, connectivity). Uses `SSH_USERNAME` and `SSH_PASSWORD` env vars.
- **Real-time Communication**: WebSocket server for broadcasting device status changes
- **Development Tools**: Replit integration for development environment

### API Architecture
- **Device Management**: CRUD operations for devices with real-time status updates
- **Access Request System**: Workflow for requesting and managing device access permissions
- **SSH Data Fetching**: Endpoints for refreshing device information via SSH connections
- **WebSocket Events**: Real-time broadcasting of device state changes and access requests

### Security Considerations
- SSH credentials stored in environment variables
- CORS and security headers implementation
- Session-based request handling
- Input validation using Zod schemas

### Scalability and Performance
- **Caching**: TanStack Query provides intelligent client-side caching
- **Real-time Updates**: WebSocket connections for efficient live updates
- **Database**: PostgreSQL with connection pooling support
- **Build Optimization**: Vite for fast development and optimized production builds

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: React 18+ with TypeScript support
- **Vite**: Build tool and development server with hot module replacement
- **Express.js**: Web application framework for Node.js backend

### Database and ORM
- **PostgreSQL**: Primary database (Neon Database serverless)
- **Drizzle ORM**: Type-safe database toolkit with schema management
- **Drizzle Kit**: Migration and schema synchronization tool

### UI and Styling
- **Radix UI**: Accessible component library for React
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **Zod**: Schema validation and type inference

### Real-time Communication
- **WebSocket (ws)**: WebSocket server implementation for real-time updates

### Development and Build Tools
- **TypeScript**: Type-safe JavaScript development
- **PostCSS**: CSS processing and autoprefixing
- **ESBuild**: Fast JavaScript bundler for production builds

### Routing and Navigation
- **Wouter**: Lightweight router for React applications

### Session Management
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

### SSH Integration
- ssh2-based SSH service to fetch `/version` and uptime; falls back to a mock in development if SSH is unavailable.

### Development Environment
- **Replit**: Cloud development environment integration
- **Runtime Error Overlay**: Development debugging tools

## Running locally

1. Install dependencies: `npm install`
2. Create a `.env` file with values:
   - `PORT=5000`
   - `SSH_USERNAME=admin`
   - `SSH_PASSWORD=yourpassword`
   - `SSH_TIMEOUT_MS=5000`
   - `DATABASE_URL=postgres://user:pass@host:5432/dbname` (optional)
3. Start dev server: `npm run dev`
4. Open the printed URL; UI and API are served together, WebSocket at `/ws`.

Production preview:
- `npm run build`
- `npm start`