# Fleet Hub — JDL Contractors LTD

A simple two-part site:

- **`check.html`** — the weekly Vehicle Safety Check Sheet. No login. A driver
  types their name and van registration and fills in the same questions as
  your paper form.
- **`admin.html`** — login for Stephen, Jamie and Craig to maintain the
  vehicle register (editable, e.g. when a driver changes vans) and review
  submitted safety checks, with defects automatically flagged.

It's plain HTML/CSS/JS — no build step, so it can be hosted straight from
GitHub. All the data lives in Supabase.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick any name (e.g. `fleet-hub`) and a strong database password (save it somewhere safe — you won't need it day to day).
2. Once the project is ready, open **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this folder, paste the whole thing in, and click **Run**.
   This creates the `vehicles` and `safety_checks` tables, sets up the security rules, and loads in the vehicles from your paper register.
4. A handful of driver names and two vans (`YC20 EZY`, `HK20 JOU`) were hard to read on the handwritten sheet, so they were left blank/flagged with a note — you can fill these in afterwards from the Admin → Vehicle Register tab.

## 2. Create the 3 admin logins

1. In Supabase, go to **Authentication → Users → Add user**.
2. Create three users (this is the only place the password is set):
   - `stephen@jdlcontractors.co.uk`
   - `jamie@jdlcontractors.co.uk`
   - `craig@jdlcontractors.co.uk`
   
   (Use real addresses if you'd rather — they're just login IDs, no email is actually sent.)
3. For each, tick **Auto Confirm User** and set the password to: `JDLContractors`
   (You can change this for each person any time from the same screen.)

These three are the only accounts that can sign in to `admin.html` — everyone else only ever sees the no-login `check.html` page.

## 3. Connect the site to your Supabase project

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `assets/supabase-config.js` in this folder and replace the two placeholder values:

   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```

   This key is safe to be public — it only allows what the security rules in `schema.sql` permit (drivers can submit checks and view the reg list; only signed-in admins can edit the register or read submissions).

## 4. Push to GitHub

```bash
cd fleet-hub
git init
git add .
git commit -m "Fleet Hub for JDL Contractors"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fleet-hub.git
git push -u origin main
```

## 5. Go live with GitHub Pages

1. On GitHub, open the repo → **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**, branch `main`, folder `/ (root)` → **Save**.
3. After a minute, your site is live at `https://YOUR-USERNAME.github.io/fleet-hub/`.

Bookmark `…/check.html` on each driver's phone (or print a QR code to it for the van) and `…/admin.html` for Stephen, Jamie and Craig.

*(Vercel or Netlify work just as well if you'd rather use one of those — just point either at this repo, no build command needed.)*

---

## Notes

- **Security:** the admin password above is a simple shared one to get you going. Anyone with it can edit the fleet register, so treat it like a key to the office — change it from Supabase any time via **Authentication → Users**.
- **Editing the checklist questions:** they live in one place — `assets/checklist-items.js` — so wording can be tweaked without touching the form logic.
- **Editing colours/branding:** all in `assets/style.css` at the top under `:root`.
