# Focusly

Focusly helps users cut the noise and execute on what matters by capturing long-term goals, defining focus areas, and driving daily action through a structured workflow.

## Features

- **Goal Setting**: Set long-term goals and 3-5 focus areas
- **Monthly Planning**: Create and prioritize 3-5 monthly goals
- **Daily Workflow**: Take notes, reflect, plan tomorrow, and execute today's to-dos
- **Drag & Drop**: Reorder todos and goals with intuitive drag-and-drop
- **History Tracking**: View past notes, reflections, and completed tasks
- **Monthly Reviews**: Automated monthly review prompts

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React Server Actions
- **Styling**: TailwindCSS + shadcn/ui + lucide-react icons
- **State Management**: TanStack Query (client caching) + Zod (validation)
- **Database**: Supabase (Auth, Postgres, RLS)
- **ORM**: Drizzle ORM with drizzle-kit
- **Drag & Drop**: @dnd-kit/core
- **Deployment**: Vercel + Supabase

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully set up
3. Go to Settings > API to get your project URL and anon key
4. Go to Settings > Database to get your database connection string

### 2. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Database Schema

1. Run the database migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

2. Set up Row Level Security (RLS) policies:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-policies.sql`
   - Run the SQL to enable RLS and create policies

### 5. Configure Authentication

1. In your Supabase project, go to Authentication > Settings
2. Enable email authentication
3. Optionally enable OAuth providers (Google, GitHub, etc.)
4. Set the site URL to `http://localhost:3000` for development

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the same environment variables in Vercel's dashboard
4. Deploy

### Update Supabase Settings

1. In your Supabase project, go to Authentication > Settings
2. Update the site URL to your Vercel domain
3. Add your Vercel domain to the redirect URLs

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (main)/                # Main app pages
│   │   ├── actions/           # Server actions
│   │   ├── goals/             # Goals management
│   │   ├── history/           # History view
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── settings/          # User settings
│   │   └── page.tsx           # Today's to-dos (home)
│   ├── auth/callback/         # Auth callback
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── ActionsPage.tsx        # Daily actions workflow
│   ├── GoalsPage.tsx          # Goals management
│   ├── HistoryPage.tsx        # History view
│   ├── MonthlyReviewDialog.tsx # Monthly review
│   ├── NoteEditor.tsx         # Note taking
│   ├── ReflectionForm.tsx     # Daily reflection
│   ├── TodoList.tsx           # Todo management
│   ├── TomorrowPlanner.tsx    # Tomorrow planning
│   └── TopNav.tsx             # Navigation
├── db/
│   ├── schema.ts              # Drizzle schema
│   └── drizzle.ts             # Database connection
└── lib/
    ├── auth.ts                # Authentication helpers
    ├── date.ts                # Date utilities
    ├── supabase.ts            # Supabase client
    └── validators.ts          # Zod schemas
```

## Key Features Implementation

### Authentication Flow
- Supabase Auth with email magic links and OAuth
- Protected routes with middleware
- Automatic profile creation on first login

### Onboarding Process
1. Set long-term goal (1-10 years)
2. Define 3-5 focus areas
3. Create 3-5 monthly goals with prioritization
4. Complete onboarding and redirect to main app

### Daily Workflow
1. **Take Notes**: Capture thoughts and ideas
2. **Reflect**: What went well, what didn't, improvements
3. **Plan Tomorrow**: Move incomplete tasks to tomorrow
4. **Today's To-Dos**: Execute with drag-to-reorder

### Monthly Review
- Triggered in last 3 days of month or first 2 days of new month
- Shows current goals and allows reflection
- Edit and reprioritize goals for next month

### Data Model
- **Profiles**: User settings and onboarding status
- **Long-term Goals**: 1 per user, 1-10 year targets
- **Focus Areas**: 3-5 per user, ordered
- **Monthly Goals**: 3-5 per month, ordered, with status
- **Todos**: Daily tasks with drag-to-reorder
- **Notes**: Daily notes with autosave
- **Reflections**: Daily and monthly reflections

## Development Notes

- All database operations use Drizzle ORM with proper TypeScript types
- Server actions handle all CRUD operations with validation
- TanStack Query provides client-side caching and optimistic updates
- Drag-and-drop uses @dnd-kit for accessibility and performance
- RLS policies ensure users can only access their own data

## License

MIT License - see LICENSE file for details.