# monarch-69.github.io

Personal portfolio of **Ritesh Tiwari**: systems, backend and agentic AI.

Plain HTML, CSS and JavaScript. No framework and no build step. GitHub Pages serves it as is.

```
.
├── index.html            # the whole site
├── 404.html              # "segfault" page for broken links
├── .nojekyll             # tells GitHub Pages to skip Jekyll
└── assets/
    ├── css/style.css
    ├── js/main.js
    ├── favicon.svg
    ├── img/profile.jpg               # ← add your photo here
    └── Ritesh_Tiwari_Resume.pdf      # ← add your resume here
```

## Before you publish

1. **Photo:** save a square photo (about 800×800) as `assets/img/profile.jpg`.
   Until it exists, the site shows an ASCII "RT" placeholder.
2. **Resume:** save your PDF as `assets/Ritesh_Tiwari_Resume.pdf`.

## Deploy on GitHub Pages

1. Create a **public** repo named exactly **`monarch-69.github.io`**.
2. Push these files to the `main` branch:

   ```bash
   git init
   git add .
   git commit -m "Portfolio site"
   git branch -M main
   git remote add origin https://github.com/monarch-69/monarch-69.github.io.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)** → Save
4. After a minute, the site is live at **https://monarch-69.github.io**.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing

- **Projects**: each project is one `<article class="prow">` in `index.html`.
  Sides alternate automatically. The `data-tags` attribute (`systems`, `backend`, `ai`)
  controls the filter buttons. Badges: `badge--stable`, `badge--wip`, `badge--done`.
  When a repo goes public, swap the `<span class="pname pname--off">` for an
  `<a class="pname" href="...">` like the other projects.
- **Intro speed**: change the `PACE` numbers at the top of `assets/js/main.js`.
- **Terminal intro**: edit the `script` array in `assets/js/main.js`.
- **Colours**: all in the `:root` block at the top of `assets/css/style.css`.
