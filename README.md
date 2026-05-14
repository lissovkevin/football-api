# API Design Assignment

## Project Name

Football Match GraphQL API

## Objective

Design and develop a robust, well-documented API (REST or GraphQL) that allows users to retrieve and manage information from a dataset of your choice. The API must include JWT authentication, automated testing via Postman/Newman in a CI/CD pipeline, and be publicly deployed.

Choose a dataset (10000+ data points) that interests you — it should include at least one primary CRUD resource and two additional read-only resources. Sources like [Kaggle](https://www.kaggle.com/datasets), public APIs, or CSV files work well. Pick something you find interesting, as you will reuse this API in the next assignment (WT dashboard).

This API serves historical football match data from 18 European leagues. Users can browse matches, teams and leagues freely. Authenticated users can create, update and delete matches. The API uses JWT authentication, is deployed publicly on Render.com, and includes 22 automated Postman tests with 50 assertions. A CI/CD pipeline is configured in `.gitlab-ci.yml` to run tests automatically on every commit using Newman,  but I couldn't seem to get the CI/CD work. Tests can be verified manually by running:

```bash
npx newman run postman/Football-API.postman_collection.json -e postman/production.postman_environment.json
```

## Implementation Type

GraphQL

## Links and Testing

| | URL / File |
|---|---|
| **Production API** | https://football-api-quza.onrender.com/graphql |
| **API Documentation** | https://football-api-quza.onrender.com/playground |
| **GraphQL Playground** (GraphQL only) | https://football-api-quza.onrender.com/playground |
| **Postman Collection** | `postman/Football-API.postman_collection.json` |
| **Production Environment** | `postman/production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
   ```

## Dataset

*Describe the dataset you chose:*

| Field | Description |
|---|---|
| **Dataset source** | Kaggle - Football DataSet +96k matches (18 leagues) |
| **Primary resource (CRUD)** | Match (id, date, homeTeamId, awayTeamId, homeGoals, awayGoals, leagueId, season) |
| **Secondary resource 1 (read-only)** | Team (id, name, country) |
| **Secondary resource 2 (read-only)** | League (id, name, country) |


## Design Decisions

### Authentication

JWT (JSON Web Tokens) was chosen for authentication. When a user logs in, the server creates a signed token containing the user ID and username, which expires after 7 days. The client sends this token in the Authorization header as `Bearer <token>` on every write request.

**Why JWT?**
It's simple, widely used, and works well for APIs. The server doesn't need to remember who is logged in, all the information is inside the token itself.

**Alternatives:**
- **Sessions** — like a guest list at a party. The server keeps track of who is logged in. Works fine but gets complicated with many users.
- **OAuth** — like using your Google account to log in to another website. More secure but much more complex to build.
### API Design

**GraphQL students:**
- *How did you design your schema (types, queries, mutations)?*
- *How did you implement nested queries? How does the single-endpoint approach affect your design?*

The API uses a single `/graphql` endpoint for all operations. The schema is designed around three main types: Match, Team and League.

**Schema design:**
The API has three main types:
- **Match** — the main resource, supports full CRUD (create, read, update, delete)
- **Team** — read only, you can browse but not edit
- **League** — read only, you can browse but not edit

**Nested queries** are one of GraphQL's best features. For example, when you ask for a match, you can also ask for the home team's name and the league name in the same request. In a traditional REST API you would need to make 3 separate requests to get the same information.

The single endpoint approach means all queries and mutations go through one URL, with the operation type determined by the request body rather than the HTTP method.

### Error Handling

All errors follow a consistent format with a `message` and `code` field:
- `NOT_FOUND` — resource does not exist
- `UNAUTHORIZED` — user is not logged in
- `BAD_REQUEST` — invalid input data
- `INTERNAL_ERROR` — unexpected server error

## Core Technologies Used


| Technology | Why |
|---|---|
| Node.js | JavaScript runtime that runs the server |
| Express | Web framework that handles incoming requests |
| GraphQL | Query language for the API, allows flexible and precise data fetching |
| graphql-http | Connects GraphQL to Express |
| Prisma | Database toolkit that makes it easy to talk to PostgreSQL |
| PostgreSQL (Neon.tech) | Database where all match data is stored, hosted for free on Neon.tech |
| JWT | Used for authentication tokens |
| bcryptjs | Encrypts passwords before storing them in the database |
| Ruru | GraphQL Playground, ca visual interface to test the API in the browser |
| Postman | Used to write and run automated tests |
| Newman | Command line tool that runs Postman tests automatically |
| Render.com | Cloud platform where the API is deployed and publicly accessible |


## Reflection

*What was hard? What did you learn? What would you do differently?*

**What was hard?**
Learning GraphQL from scratch was challenging since I had no prior experience with it. Setting up and using Prisma schema for the first time was also difficult, especially since Prisma version 7 changed how database connections are configured compared to older versions. Parsing the CSV dataset was also tricky because commas inside data fields broke the simple parser and required a proper CSV parsing library.

**What did you learn?**
How GraphQL works in practice and how it differs from REST. How JWT authentication works, how to connect and seed a cloud database, and how to write automated API tests with Postman and Newman.

**What would you do differently**
I would have started earlier so I could have focused more on writing cleaner code and had more time to properly set up the CI/CD pipeline. Finally I would have spent more time choosing and understanding the dataset before starting, since the CSV had messy data with commas inside fields that caused problems during import.
## Acknowledgements

*Resources, attributions, or shoutouts.*
- [Kaggle — Complete Football Data](https://www.kaggle.com/datasets/bastekforever/complete-football-data-89000-matches-18-leagues) — dataset used in this project
- [Prisma Documentation](https://www.prisma.io/docs) — for database setup and configuration
- [GraphQL Documentation](https://graphql.org/learn/) — for learning GraphQL
- [Neon.tech](https://neon.tech) — free PostgreSQL hosting
- [Render.com](https://render.com) — free API deployment

## Requirements

See [all requirements in Issues](../../issues/). Close issues as you implement them. Create additional issues for any custom functionality. See [TESTING.md](TESTING.md) for detailed testing requirements.

### Functional Requirements — Common

| Requirement | Issue | Status |
|---|---|---|
| Data acquisition — choose and document a dataset (1000+ data points) | [#1](../../issues/1) | :white_large_square: |
| Full CRUD for primary resource, read-only for secondary resources | [#2](../../issues/2) | :white_large_square: |
| JWT authentication for write operations | [#3](../../issues/3) | :white_large_square: |
| Error handling (400, 401, 404 with consistent format) | [#4](../../issues/4) | :white_large_square: |
| Filtering and pagination for large result sets | [#17](../../issues/17) | :white_large_square: |

### Functional Requirements — REST

| Requirement | Issue | Status |
|---|---|---|
| RESTful endpoints with proper HTTP methods and status codes | [#12](../../issues/12) | :white_large_square: |
| HATEOAS (hypermedia links in responses) | [#13](../../issues/13) | :white_large_square: |

### Functional Requirements — GraphQL

| Requirement | Issue | Status |
|---|---|---|
| Queries and mutations via single `/graphql` endpoint | [#14](../../issues/14) | :white_large_square: |
| At least one nested query | [#15](../../issues/15) | :white_large_square: |
| GraphQL Playground available | [#16](../../issues/16) | :white_large_square: |

### Non-Functional Requirements

| Requirement | Issue | Status |
|---|---|---|
| API documentation (Swagger/OpenAPI or Postman) | [#6](../../issues/6) | :white_large_square: |
| Automated Postman tests (20+ test cases, success + failure) | [#7](../../issues/7) | :white_large_square: |
| CI/CD pipeline running tests on every commit/MR | [#8](../../issues/8) | :white_large_square: |
| Seed script for sample data | [#5](../../issues/5) | :white_large_square: |
| Code quality (consistent standard, modular, documented) | [#10](../../issues/10) | :white_large_square: |
| Deployed and publicly accessible | [#9](../../issues/9) | :white_large_square: |
| Peer review reflection submitted on merge request | [#11](../../issues/11) | :white_large_square: |


