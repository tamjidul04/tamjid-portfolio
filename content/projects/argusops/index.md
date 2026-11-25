---
title: "ArgusOps"
description: "A desktop app and command-line tool that supervises AI coding agents on your own computer."
tags: ["Developer Tools", "TypeScript", "Node.js", "Electron"]
weight: 1
github: "https://github.com/tamjidul04/ArgusOps"
demo: ""
file: "terminal"
snippet: |
  $ argus run claude
  $ argus app
  $ argus status
  $ argus project allow
  $ argus supervisor redirect
  $ argus route auto
---

ArgusOps sits next to Claude Code and other AI coding agents and watches how they work. It is free, open source (MIT) and needs no server, account or database.

## What it does

- **Catches loops and waste.** It pauses an agent that keeps repeating a failing step, then writes an instruction to get it unstuck for you to approve.
- **Checks the work.** After each turn it looks at what really changed, such as deleted or skipped tests, placeholders, secrets written to files, and test claims that your own test run contradicts.
- **Autopilot.** You give it a goal. It asks questions, writes a plan with a check for each step and, after you approve it, builds the plan with Claude Code.
- **Model routing.** It can move small tasks to a cheaper model and move back up when needed. This is off by default.

## How it works

A proxy on your computer sits between the agent and the model provider. It counts tokens, spots loops and checks each turn. ArgusOps keeps its records in plain files on your computer.

## Built with

TypeScript, Node.js, Electron and Vitest. The code is split into an engine, a command-line and terminal app, the app screens and the desktop app.

## Status

Early stage (version 0.8). The project README reports real Claude Code runs on Windows, and automated tests passing on Linux, macOS and Windows. Support varies between coding agents. See [what is verified](https://github.com/tamjidul04/ArgusOps#what-is-verified).
