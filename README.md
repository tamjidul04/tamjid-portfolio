# CSE student portfolio (Hugo + Devfolio theme)

## Run it

    hugo server -D

Open http://localhost:1313/. To build for hosting, run `hugo --minify`. The output is in `public/`.

## What to edit

| What | Where |
|---|---|
| Name, photo, bio, email, GitHub, LinkedIn | `data/profile.yaml` |
| Contest results and awards | `data/achievements.yaml` |
| Skills | `data/skills.yaml` |
| Education, experience, activities | `data/timeline.yaml` |
| Typing words, section headings, internship banner | `content/_index.md` |
| Projects | `content/projects/` |
| Blog posts | `content/blog/` |
| Site title, menu, animations, resume | `hugo.toml` |
| Contact page text | `content/contact.md` |
| Design | `themes/devfolio/` |

## Add a project or post

    hugo new content --kind projects projects/my-app/index.md
    hugo new content blog/my-post.md

New files start as drafts. Set `draft: false` to publish.
For a project screenshot, save it as `featured.png` next to the project's `index.md`.

## Extras

- Photo: save it as `static/me.jpg` (`.jpeg`, `.png` and `.webp` also work). It appears automatically. A square photo looks best. Restart `hugo server` if it does not show.
- Resume: copy it to `static/`, then set `resume = "resume.pdf"` in `hugo.toml`.
- Animations: set `animations = false` to turn them off. They are also off for visitors whose device asks for reduced motion.
- Background and cursor: set `animatedBackground` or `cursor` to `false` in `hugo.toml`. Colours are at the top of `themes/devfolio/assets/css/effects.css`.
- Skill icons: SVG files in `themes/devfolio/assets/icons/` (brand icons from Devicon, MIT licence).

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New > Project** and import the repository.
3. Under **Environment Variables**, add `HUGO_VERSION` with the value `0.170.1`.
4. Click **Deploy**.

`vercel.json` holds the build settings and sets the site address automatically.
Keep "access to System Environment Variables" turned on in the Vercel project settings.
After this, each push to the main branch deploys the site again.

## Before going live

Replace all remaining sample text.

The earlier marketing design is saved in `_backup-meridian/`. Delete that folder when you no longer need it.
