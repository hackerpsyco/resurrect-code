# Step-by-Step: Setting Up GitHub OAuth for Neon Backend

To enable login without Supabase, you must create a GitHub OAuth Application.

### 1️⃣ Create the OAuth App on GitHub
1.  Log into **GitHub.com**.
2.  Go to **Settings** -> **Developer settings** (bottom left) -> **OAuth Apps**.
3.  Click **"New OAuth App"** (or "Register a new application").
4.  Fill in the fields exactly as follows:
    *   **Application name**: `ResurrectCI (Local)`
    *   **Homepage URL**: `http://localhost:8080`
    *   **Application description**: `Local Backend for ResurrectCI`
    *   **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
5.  Click **"Register application"**.

---

### 2️⃣ Get Credentials & Save to Backend
1.  You will see a **Client ID**. Copy it.
2.  Click **"Generate a new client secret"**. Copy the Secret immediately.
3.  Open `backend/.env` in your editor and add:

```env
# GitHub OAuth Configuration
# (Add these rows underneath DATABASE_URL)
GITHUB_CLIENT_ID=your_copied_client_id
GITHUB_CLIENT_SECRET=your_copied_client_secret
JWT_SECRET=super_secure_random_key_123
```

---

### 3️⃣ Start and Test the Backend
Once filled, you can run the server using:
```bash
cd backend
npm run start
```
Frontend can now call `http://localhost:5000/api/auth/github` which redirects to securely log you into Neon!
