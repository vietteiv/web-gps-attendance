# GPS Attendance System

Modern GPS Attendance Platform

Enterprise-grade GPS Attendance system built with Next.js 15, Supabase
and Prisma. Designed for SaaS from day one.

Next.js TypeScript React Supabase Prisma TailwindCSS License

------------------------------------------------------------------------

## Overview

GPS Attendance System là nền tảng chấm công bằng GPS dành cho doanh
nghiệp, được xây dựng theo kiến trúc hiện đại, cloud-native và sẵn sàng
mở rộng thành sản phẩm SaaS.

Hệ thống tập trung vào:

- 📍 GPS Check-in / Check-out
- 🤳 Selfie Verification
- 👥 Employee Management
- 📊 Real-time Dashboard
- ☁️ Cloud Deployment
- 🏢 Multi-Tenant Architecture

------------------------------------------------------------------------

# Preview

    Employee
         │
         ▼
     Browser / Mobile
         │
     GPS + Camera
         │
         ▼
     Next.js 15
         │
     Server Actions / API
         │
         ▼
     Prisma ORM
         │
         ▼
     PostgreSQL (Supabase)
         │
         ├──────── Attendance
         ├──────── Employee
         ├──────── Company
         └──────── Settings

     Images
         │
         ▼
     Supabase Storage

------------------------------------------------------------------------

# Features

## Authentication

- Secure Login
- Session Management
- Protected Routes
- Role-based Authorization

------------------------------------------------------------------------

## Employee Management

- Employee CRUD
- Search
- Department
- Status Management

------------------------------------------------------------------------

## GPS Attendance

- GPS Permission
- Distance Validation
- Check In
- Check Out
- Office Radius
- Attendance History

------------------------------------------------------------------------

## Selfie Verification

- Camera Capture
- Image Compression
- Image Upload
- Attendance Photo History

------------------------------------------------------------------------

## Dashboard

- Today’s Attendance
- Employees Present
- Late Arrival
- Early Leave
- Absent Employees
- Attendance Statistics

------------------------------------------------------------------------

# Technology Stack

| Layer         | Technology              |
|---------------|-------------------------|
| Frontend      | Next.js 15 (App Router) |
| Language      | TypeScript              |
| Styling       | Tailwind CSS            |
| Components    | shadcn/ui               |
| Forms         | React Hook Form         |
| Validation    | Zod                     |
| ORM           | Prisma                  |
| Database      | PostgreSQL              |
| Backend       | Supabase                |
| Storage       | Supabase Storage        |
| Data Fetching | TanStack Query          |
| Tables        | TanStack Table          |
| Deployment    | Vercel                  |

------------------------------------------------------------------------

# Project Structure

    src
    │
    ├── app/
    │
    ├── components/
    │
    ├── features/
    │   ├── auth/
    │   ├── attendance/
    │   ├── dashboard/
    │   ├── employee/
    │   └── settings/
    │
    ├── lib/
    │
    ├── services/
    │
    ├── prisma/
    │
    ├── hooks/
    │
    ├── types/
    │
    └── utils/

------------------------------------------------------------------------

# Database Design

    companies
    │
    ├── users
    │
    ├── employees
    │
    ├── attendance
    │
    └── settings

## Design Principles

- UUID Primary Keys
- Multi-Tenant Ready
- Soft Delete
- Audit Fields
- Optimized Indexes
- Future-proof Schema

------------------------------------------------------------------------

# Architecture

    ┌─────────────────────┐
    │ Browser / Mobile    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Next.js App Router  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Business Services   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Prisma ORM          │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ PostgreSQL          │
    └─────────────────────┘

------------------------------------------------------------------------

# Roadmap

## Phase 1 — MVP

- Authentication
- Employee Management
- GPS Attendance
- Selfie
- Dashboard
- Attendance History

------------------------------------------------------------------------

## Phase 2

- Leave Request
- Shift Management
- Holiday Calendar
- Notifications

------------------------------------------------------------------------

## Phase 3

- Payroll
- Overtime
- Approval Workflow
- Reports

------------------------------------------------------------------------

## Phase 4

- Face Recognition
- QR Attendance
- Mobile App
- AI Analytics

------------------------------------------------------------------------

# Security

- Authentication
- Authorization
- Row Level Security (RLS)
- HTTPS
- Secure Cookies
- Input Validation
- SQL Injection Protection
- CSRF Protection

------------------------------------------------------------------------

# Getting Started

## Clone

    git clone https://github.com/TiendoLabs/gps-attendance.git

## Install

    npm install

## Development

    npm run dev

------------------------------------------------------------------------

# Environment Variables

    DATABASE_URL=

    DIRECT_URL=

    NEXTAUTH_SECRET=

    NEXTAUTH_URL=

    SUPABASE_URL=

    SUPABASE_ANON_KEY=

    SUPABASE_SERVICE_ROLE_KEY=

------------------------------------------------------------------------

# Deployment

| Service  | Provider            |
|----------|---------------------|
| Frontend | Vercel              |
| Database | Supabase PostgreSQL |
| Storage  | Supabase Storage    |
| Domain   | Custom Domain       |

------------------------------------------------------------------------

# Version

Current Release

    v1.0.0

------------------------------------------------------------------------

# Development Principles

- Clean Architecture
- Feature-based Structure
- Type Safety
- Reusable Components
- Performance First
- Mobile First
- Production Ready
- SaaS Ready

------------------------------------------------------------------------

# License

MIT License

------------------------------------------------------------------------

# Author

### TiendoLabs

Building modern business applications powered by

- Next.js
- React
- .NET
- PostgreSQL
- Supabase
- AI
