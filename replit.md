# Workspace

## Overview

Indus Driving School - Full-stack professional website with booking system, email notifications, and Facebook integration.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/indus-driving-school)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Email**: Nodemailer with Gmail SMTP
- **Build**: esbuild (CJS bundle)

## Features

- **Home Section**: Hero with car image, title, subtitle, description, Book Now button
- **Booking System**: Interactive calendar with available (green) / booked (red) dates, weekends disabled, time slots 7AM-5PM, Morning/Evening packages ($60-$500), booking popup form with name/phone
- **Database**: PostgreSQL stores all bookings permanently, prevents double booking
- **Email Notifications**: Sends email to indusdrivingschoolau@gmail.com on booking created/cancelled
- **Facebook Notifications**: Sends Facebook page message on booking created/cancelled
- **Cancel Booking**: List of bookings with cancel button, sends cancellation notifications
- **About Section**: Instructor background, 13 years experience, learner types
- **Contact Section**: Phone, locations (Blacktown & Penrith NSW), Google Maps, Facebook link

## Environment Variables Required

- `GMAIL_APP_PASSWORD` - Gmail App Password for sending email notifications
- `FACEBOOK_PAGE_ACCESS_TOKEN` - Facebook Page Access Token (optional)
- `FACEBOOK_PAGE_ID` - Facebook Page ID (optional)
- `DATABASE_URL` - Auto-provisioned by Replit

## Structure

```text
artifacts/
├── indus-driving-school/    # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/      # Navbar, Footer
│       │   └── home/        # Hero, About, BookingCalendar, Contact
│       └── pages/           # Home page
└── api-server/              # Express API
    └── src/
        ├── routes/bookings.ts   # GET /bookings, POST /book, DELETE /book/:id
        └── lib/
            ├── email.ts         # Nodemailer email notifications
            └── facebook.ts      # Facebook Graph API notifications
lib/
├── db/src/schema/bookings.ts    # Drizzle schema for bookings table
└── api-spec/openapi.yaml        # OpenAPI 3.1 spec
```

## API Routes

- `GET /api/bookings` - Returns all bookings
- `POST /api/book` - Creates booking (body: {date, time, package, name, phone})
- `DELETE /api/book/:id` - Cancels booking
