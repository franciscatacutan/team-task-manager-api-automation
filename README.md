# Team Task Manager API Automation

Enterprise-style API automation framework for the Team Task Manager application, built with Playwright and TypeScript.

This project demonstrates modern API automation practices including reusable API clients, request builders, response validators, environment-based configuration, and CI/CD integration.

---

## Project Goals

* Build a scalable API automation framework using Playwright and TypeScript
* Apply enterprise-level automation architecture and design patterns
* Validate authentication, users, teams, projects, and tasks APIs
* Implement maintainable and reusable test automation components
* Integrate automated execution through GitHub Actions
* Showcase Quality Engineering and SDET practices

---

## Tech Stack

* Playwright
* TypeScript
* Node.js
* dotenv
* GitHub Actions

---

## Project Structure

```text
src
│
├── api
├── builders
├── config
├── models
└── validators

tests
│
├── api
├── ui
├── integration
└── contract
```

---

## Environment Configuration

Create a `.env` file:

```env
BASE_URL=http://localhost:8080/api
```

Example configuration is provided in `.env.example`.

---

## Installation

```bash
npm install
```

---

## Run All Tests

```bash
npm run test
```

---

## Run API Tests

```bash
npm run test:api
```
