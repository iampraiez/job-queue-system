# Job Queue System

About four months ago I built a "job queue" by just spinning up two separate Node servers. One server created jobs and wrote them to a list, the other was constantly checking that list in a loop — if something was there, process it. It worked, but it was pretty manual. You can see it here: https://github.com/iampraiez/simple-job-queue.

This project is me coming back to the same concept but doing it properly.

---

## What I actually learnt

A queue system is really just this: you create a job, you throw it into a queue, and a worker that's always listening picks it up and does the work. That's it. The "queue" is Redis — it's just a list sitting in memory. BullMQ is the layer on top that handles all the complexity you'd otherwise have to build yourself.

What surprised me was how clean and clear it actually was. You create a `Queue`, point a `Worker` at the same queue name, and BullMQ handles the rest — retries, delays, concurrency, everything. The thing I didn't fully appreciate before was that the worker runs in a completely separate process (a sandboxed worker), so even if a job is doing something CPU-heavy or crashes, your API stays running.

This project has four feature queues, each with its own worker(though I basically just simulate the workers performing a job using setTimeout):

| Queue | What it does | Notes |
|---|---|---|
| `email` | Simulates sending emails | Rate limited to 10/sec, 5 concurrent |
| `image-processing` | Simulates image resizing/filtering | Only 2 concurrent — CPU heavy |
| `report-generation` | Simulates generating a PDF report | 5s delay, returns a local file URL |
| `scraping` | Simulates scraping a webpage | 10 concurrent but only 3/sec — polite rate limiting |

Each queue has exponential backoff, meaning if a job fails it waits before retrying (2s, 4s, 8s… depending on the queue). If it fails all its retries, it gets marked as `FAILED` in the database with the full error stack — a pattern called Dead Letter Queue.

You can watch all of this happening live at `/admin/queues` (Bull Board dashboard).

---

## Stack

- **Fastify** — the web framework
- **BullMQ** — the queue system
- **Redis (via ioredis)** — the message broker
- **Prisma + PostgreSQL** — job records and status tracking

---

## Running it

You need PostgreSQL and Redis running. Then:

```bash
# Clone
git clone https://github.com/iampraiez/job-queue-system
cd job-queue-system

# Install
pnpm install

# Set up your environment variables
cp .env.example .env
# Fill in DATABASE_URL and REDIS_URL

# Set up the database
npx prisma migrate dev

# Start dev server
pnpm dev
```

Or if you have Docker:

```bash
docker compose up
```

> The server runs on `http://localhost:3000`.  
> The Bull Board dashboard is at `http://localhost:3000/admin/queues`.

---

## API

### Create a Job
`POST /job/create`

```json
{
  "queueName": "EMAIL",
  "userId": "user_123",
  "data": {
    "to": "someone@example.com",
    "subject": "Hello",
    "body": "This is a test email"
  }
}
```

`queueName` can be: `EMAIL`, `IMAGE_PROCESSING`, `REPORT_GENERATION`, `SCRAPING`

### Get a Job
`GET /job/:id?userId=user_123`

---

## What I'd do differently in production

The workers right now are simulations — they just `setTimeout` and sometimes throw an error on purpose to show the retry logic working. In a real system, the email worker could use nodemailer, the image worker would use Sharp, etc.

The `queueName` field doubles as the job type since each queue handles exactly one kind of job. If you ever needed priority lanes (high/medium/low) for the same job type, you'd want separate queues for that and bring back a `type` field.
