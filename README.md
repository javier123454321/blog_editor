To run this application, you need to set up and run both the **Backend API** (root directory) and the **Frontend Editor** (`editor/` directory).

### 1. Initial Setup

First, install dependencies and initialize the blog content submodule:

```bash
# Install dependencies for both backend and frontend
npm install

# Initialize the blog content submodule
git submodule update --init --recursive
```

### 2. Configuration (.env)

You need to configure the environment variables for authentication.

1.  Copy the example file:
    ```bash
    cp .env.example .env
    ```
2.  Edit `.env` and set a **SHA-256 hash** of your desired password in `BLOG_EDITOR_PASSWORD_HASH`.
    *   You can generate a hash in your terminal:
        ```bash
        # MacOS/Linux
        echo -n "your_password" | shasum -a 256
        ```
    *   Paste the output into the `.env` file.

### 3. Running the App

You will need two terminal sessions running simultaneously.

**Terminal 1: Backend API**
Starts the Express server on port 3001 (default).
```bash
npm run dev
```

**Terminal 2: Frontend Editor**
Starts the Vite development server for the Vue app.
```bash
npm run dev -w editor
# OR
cd editor && npm run dev
```

Once both are running, open the URL shown in Terminal 2 (usually `http://localhost:5173`).

