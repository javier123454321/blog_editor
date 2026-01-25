# Blog Editor Application - Requirements Document

## 1. Project Overview

### 1.1 Purpose
A visual markdown editor for an 11ty blog that allows editing existing posts, creating new posts, and managing changes through GitHub pull requests without requiring direct access to a development machine.

### 1.2 Scope
The application will provide a web-based interface for managing blog content stored as markdown files with YAML frontmatter. The system will handle git operations locally and create pull requests to the remote repository. Deployment after merge is handled externally by Netlify (out of scope).

## 2. Technical Architecture

### 2.1 Technology Stack
- **Frontend**: Vue.js
- **Backend**: Node.js with Express
- **Hosting**: DigitalOcean droplet (subdomain)
- **Integration**: Part of existing 11ty blog project
- **Version Control**: Git (local operations + GitHub API for PRs)

### 2.2 Project Structure
```
/blog-project
  /blog               # Existing markdown files
    *.md              # Blog posts with YAML frontmatter
  /editor             # Vue application files
  editor-server.js    # Single backend file
```

## 3. Functional Requirements

### 3.1 Authentication
- **FR-1.1**: System shall provide password-based authentication
- **FR-1.2**: Password shall be stored as a hash
- **FR-1.3**: No username required (single-user system)
- **FR-1.4**: Session management for authenticated state

### 3.2 File Management
- **FR-2.1**: System shall display folder structure of `/blog/` directory
- **FR-2.2**: System shall list all markdown files in the blog directory
- **FR-2.3**: System shall allow reading existing markdown files
- **FR-2.4**: System shall allow editing existing markdown files
- **FR-2.5**: System shall allow creating new markdown files
- **FR-2.6**: System shall preserve YAML frontmatter structure

### 3.3 Editor Interface
- **FR-3.1**: File tree sidebar shall display on the left
- **FR-3.2**: File tree sidebar shall be collapsible on mobile devices
- **FR-3.3**: Editor shall provide WYSIWYG editing mode
- **FR-3.4**: Editor shall provide raw markdown editing mode
- **FR-3.5**: Editor shall provide preview mode
- **FR-3.6**: Editor modes shall be accessible via tabs
- **FR-3.7**: Changes shall be saved to local files before PR creation

### 3.4 Branch Management
- **FR-4.1**: Header shall display current branch name
- **FR-4.2**: Header shall provide dropdown to list all branches
- **FR-4.3**: System shall allow switching between existing branches
- **FR-4.4**: System shall allow creating new branches
- **FR-4.5**: New branch creation shall be accessible from header dropdown

### 3.5 Git Operations
- **FR-5.1**: System shall commit changes locally with descriptive messages
- **FR-5.2**: System shall push commits to remote repository
- **FR-5.3**: System shall create pull requests via GitHub API
- **FR-5.4**: System shall allow updating existing pull requests
- **FR-5.5**: "Propose Changes" button shall trigger PR creation workflow
- **FR-5.6**: System boundary ends at PR creation (merge and deploy handled externally)

## 4. API Endpoints

### 4.1 Authentication
- `POST /auth` - Verify password and establish session

### 4.2 File Operations
- `GET /files` - List all markdown files in blog directory
- `GET /file/:path` - Retrieve content of specific file
- `POST /file/:path` - Save or create file with content

### 4.3 Branch Operations
- `GET /branches` - List all git branches
- `POST /checkout` - Switch to specified branch
- `POST /branch/create` - Create and checkout new branch

### 4.4 Pull Request Operations
- `POST /pr` - Create or update pull request with current changes

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1.1**: File operations shall complete within 2 seconds
- **NFR-1.2**: Git operations shall provide progress feedback for operations exceeding 3 seconds

### 5.2 Security
- **NFR-2.1**: All API endpoints (except `/auth`) shall require authentication
- **NFR-2.2**: Password shall use industry-standard hashing (bcrypt or similar)
- **NFR-2.3**: Session tokens shall expire after reasonable period

### 5.3 Usability
- **NFR-3.1**: Interface shall be responsive for mobile and desktop
- **NFR-3.2**: Editor shall provide immediate visual feedback for actions
- **NFR-3.3**: Error messages shall be clear and actionable

### 5.4 Maintainability
- **NFR-4.1**: Backend shall be contained in single file for simplicity
- **NFR-4.2**: Code shall include comments for git operation sequences

## 6. Data Requirements

### 6.1 Markdown File Format
- Files located in `/blog/*.md`
- YAML frontmatter at file beginning
- Markdown content body

### 6.2 Configuration
- Hashed password stored in environment variable or config file
- GitHub personal access token for API operations
- Repository information (owner, repo name)

## 7. User Workflow

### 7.1 Typical Editing Session
1. User authenticates with password
2. User selects or creates branch from header dropdown
3. User browses file tree and selects file to edit
4. User edits content in preferred mode (WYSIWYG/Markdown)
5. User previews changes
6. User saves file locally
7. User clicks "Propose Changes" to create PR
8. User reviews PR on GitHub
9. User merges PR (triggers Netlify deployment automatically)

## 8. Constraints and Assumptions

### 8.1 Constraints
- Single concurrent user (no collaboration features needed)
- Requires git and Node.js installed on DigitalOcean droplet
- Requires GitHub personal access token with repo permissions

### 8.2 Assumptions
- Repository is already cloned on the droplet
- Netlify deployment is pre-configured
- User has GitHub account with access to repository
- Network connectivity between droplet and GitHub is reliable

## 9. Future Considerations (Out of Scope for v1)
- Multi-user support
- Image upload functionality
- Draft saving without committing
- Conflict resolution UI
- Analytics integration
- Comment threading on posts
