# Device Monitor

## Overview

Device Monitor is a fullstack web application designed to manage and monitor network devices across an organization. The application provides real-time device monitoring capabilities, allowing users to view device status, manage availability states, and coordinate device usage through an integrated access request system. Built with modern web technologies, it offers an intuitive interface for tracking device information including IP addresses, software versions, uptime, and current usage status.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **SSH Integration**: Mock SSH service for fetching device information (version, uptime, connectivity)
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
- Mock SSH service implementation (production would use ssh2 library)

### Development Environment
- **Replit**: Cloud development environment integration
- **Runtime Error Overlay**: Development debugging tools