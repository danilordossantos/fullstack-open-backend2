# Bloglist

A full-stack web application for sharing and ranking blog posts. Users log in, save links to articles they find worth reading, like the ones they recommend, and the list ranks itself by popularity.

Built as part of the [Full Stack Open](https://fullstackopen.com/en/) course by the University of Helsinki (parts 4 and 5).

**Live demo:** https://danilordossantosbloglist.fly.dev

---

## Contents

- [Try it online](#try-it-online)
- [What problems it solves](#what-problems-it-solves)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Testing](#testing)
- [Bugs the tests caught](#bugs-the-tests-caught)
- [How AI assistance was used](#how-ai-assistance-was-used)
- [Running locally](#running-locally)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Related repositories](#related-repositories)

---

## Try it online

1. Open **https://danilordossantosbloglist.fly.dev** in your browser.
2. Wait a few seconds on the first visit. The server shuts down when idle to save resources and starts again on the first request.
3. Log in with the demo account:

   | Username | Password   |
   |----------|------------|
   | `demo`   | `demo2026` |

4. Explore:
   - Click any title in the list to open its details.
   - Click **LIKE** and watch the list reorder when you go back **HOME**.
   - Click **NEW BLOG** to add a post of your own.
   - Open a blog you created and click **REMOVE** to delete it. Only the user who added a blog can remove it.
   - Click **LOGOUT** when you are done.

> The demo account is shared. Anything you add can be seen, liked, or removed by other visitors using it.

---

## What problems it solves

- **Scattered reading lists.** Good articles end up in bookmarks, chat messages, and browser tabs. The app keeps them in one shared list.
- **Deciding what to read first.** Likes turn the list into a ranking, so the most recommended posts are always at the top.
- **Ownership and accountability.** Every blog records who added it. Anyone logged in can like a post, but only its author can delete it, enforced on both the server and the interface.
- **Secure, persistent sessions.** Passwords are stored as bcrypt hashes, requests are authenticated with JSON Web Tokens, and the session survives page reloads. When a token expires, the app logs the user out and explains why instead of failing silently.

---

## Features

- User authentication with JWT (tokens expire after one hour)
- Session persistence across page reloads via `localStorage`
- Automatic logout with a clear message when the session expires or the token is invalid
- Create, like, and delete blogs
- Deletion restricted to the blog's creator, with a confirmation dialog
- Blog list sorted by number of likes
- Individual detail page for each blog, with a direct, shareable URL
- Client-side routing that also works on page refresh and direct links in production
- Color-coded notifications for success, information, warnings, and errors
- Password field with a show/hide toggle
- Responsive, centered login page and a Material Design interface

---

## Tech stack

### Backend (this repository)

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express 5](https://expressjs.com/) | HTTP server, REST API routing, and serving the frontend build |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Cloud-hosted database |
| [Mongoose](https://mongoosejs.com/) | Schemas, validation, and `populate` for references between users and blogs |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | Issuing and verifying authentication tokens |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [cors](https://github.com/expressjs/cors) | Cross-origin requests during development |
| [dotenv](https://github.com/motdotla/dotenv) | Loading environment variables locally |
| [lodash](https://lodash.com/) | Collection helpers |
| `node:test` + [Supertest](https://github.com/ladjs/supertest) | API integration tests |
| [cross-env](https://github.com/kentcdodds/cross-env) | Cross-platform environment variables in npm scripts |
| [nodemon](https://nodemon.io/) | Automatic restarts during development |
| [ESLint](https://eslint.org/) | Linting |

### Frontend ([separate repository](https://github.com/danilordossantos/fullstack-open-frontend))

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | User interface |
| [Vite](https://vite.dev/) | Development server and production build |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [Material UI (MUI)](https://mui.com/) + [Emotion](https://emotion.sh/) | Component library and styling engine |
| [axios](https://axios-http.com/) | HTTP requests to the API |
| [Lucide](https://lucide.dev/) | Icons for the password visibility toggle |
| [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + jsdom | Component tests |
| [ESLint](https://eslint.org/) | Linting |

### End-to-end tests ([separate repository](https://github.com/danilordossantos/bloglist-e2e))

| Technology | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | Browser automation, run against Chromium |

### Infrastructure and tooling

| Technology | Purpose |
|---|---|
| [Fly.io](https://fly.io/) | Hosting, in the São Paulo region |
| [Docker](https://www.docker.com/) | Container image, generated with `@flydotio/dockerfile` |
| [flyctl](https://fly.io/docs/flyctl/) | Deployment, secrets, logs, and scaling |
| Git, GitHub, and [GitHub CLI](https://cli.github.com/) | Version control, pull requests, and merges |
| WSL (Ubuntu) and VS Code | Development environment |

---

## Architecture

In production, a single Express server delivers both the React application and the REST API, so the frontend and backend share one origin and need no proxy or CORS configuration.

```
                    https://danilordossantosbloglist.fly.dev
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │     Express server (Fly.io machine)  │
                  │                                      │
   /  /login      │  express.static('dist')              │
   /blogs/:id ───►│  + fallback to dist/index.html       │──► React app (browser)
   /create        │    for any non-API GET request       │
                  │                                      │
   /api/* ───────►│  REST API: blogs, users, login       │──► MongoDB Atlas
                  └──────────────────────────────────────┘
```

**Why the fallback matters.** React Router changes pages inside the browser. On a refresh or a direct link to `/blogs/<id>`, the browser asks the server for that path, and no such file exists in `dist/`. A middleware returns `index.html` for any `GET` request outside `/api`, so React loads and the router shows the right page. Unknown `/api` paths still return a JSON `404`, so API clients get a meaningful error instead of an HTML page.

**Request flow for protected actions.** A `tokenExtractor` middleware reads the `Authorization: Bearer <token>` header, and a `userExtractor` middleware resolves it to a user, so route handlers for creating, updating, and deleting blogs know who is making the request.

---

## Testing

The project is tested at three levels.

### Backend: API integration tests

Written with Node's built-in `node:test` runner and Supertest, against a dedicated test database (`TEST_MONGODB_URI`). The suite covers the blog and user endpoints, including authentication, validation, and ownership rules. It was migrated from Jest to `node:test` during development.

```bash
npm test
```

### Frontend: component tests

Written with Vitest and Testing Library in a jsdom environment, covering how the blog component renders and how the blog form calls its handler with the right data.

### End-to-end tests

Eight Playwright scenarios run against the real frontend and backend in test mode, with the database reset before each test through a test-only endpoint:

1. The login form is shown
2. Login succeeds with correct credentials
3. Login fails with wrong credentials
4. A logged-in user can create a blog
5. A blog can be liked
6. The user who created a blog can delete it
7. Only the creator sees the delete button
8. Blogs are ordered by likes, most liked first

---

## Bugs the tests caught

The end-to-end suite paid for itself several times. Some of the failures it exposed were real application bugs, not problems in the tests:

- **Logged-in users were sent to the login page on every refresh.** The user state started as `null` and the saved session was read in a `useEffect`, which runs after the first render. On a reload, the protected route saw `null` and redirected before the session was restored. Fixed by reading `localStorage` synchronously in the `useState` initializer.
- **Sorting by likes was lost during a routing refactor.** The ordering test failed, and a search of the codebase showed the sort no longer existed anywhere. It was restored in the list component, sorting a copy of the array so React state is never mutated.
- **The remove button did not appear on newly created blogs.** The `POST /api/blogs` response returned the user as a raw ID instead of a populated object, so the ownership check failed until the page was reloaded. Fixed by populating the user before responding.
- **Race conditions in the tests themselves.** Consecutive blog creations started while the previous request was still in flight, and a transient link visible for an instant during a redirect was sometimes clicked and sometimes not. Fixed by waiting for visible confirmation before each next step, and by removing interactions with elements that only exist during transitions.

Found through manual testing and debugging:

- **Anonymous users could see the remove button.** The ownership check compared two `undefined` values, which JavaScript considers equal. Fixed by requiring a logged-in user before comparing IDs.
- **Expired sessions failed silently.** After the one-hour token expiry, the interface still showed the user as logged in, but every action returned `401` and a generic error. A single error handler now detects `401` responses, logs the user out, and shows a "session expired" warning.
- **Page refresh returned `404` in production.** Solved with the fallback middleware described in [Architecture](#architecture).

---

## How AI assistance was used

This project was built as part of my transition into software development, and I used Claude (by Anthropic) as a **Socratic tutor** throughout. I asked it not to hand me finished implementations, but to guide me with questions and hints, review what I wrote, and explain concepts when I got stuck. **I wrote the application code myself.**

Concretely, the assistance looked like this:

- **Debugging by questioning.** When the end-to-end tests failed after the routing refactor, instead of being told the cause, I was asked to refresh the page manually and report the URL. Seeing the redirect myself led to the diagnosis of the session-restore bug described above, and to understanding why `useEffect` runs after the first render.
- **Reading errors and data structures.** To handle expired tokens, I logged the axios error object, learned to navigate it to `error.response.status`, and then designed the conditional and the shared error handler myself.
- **Explaining race conditions.** For the flaky end-to-end tests, the assistant drew timelines of what the test runner and the application were doing in parallel, and I identified which waits were missing or which steps were unnecessary.
- **Code review.** Each iteration I shared was reviewed for bugs, such as a `setUser` call inside a `useState` initializer, a `sx` prop on a native HTML element, a middleware registered inside its own function body, and naming and consistency issues.
- **Design discussions.** Choosing MaterialUI over styled-components, where each style belonged, what the navigation bar should show in each state, and why production secrets go in `fly secrets` instead of `fly.toml`.
- **Deployment.** Understanding why the Express server should serve the Vite build, why the SPA fallback must exclude `/api`, how the Fly.io port and environment variables fit together, and why `cross-env` would break the production start script.
- **Git workflow.** One branch per task, Conventional Commits, pull requests, and branch cleanup.

Some supporting text was drafted with the assistant and then reviewed by me, including commit message bodies, pull request descriptions, and this README.

---

## Running locally

### Prerequisites

- Node.js and npm
- A MongoDB database (for example, a free MongoDB Atlas cluster)

### Setup

The `build:ui` script expects the frontend and backend folders to sit side by side, with the frontend in a folder named `bloglist-frontend`:

```bash
git clone https://github.com/danilordossantos/fullstack-open-backend2.git
git clone https://github.com/danilordossantos/fullstack-open-frontend.git bloglist-frontend

cd fullstack-open-backend2
npm install
```

Create a `.env` file in the backend root:

```
MONGODB_URI=<your MongoDB connection string>
TEST_MONGODB_URI=<a separate database for tests>
PORT=3003
SECRET=<any long random string used to sign tokens>
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the API in development mode with automatic restarts |
| `npm start` | Start the API without restarts |
| `npm run start:test` | Start the API in test mode, enabling the reset endpoint used by the E2E tests |
| `npm test` | Run the backend test suite |
| `npm run lint` | Run ESLint |
| `npm run build:ui` | Build the frontend and copy `dist/` into this project |
| `npm run deploy` | Deploy the current folder to Fly.io |
| `npm run deploy:full` | Build the frontend, copy it, and deploy |
| `npm run logs:prod` | Stream production logs |

For frontend development with hot reload, run `npm run dev` in both the backend and the frontend. The Vite development server proxies `/api` requests to the backend.

---

## Deployment

The application is deployed to Fly.io from a local machine.

1. **Configuration.** `fly.toml` defines the app, the São Paulo region, a 256 MB machine that stops when idle, and `PORT = '3000'` to match the internal port Fly.io routes traffic to.
2. **Secrets.** Sensitive values are stored encrypted on Fly.io and never committed:
   ```bash
   fly secrets set MONGODB_URI='...' SECRET='...'
   ```
   Production uses its own database, separate from development and tests.
3. **Build and release.**
   ```bash
   npm run deploy:full
   ```
   This builds the frontend, copies `dist/` into the backend, builds the Docker image, and releases it. `dist/` is listed in `.gitignore` because it is generated, and `.env` is listed in `.dockerignore` so local secrets never reach the image.

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/blogs` | No | List all blogs, with the creator's name and username |
| `POST` | `/api/blogs` | Yes | Create a blog |
| `PUT` | `/api/blogs/:id` | Yes | Update a blog, for example to add a like |
| `DELETE` | `/api/blogs/:id` | Yes, creator only | Delete a blog |
| `GET` | `/api/users` | No | List users and their blogs |
| `POST` | `/api/users` | No | Register a user. Username must be unique; username and password need at least 3 characters |
| `POST` | `/api/login` | No | Log in and receive a token |
| `POST` | `/api/testing/reset` | Test mode only | Empty the test database |

Authenticated requests send the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Related repositories

- **Frontend:** [fullstack-open-frontend](https://github.com/danilordossantos/fullstack-open-frontend)
- **End-to-end tests:** [bloglist-e2e](https://github.com/danilordossantos/bloglist-e2e)

---

## Author

**Danilo Ribeiro Abranches dos Santos**, a developer in career transition based in São Paulo, Brazil.

GitHub: [@danilordossantos](https://github.com/danilordossantos)
