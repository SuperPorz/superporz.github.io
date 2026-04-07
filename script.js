// ===== PASSWORD PROTECTION & AUTH SYSTEM =====
const SECRET_KEY = 'YouStudentHub2026'; // Chiave per criptazione - CAMBIA QUESTO!
const PASSWORD_HASH_KEY = 'ysh_pwd_hash';
const PROGRESS_DATA_KEY = 'ysh_progress_data';
const SESSION_KEY = 'ysh_session';

// Funzione di hash semplice (usa SubtleCrypto se disponibile)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Criptazione XOR semplice per i dati di progresso
function encryptData(data, key) {
  const json = JSON.stringify(data);
  let encrypted = '';
  for (let i = 0; i < json.length; i++) {
    encrypted += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
}

function decryptData(encrypted, key) {
  try {
    const json = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < json.length; i++) {
      decrypted += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

// Init auth modal
function showAuthModal() {
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-content">
      <div class="auth-modal-title">🔐 YouStudent Hub</div>
      <p style="color: var(--muted); font-size: 12px; margin-bottom: 20px; text-align: center;">Primo accesso? Imposta una password</p>
      <div id="authError" class="auth-modal-error"></div>
      <input type="password" id="passwordInput" class="auth-modal-input" placeholder="Password" />
      <button id="authSubmitBtn" class="auth-modal-button">Accedi</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('authSubmitBtn').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    if (!password) {
      document.getElementById('authError').textContent = 'Inserisci una password';
      return;
    }

    const hash = await hashPassword(password);
    const stored = localStorage.getItem(PASSWORD_HASH_KEY);

    if (!stored) {
      // Primo accesso - salva la password
      localStorage.setItem(PASSWORD_HASH_KEY, hash);
      localStorage.setItem(SESSION_KEY, Date.now().toString());
      modal.remove();
      init();
    } else if (stored === hash) {
      // Password corretta
      localStorage.setItem(SESSION_KEY, Date.now().toString());
      modal.remove();
      init();
    } else {
      // Password errata
      document.getElementById('authError').textContent = '❌ Password errata';
      document.getElementById('passwordInput').value = '';
    }
  });

  document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('authSubmitBtn').click();
  });
}

// Check if authenticated
function isAuthenticated() {
  const session = localStorage.getItem(SESSION_KEY);
  return session !== null;
}

// Transform <code> tags to <strong> with backticks for plain text
function transformCodeTags() {
  const codeTags = document.querySelectorAll('code');
  codeTags.forEach(codeTag => {
    const text = codeTag.textContent;
    const strong = document.createElement('strong');
    strong.textContent = '`' + text + '`';
    codeTag.parentNode.replaceChild(strong, codeTag);
  });
}

// Logout
function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

