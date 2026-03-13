
# Course File Manager Frontend

This is a complete, production-ready frontend for a Course File Manager web app.
Built with React, Tailwind CSS, and Shadcn UI.

## Features

- **Authentication**: Login, Signup, and Forgot Password pages with form validation.
- **Dashboard**: KPI cards, recent activity list, and analytics charts.
- **Courses**: Manage courses with a data table, search, and add/edit modals.
- **Files**: File manager with Grid/List views, filtering, and mock download actions.
- **Upload**: Drag & drop file upload with progress simulation.
- **Reports**: Visual analytics using Recharts.
- **Settings**: Profile management, password change, and Dark Mode toggle.

## Tech Stack

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (Radix Primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Routing**: react-router-dom

## Project Structure

- `src/components/layout`: Sidebar, Header, and main Layout components.
- `src/components/ui`: Reusable UI components (buttons, inputs, cards, etc.).
- `src/pages`: Page components (Dashboard, Courses, Auth, etc.).
- `src/lib/dummy-data.ts`: Mock data used throughout the application.

## Integration Guide

To connect this frontend to a backend:

1.  **API Calls**: Replace the mock data in `src/lib/dummy-data.ts` with actual API calls using `fetch` or `@tanstack/react-query`.
2.  **Authentication**: Update `src/pages/auth/Login.tsx` to send credentials to your auth endpoint.
3.  **File Upload**: Modify `src/pages/dashboard/Upload.tsx` to send `FormData` to your file upload endpoint.
4.  **Charts**: Fetch real analytics data in `src/pages/dashboard/Reports.tsx`.

## Customization

- **Colors**: Edit the HSL color variables in `src/index.css` to change the theme.
- **Branding**: Update the logo and app name in `src/components/layout/Sidebar.tsx`.
