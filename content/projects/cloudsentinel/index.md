---
title: "CloudSentinel"
description: "A circuit breaker and control tower for AI agent fleets. A team project where I worked on the React web dashboard."
tags: ["Team Project", "Web", "React", "TypeScript"]
weight: 3
github: "https://github.com/tamjidul04/Cloud-Sentinel"
demo: "https://cloudsentinel-sigma.vercel.app"
---

CloudSentinel watches AI agents from outside their own code. When an agent loops, overspends or tries a risky action, it can step in. **Team HECTORS**, a team of five, built it for the International AI Builders Congress 2026 (InfraSphere AI / AgentOps challenge).

## My role: web control tower

I worked on the React web dashboard. My work included:

- **Live fleet monitoring:** charts and a fleet graph, with live updates over WebSocket and polling as a fallback.
- **Agent control:** the agent command and control page, and an approvals inbox with keyboard shortcuts.
- **Incident replay:** grouped events on a timeline, with a scrubber and faster playback.
- **Cost reporting:** the cost and return pages, including a budget chart and task table.
- **Demo and usability:** the guided demo panel, interface redesigns, bug fixes, accessibility checks and keyboard tests.

## What the team built

- Detection of repeated loops, spending limits and prompt-injection attempts
- Controls to pause, resume or stop agents
- Human approval for risky tool calls
- An OpenTelemetry SDK, a REST API and an MCP server
- Cost tracking and an audit log

## Built with

The dashboard uses React, TypeScript, Vite, TanStack Query, React Flow and ECharts, with Vitest and Playwright for testing. The wider system uses Python, FastAPI and OpenTelemetry.

## About the demo

The live demo uses simulated agents and is shared by everyone viewing it. Its first load can take about a minute. The screenshot shows the demo dashboard. The GitHub link opens my fork of the team repository.
