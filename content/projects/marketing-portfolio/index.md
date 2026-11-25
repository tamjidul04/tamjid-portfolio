---
title: "Marketing Portfolio"
description: "A portfolio website for digital marketers, with its own admin panel for editing content without code."
tags: ["Web", "Next.js", "React", "Supabase"]
weight: 2
github: "https://github.com/tamjidul04/Marketing_Portfolio"
demo: ""
---

A website and an admin panel that let a digital marketer edit every section, publish case studies and read enquiries without touching code. It is open source under the MIT licence. The screenshot shows placeholder content.

## The website

- Home page, case studies and a privacy page
- Consultation form and WhatsApp button
- Responsive layout, light and dark mode, and scroll animation
- SEO, with optional Meta Pixel and Google Analytics

## The admin panel

- Sign-in and password reset
- Editing for all site content, with drag-and-drop ordering
- Image uploads that are resized automatically
- An inbox with private notes, and email alerts for new messages

## How it works

The two Next.js apps share one Supabase project for the database, sign-in and image storage. Row-level security lets the website read only published content, while only signed-in admins can write. Resend handles new-message emails, and both apps are designed to deploy on Vercel.

## Built with

Next.js, React, TypeScript, Tailwind CSS and Supabase (Postgres).