// GitHub Sync
async function syncWithGithub() {
  const token = prompt('🔐 Token GitHub PAT (https://github.com/settings/tokens):\n(opzionale - solo per sync automatico)');
  if (!token) return;
  
  const owner = 'SuperPorz';
  const repo = 'superporz.github.io';
  const path = 'progress.json';
  
  try {
    const data = localStorage.getItem(PROGRESS_DATA_KEY);
    const progressData = data ? decryptData(data, SECRET_KEY) : {};
    
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: progressData,
      summary: {
        totalTasks: Object.keys(progressData).length,
        completedTasks: Object.values(progressData).filter(v => v).length,
        percentageComplete: Math.round((Object.values(progressData).filter(v => v).length / Object.keys(progressData).length) * 100)
      }
    };
    
    // Get current file SHA (if exists)
    let sha = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
      });
      if (res.ok) {
        const fileData = await res.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // File doesn't exist yet
    }
    
    // Commit to GitHub
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}` },
      body: JSON.stringify({
        message: `📊 Auto-sync progress - ${new Date().toLocaleString()}`,
        content: btoa(JSON.stringify(exportObj, null, 2)),
        branch: 'main',
        sha: sha
      })
    });
    
    if (response.ok) {
      alert('✅ Sincronizzato con GitHub! Push dei tuoi progressi completato.');
    } else {
      alert('❌ Errore nella sincronizzazione. Verifica il token.');
    }
  } catch (error) {
    alert('❌ Errore: ' + error.message);
  }
}

// Load progress from GitHub
async function loadFromGithub() {
  const confirmed = confirm('📥 Caricare i progressi da GitHub?\nSostituirà i progressi locali.');
  if (!confirmed) return;
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/SuperPorz/superporz.github.io/main/progress.json');
    if (!response.ok) {
      alert('❌ File progress.json non trovato su GitHub');
      return;
    }
    
    const data = await response.json();
    let progressData = data;
    if (data.progress) {
      progressData = data.progress;
    }
    
    const encrypted = encryptData(progressData, SECRET_KEY);
    localStorage.setItem(PROGRESS_DATA_KEY, encrypted);
    alert('✅ Progressi caricati da GitHub! Ricarica la pagina.');
    location.reload();
  } catch (error) {
    alert('❌ Errore: ' + error.message);
  }
}

// Load and save progress
function loadProgress() {
  const data = localStorage.getItem(PROGRESS_DATA_KEY);
  if (data) {
    const decrypted = decryptData(data, SECRET_KEY);
    return decrypted || {};
  }
  return {};
}

function saveProgress() {
  const progressData = {};
  document.querySelectorAll('.phase-checkbox').forEach((checkbox) => {
    progressData[checkbox.id] = checkbox.checked;
  });
  const encrypted = encryptData(progressData, SECRET_KEY);
  localStorage.setItem(PROGRESS_DATA_KEY, encrypted);
  
  // Also save a JSON file locally with all metadata
  const backup = {
    version: 1,
    timestamp: new Date().toISOString(),
    progress: progressData,
    totalTasks: Object.keys(progressData).length,
    completedTasks: Object.values(progressData).filter(v => v).length
  };
  
  // Store backup in localStorage for sync
  localStorage.setItem('ysh_backup_' + new Date().toISOString().split('T')[0], JSON.stringify(backup));
}

// Auto-save when page is about to close (sync with browser history)
window.addEventListener('beforeunload', () => {
  saveProgress();
});

// Count all tasks in the document (for initialization)
function countAllTasks() {
  const phases = ['ph0', 'ph1', 'ph2', 'ph3', 'ph4', 'ph5', 'ph6', 'ph7', 'ph8', 'ph9'];
  const phaseTotals = {};
  
  phases.forEach((phaseId) => {
    const phaseElement = document.querySelector(`.${phaseId}`);
    const dayTasks = phaseElement ? phaseElement.querySelectorAll('.day-tasks li') : [];
    phaseTotals[phaseId] = dayTasks.length;
  });
  
  return phaseTotals;
}

// Update progress visualization
function updateProgressBar() {
  const phases = ['ph0', 'ph1', 'ph2', 'ph3', 'ph4', 'ph5', 'ph6', 'ph7', 'ph8', 'ph9'];
  const progressData = loadProgress();
  const phaseTotals = countAllTasks();
  let totalCompleted = 0;
  let totalTasks = 0;
  const phaseCompletion = {};

  phases.forEach((phaseId) => {
    // Count all tasks in this phase
    const phaseElement = document.querySelector(`.${phaseId}`);
    const phaseCheckboxes = phaseElement ? phaseElement.querySelectorAll('input[id^="' + phaseId + '-task"]') : [];
    
    let phaseCompleted = 0;
    phaseCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        phaseCompleted++;
        totalCompleted++;
      }
      totalTasks++;
    });
    
    // Use actual count of tasks in phase, not just checkboxes
    const total = phaseTotals[phaseId] || phaseCheckboxes.length;
    const percentage = total > 0 ? Math.round((phaseCompleted / total) * 100) : 0;
    phaseCompletion[phaseId] = { completed: phaseCompleted, total, percentage };
  });

  const totalPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  document.getElementById('totalPercentage').textContent = totalPercentage;
  document.getElementById('totalProgressBar').style.width = totalPercentage + '%';

  // Update phase progress items
  const phaseList = document.getElementById('phaseProgressList');
  phaseList.innerHTML = '';
  phases.forEach((phaseId) => {
    const { completed, total, percentage } = phaseCompletion[phaseId];
    const phaseNames = ['Fondamenta', 'NestJS', 'Auth', 'Angular', 'Redis', 'BullMQ', 'Pagamenti', 'AWS S3', 'Docker', 'Testing'];
    const phaseName = phaseNames[parseInt(phaseId.replace('ph', ''))];
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'phase-progress-item';
    itemDiv.innerHTML = `
      <div class="phase-progress-name">${phaseName}</div>
      <div class="phase-progress-bar">
        <div class="phase-progress-bar-fill" style="width: ${percentage}%; background: var(--${phaseId === 'ph0' ? 'purple' : phaseId === 'ph1' ? 'teal' : phaseId === 'ph2' ? 'rose' : phaseId === 'ph3' ? 'blue' : phaseId === 'ph4' ? 'green' : phaseId === 'ph5' ? 'orange' : phaseId === 'ph6' ? 'cyan' : phaseId === 'ph7' ? 'gold' : phaseId === 'ph8' ? 'blue' : 'gold'});"></div>
      </div>
      <div class="phase-progress-value">${completed}/${total} (${percentage}%)</div>
    `;
    phaseList.appendChild(itemDiv);
  });

  saveProgress();
}

// Initialize
function init() {
  // Transform all <code> tags to <strong> with backticks
  transformCodeTags();
  
  // Add checkboxes to each task (li)
  document.querySelectorAll('.day-tasks li').forEach((taskItem, taskIndex) => {
    const phaseHeader = taskItem.closest('[class*="ph"]');
    let phaseClass = '';
    for (let i = 0; i < 10; i++) {
      if (phaseHeader.classList.contains(`ph${i}`)) {
        phaseClass = `ph${i}`;
        break;
      }
    }

    const dayNumber = taskItem.closest('.day-row')?.querySelector('.day-number')?.textContent || 'unknown';
    const checkboxId = `${phaseClass}-task-${dayNumber}-${taskIndex}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.className = 'phase-checkbox';
    checkbox.style.marginRight = '6px';
    checkbox.style.cursor = 'pointer';

    // Insert checkbox at the beginning of the li
    taskItem.insertBefore(checkbox, taskItem.firstChild);

    checkbox.addEventListener('change', updateProgressBar);
  });

  // Load saved progress
  const progressData = loadProgress();
  Object.keys(progressData).forEach((checkboxId) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.checked = progressData[checkboxId];
  });

  // Setup buttons
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Initial progress update
  updateProgressBar();

  // Collapse all phases except first one
  document.querySelectorAll('.phase').forEach((phase, index) => {
    if (index !== 0) phase.classList.remove('open');
  });
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    showAuthModal();
  } else {
    init();
  }
});

// Original toggle function
function toggle(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.toggle('open');
  }
}

// Keep first phase open
window.addEventListener('load', () => {
  if (isAuthenticated()) {
    document.getElementById('ph0')?.classList.add('open');
  }
});