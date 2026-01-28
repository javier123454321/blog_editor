# PRD Clarification Questions

Please provide answers below each section.

---

## 1. Project Setup

- Is this a brand new project, or do you already have some files in place (like `package.json`, existing Vue setup)?
- Should I assume we're starting from scratch within the `/editor` folder?

**Answer:**
The project will wrap an existing project as a submodule. The existing project that will be the blog lives in git@github.com:javier123454321/blog.git


---

## 2. Implementation Order Priority

The plan has many features. I'd suggest this order:
1. Basic backend server setup with auth
2. File operations (list/read/write)
3. Frontend with file tree + basic editor
4. Branch operations
5. PR creation

Does this order work, or do you have a different preference?

**Answer:**
That works

---

## 3. Technical Choices

- **Vue version**: Vue 2 or Vue 3?
- **WYSIWYG editor**: Any preference? (e.g., TipTap, Milkdown, toast-ui/editor)
- **Build tooling**: Vite? Webpack?
- **Session management**: JWT tokens? Express sessions with cookies?

**Answer:**
Vue 3. Everything with composition api and typescript. The WYSIWYG editor should be as light as it can be. Use vite. Don't worry about sessions. Have an environment variable that is called $BLOG_EDITOR_PASSWORD_HASH which is a sha256 hash of a password. The user logging in will provide a password and you will compare hashes.

---

## 4. Existing Repository Structure

- Can you confirm the `/blog/` folder already exists with markdown files?
- Is the 11ty configuration already in place, or does that need setup too?

**Answer:**
The blog is in a submodule `@/blog/src/blog`

---

## 5. Environment/Config

- Where should the hashed password and GitHub token be stored? `.env` file?

**Answer:**
yes


---

## 6. Scope for v1

- Should I include all features listed, or is there a subset you want to prioritize for a first working version?

**Answer:**
Let's go for it all

