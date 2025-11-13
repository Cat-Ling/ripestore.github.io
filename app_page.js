// Import utility functions
import { $, qs, semverCompare, ellipsize, parseDateString, formatDate } from './utils.js';
import { fetchRepo } from './alt-source-kit.js';

/**
 * Initializes the app details page.
 */
async function start() {
  const bundle = qs('bundle');
  const versionParam = qs('version');
  const repoUrl = qs('repo');
  const hero = $('#hero');
  const vSel = $('#versionSelect');
  const dl = $('#downloadBtn');

  // Show an error if the bundle or repo is missing
  if (!bundle || !repoUrl) {
    hero.innerHTML = `<div class="meta"><div class="hero-title">No app selected</div><div class="hero-sub">Open from Home or use a shared link.</div></div>`;
    return;
  }

  try {
    const repo = await fetchRepo(repoUrl);
    const app = repo.data.apps.find(a => a.bundleIdentifier === bundle);

    // Show an error if the app is not found
    if (!app) {
      hero.innerHTML = `<div class="meta"><div class="hero-title">Not found</div><div class="hero-sub">This bundle isn’t in that repo.</div></div>`;
      return;
    }

    // Build the hero section
    const icon = document.createElement('div');
    icon.className = 'icon-wrap';
    const img = document.createElement('img');
    img.alt = `${app.name} icon`;
    img.src = app.iconURL || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    icon.appendChild(img);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'hero-title ellipsis';
    title.textContent = app.name || app.bundleIdentifier;
    const sub = document.createElement('div');
    sub.className = 'hero-sub ellipsis';
    sub.textContent = app.developerName || app.bundleIdentifier;
    const bid = document.createElement('div');
    bid.className = 'bundle-id ellipsis';
    bid.textContent = app.bundleIdentifier;
    meta.appendChild(title);
    meta.appendChild(sub);
    meta.appendChild(bid);
    hero.innerHTML = '';
    hero.appendChild(icon);
    hero.appendChild(meta);

    // Populate the version selector
    app.versions.sort((a, b) => {
      const da = parseDateString(a.date),
        db = parseDateString(b.date);
      if (da && db) {
        return db - da;
      }
      return semverCompare(b.version, a.version);
    });

    vSel.innerHTML = '';
    app.versions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.version || '';
      opt.dataset.url = v.downloadURL || '';
      opt.dataset.notes = v.localizedDescription || '';
      opt.dataset.date = v.date || '';
      const pretty = v.version ? v.version : 'latest';
      const prettyDate = formatDate(v.date);
      opt.textContent = pretty + (prettyDate ? (' — ' + prettyDate) : '');
      vSel.appendChild(opt);
    });

    // Set the selected version
    if (versionParam) {
      const found = Array.from(vSel.options).find(o => o.value === versionParam);
      if (found) vSel.value = versionParam;
      else if (vSel.options.length) vSel.selectedIndex = 0; // newest
    } else if (vSel.options.length) {
      vSel.selectedIndex = 0; // newest
    }

    /**
     * Renders the screenshots in an App Store-style container.
     * @param {string[]} screenshotUrls - An array of screenshot URLs.
     */
    function renderScreenshots(screenshotUrls) {
      const screenshotsContainer = $('#screenshots');
      screenshotsContainer.innerHTML = '';
      if (screenshotUrls && screenshotUrls.length > 0) {
        const title = document.createElement('h2');
        title.textContent = 'Screenshots';
        screenshotsContainer.appendChild(title);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'screenshots-scroll-container';

        const scroll = document.createElement('div');
        scroll.className = 'screenshots-scroll';

        screenshotUrls.forEach(url => {
          const screenshotCell = document.createElement('div');
          screenshotCell.className = 'screenshot-cell';
          const img = document.createElement('img');
          img.src = url;
          screenshotCell.appendChild(img);
          scroll.appendChild(screenshotCell);
        });

        scrollContainer.appendChild(scroll);
        screenshotsContainer.appendChild(scrollContainer);
      }
    }

    /**
     * Renders the permissions.
     * @param {object[]} permissions - An array of permission objects.
     */
    function renderPermissions(permissions) {
        const permissionsContainer = $('#permissions');
        permissionsContainer.innerHTML = '';
        if (permissions && permissions.length > 0) {
            const title = document.createElement('h2');
            title.textContent = 'Permissions';
            permissionsContainer.appendChild(title);
            permissions.forEach(p => {
                const row = document.createElement('div');
                row.className = 'row';
                const label = document.createElement('div');
                label.className = 'label';
                label.textContent = p.type;
                const value = document.createElement('div');
                value.className = 'value';
                value.textContent = p.usageDescription;
                row.appendChild(label);
                row.appendChild(value);
                permissionsContainer.appendChild(row);
            });
        }
    }

    /**
     * Updates the UI based on the selected version.
     */
    function updateUIForVersion() {
      const opt = vSel.options[vSel.selectedIndex];
      const url = opt?.dataset?.url || '#';
      const notes = opt?.dataset?.notes || '';
      dl.href = url || '#';
      const dateStr = opt?.dataset?.date || '';
      const params = new URLSearchParams();
      params.set('bundle', app.bundleIdentifier);
      if (opt?.value) params.set('version', opt.value);
      params.set('repo', repoUrl);
      const shareUrl = location.origin + location.pathname.replace(/[^/]+$/, '') + 'app.html?' + params.toString();
      const descEl = $('#desc');
      descEl.textContent = notes ? ellipsize(notes, 1000) : (app.localizedDescription ? ellipsize(app.localizedDescription, 1000) : '');
      const upd = $('#updatedDate');
      if (upd) {
        upd.textContent = dateStr ? ('Updated: ' + formatDate(dateStr)) : '';
      }
      renderScreenshots(app.screenshotURLs);
      renderPermissions(app.permissions);
    }

    updateUIForVersion();
    vSel.addEventListener('change', updateUIForVersion);

  } catch (e) {
    hero.innerHTML = `<div class="meta"><div class="hero-title">Error</div><div class="hero-sub">Unable to load app details.</div></div>`;
    console.warn(e);
  }
}

// Start the page initialization
start();
