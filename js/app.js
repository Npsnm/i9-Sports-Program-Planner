const APP_VERSION = "3.0.0 (Marketing Cats, Notes, History & Date Resync)";

let calendarDate = new Date();
calendarDate.setHours(0,0,0,0);
let currentDashFilter = 'active';
let currentTaskView = 'active'; 
let calFilters = { pendingOps: true, pendingMktg: true, inProgress: true, overdue: true, complete: true, milestones: true };

const ROLES = ["System Admin", "Group Owner", "Group Admin", "Program Director", "Staff"];
const DEFAULT_PERMISSIONS = {
    "System Admin": { manageGroups: true, createPrograms: true, editTemplates: true, editTasks: true },
    "Group Owner": { manageGroups: true, createPrograms: true, editTemplates: true, editTasks: true },
    "Group Admin": { manageGroups: true, createPrograms: true, editTemplates: true, editTasks: true },
    "Program Director": { manageGroups: false, createPrograms: false, editTemplates: false, editTasks: true },
    "Staff": { manageGroups: false, createPrograms: false, editTemplates: false, editTasks: false }
};

const MARKETING_CATEGORIES = {
    "HubSpot Email": "bg-orange-500 text-white",
    "Operational Email": "bg-amber-700 text-white",
    "Personal Email": "bg-orange-200 text-orange-900",
    "Road Sign Route": "bg-green-400 text-green-900",
    "Flyer Delivery": "bg-cyan-400 text-cyan-900",
    "Flyer Dispersal": "bg-blue-500 text-white",
    "In Person Event": "bg-yellow-400 text-yellow-900",
    "Task": "bg-pink-400 text-pink-900",
    "Order Flyers": "bg-purple-600 text-white",
    "Marketing Note": "bg-black text-white",
    "Peachjar Request": "bg-teal-400 text-teal-900",
    "Peachjar Active": "bg-lime-300 text-lime-900",
    "Facebook Post": "bg-blue-100 text-blue-800 border border-blue-200",
    "Facebook Ad": "bg-blue-50 text-blue-900 border border-blue-200",
    "Instagram Post": "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200",
    "Instagram Ad": "bg-fuchsia-50 text-fuchsia-900 border border-fuchsia-200",
    "Order Supplies": "bg-gray-200 text-gray-800",
    "Marketing Text": "bg-red-600 text-white",
    "Game Day Reminder": "bg-white text-gray-800 border border-gray-300",
    "Call Fire": "bg-orange-400 text-white",
    "Digital Flyer Submission": "bg-indigo-500 text-white",
    "IPE Application Submission": "bg-white text-gray-800 border border-gray-300",
    "HubSpot Automated Email": "bg-orange-600 text-white",
    "Gameday App Notification": "bg-blue-600 text-white"
};

window.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS;
window.groupPermissions = {}; 

var currentBranding = { 
  title: "TerritoryHub", 
  primaryColor: "#0F172A", 
  primaryLightColor: "#6366F1", 
  accentColor: "#06B6D4", 
  successColor: "#059669",
  dangerColor: "#E11D48",
  secondaryColor: "#E11D48",
  logoUrl: "" 
};
var users = [], currentUser = null, groups = [], programs = [], templates = [], activeTasks = [];

window.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version-display');
    if(versionEl) versionEl.textContent = APP_VERSION;
    applyBrandingUI(); updateTplPreHeaderOptions(); populateYearDropdowns();
    populateMarketingCats();
});

// --- HTML ESCAPING SECURITY UTILITY ---
function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}

// --- FLEXIBLE DATE PASTING & PARSING UTILITIES ---
function parseFlexibleDate(str) {
    if (!str) return '';
    str = str.trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-');
        return `${y}-${m}-${d}`;
    }
    
    const parts = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (parts) {
        let m = parts[1].padStart(2, '0');
        let d = parts[2].padStart(2, '0');
        let y = parts[3];
        if (y.length === 2) y = '20' + y;
        return `${y}-${m}-${d}`;
    }

    const dObj = new Date(str);
    if (!isNaN(dObj.getTime())) {
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return '';
}

function handleDatePaste(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const parsedYYYYMMDD = parseFlexibleDate(pastedText);
    const targetInput = e.target;
    
    if (parsedYYYYMMDD) {
        targetInput.value = formatTargetDate(parsedYYYYMMDD);
        targetInput.dataset.rawDate = parsedYYYYMMDD;
    } else {
        targetInput.value = pastedText;
    }
}

function formatInputDateBlur(inputEl) {
    if (!inputEl.value) {
        inputEl.dataset.rawDate = '';
        return;
    }
    const parsedYYYYMMDD = parseFlexibleDate(inputEl.value);
    if (parsedYYYYMMDD) {
        inputEl.value = formatTargetDate(parsedYYYYMMDD);
        inputEl.dataset.rawDate = parsedYYYYMMDD;
    }
}

function getInputRawDate(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.dataset.rawDate) return el.dataset.rawDate;
    return parseFlexibleDate(el.value);
}

function setInputRawDate(id, yyyyMmDd) {
    const el = document.getElementById(id);
    if (!el) return;
    if (yyyyMmDd) {
        el.value = formatTargetDate(yyyyMmDd);
        el.dataset.rawDate = yyyyMmDd;
    } else {
        el.value = '';
        el.dataset.rawDate = '';
    }
}

function populateMarketingCats() {
    const sels = ['at-mktg-cat', 'tpl-mktg-cat'];
    sels.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const customOpt = el.querySelector('option[value="CUSTOM"]');
            const defaultOpt = el.querySelector('option[value=""]');
            el.innerHTML = '';
            if (defaultOpt) el.appendChild(defaultOpt);
            Object.keys(MARKETING_CATEGORIES).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat; opt.textContent = cat;
                el.appendChild(opt);
            });
            if (customOpt) el.appendChild(customOpt);
        }
    });
}

function formatTargetDate(dStr) {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function calculateNewTargetDate(p, tpl) {
    let anchorDateStr = p[tpl.anchor]; 
    if (!anchorDateStr) return '';
    let d = new Date(anchorDateStr + "T00:00:00");
    let offset = tpl.offsetNum || 0;
    if (tpl.offsetDir === 'Before') offset = -offset;
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

window.activityLogs = [];
function logActivity(groupId, action, details, itemId = null) {
    if(!currentUser) return;
    const log = {
        id: generateId('LOG'),
        groupId: groupId || 'SYSTEM',
        itemId: itemId,
        userName: currentUser.name,
        userEmail: currentUser.username,
        action: action,
        details: details,
        timestamp: new Date().toISOString()
    };
    window.cloudSave('activity_logs', log.id, log);
}

function getRecentLogHTML(itemId) {
    if(!window.activityLogs) return '';
    const logs = window.activityLogs.filter(l => l.itemId === itemId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    if(logs.length > 0) {
        const lg = logs[0];
        return `<div class="text-[9px] text-gray-400 mt-1 italic" title="${lg.details.replace(/"/g, '&quot;')}"><i class="fa-solid fa-clock-rotate-left"></i> ${lg.action} by ${lg.userName} (${new Date(lg.timestamp).toLocaleDateString()})</div>`;
    }
    return '';
}

window.renderActivityLog = function() {
    const tb = document.getElementById('activity-log-table');
    const filterEl = document.getElementById('audit-log-group-filter');
    if(!tb) return; 
    tb.innerHTML = '';
    if(!currentUser) return;

    const agIds = getAuthorizedGroups().map(g => g.id);
    const selectedGroup = filterEl ? filterEl.value : 'ALL';

    const startDateVal = document.getElementById('audit-log-start-date')?.value;
    const startTimeVal = document.getElementById('audit-log-start-time')?.value || '00:00';
    const endDateVal = document.getElementById('audit-log-end-date')?.value;
    const endTimeVal = document.getElementById('audit-log-end-time')?.value || '23:59';

    let startTimestamp = startDateVal ? new Date(`${startDateVal}T${startTimeVal}:00`).getTime() : null;
    let endTimestamp = endDateVal ? new Date(`${endDateVal}T${endTimeVal}:59`).getTime() : null;

    let visibleLogs = window.activityLogs.filter(l => 
        currentUser.territories.includes('ALL') || 
        agIds.includes(l.groupId) || 
        l.userEmail === currentUser.username
    );

    if (selectedGroup !== 'ALL') {
        visibleLogs = visibleLogs.filter(l => l.groupId === selectedGroup);
    }

    if (startTimestamp || endTimestamp) {
        visibleLogs = visibleLogs.filter(l => {
            const logTime = new Date(l.timestamp).getTime();
            if (startTimestamp && logTime < startTimestamp) return false;
            if (endTimestamp && logTime > endTimestamp) return false;
            return true;
        });
    }

    if (visibleLogs.length === 0) {
        tb.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">No activity logs found for the selected criteria.</td></tr>`;
        return;
    }

    visibleLogs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(l => {
        tb.innerHTML += `<tr class="hover:bg-gray-50">
            <td class="p-3 whitespace-nowrap text-[10px] text-gray-500">${new Date(l.timestamp).toLocaleString()}</td>
            <td class="p-3 font-bold text-gray-800">${l.userName}</td>
            <td class="p-3 font-mono text-[10px] text-brandLight">${l.groupId}</td>
            <td class="p-3 font-bold text-gray-700">${l.action}</td>
            <td class="p-3 text-[10px] text-gray-600">${l.details}</td>
        </tr>`;
    });
};

window.clearAuditLogFilters = function() {
    const sDate = document.getElementById('audit-log-start-date');
    const sTime = document.getElementById('audit-log-start-time');
    const eDate = document.getElementById('audit-log-end-date');
    const eTime = document.getElementById('audit-log-end-time');

    if(sDate) sDate.value = '';
    if(sTime) sTime.value = '';
    if(eDate) eDate.value = '';
    if(eTime) eTime.value = '';

    window.renderActivityLog();
};

function openHistoryModal(itemId, itemName) {
    document.getElementById('history-modal-title').textContent = `Change log for: ${itemName}`;
    const tb = document.getElementById('history-modal-table-body');
    tb.innerHTML = '';
    
    const logs = window.activityLogs.filter(l => l.itemId === itemId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    if(logs.length === 0) {
        tb.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">No history logged for this item yet.</td></tr>`;
    } else {
        logs.forEach(l => {
            tb.innerHTML += `<tr class="hover:bg-gray-50">
                <td class="p-3 whitespace-nowrap text-[10px] text-gray-500">${new Date(l.timestamp).toLocaleString()}</td>
                <td class="p-3 font-bold text-gray-800">${l.userName}</td>
                <td class="p-3 font-bold text-brandLight text-[10px]">${l.action}</td>
                <td class="p-3 text-[10px] text-gray-600">${l.details}</td>
            </tr>`;
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
}

function generateTaskPlan(progId, targetLevel) {
    const p = programs.find(x => x.id === progId);
    if (!p) return;
    
    let genCount = 0;
    templates.forEach(tpl => {
        if ((tpl.level || 'Operational') !== targetLevel) return;
        
        if (tpl.groupId !== 'ALL' && tpl.groupId !== p.groupId) return;
        if (tpl.type !== 'ALL' && tpl.type !== p.type) return;
        if (tpl.seasons && !tpl.seasons.includes(p.season)) return;
        if (tpl.preHeader && p.preHeader && tpl.preHeader !== p.preHeader && tpl.preHeader !== 'ALL') return;

        const existing = activeTasks.find(t => t.programId === p.id && t.templateId === tpl.id && t.status !== 'Archived');
        if (existing) return;

        const tDate = calculateNewTargetDate(p, tpl);
        if (!tDate) return;

        const newTask = {
            id: generateId('ATK'),
            programId: p.id,
            groupId: p.groupId,
            templateId: tpl.id,
            type: p.type,
            preHeader: p.preHeader,
            level: tpl.level || 'Operational',
            marketingCategory: tpl.marketingCategory || '', 
            name: tpl.name,
            desc: tpl.desc || '',
            targetDate: tDate,
            assignee: '', 
            status: 'Pending',
            isOneOff: false,
            isNote: false,
            notes: '',
            completionNotes: ''
        };
        window.cloudSaveActiveTask(newTask);
        genCount++;
    });
    logActivity(p.groupId, 'Task Generation', `Generated ${genCount} ${targetLevel} tasks for Program ${p.id}`, p.id);
    showToast(`${targetLevel} Plan Generated`, `Created ${genCount} new tasks for ${p.groupId} ${p.season}.`);
}

function syncProgramTasks(progId) {
    const p = programs.find(x => x.id === progId);
    if (!p) return;

    const linkedTasks = activeTasks.filter(t => t.programId === p.id && !t.isOneOff && t.status !== 'Archived');
    let updateCount = 0;

    linkedTasks.forEach(t => {
        const tpl = templates.find(x => x.id === t.templateId);
        if (tpl) {
            const newDate = calculateNewTargetDate(p, tpl);
            if (newDate && t.targetDate !== newDate) {
                t.targetDate = newDate;
                window.cloudSaveActiveTask(t);
                updateCount++;
            }
        }
    });

    logActivity(p.groupId, 'Task Dates Synced', `Re-aligned ${updateCount} task dates for Program ${p.id}`, p.id);
    showToast("Sync Complete", `${updateCount} task deadlines were updated to match the current program milestones.`);
}

function saveBranding(e) {
    e.preventDefault();
    currentBranding.title = document.getElementById('branding-title-input').value;
    window.cloudSaveBranding(currentBranding);
    applyBrandingUI();
    closeModals();
    showToast("Branding Saved", "Theme updated successfully.");
}

function populateYearDropdowns() {
    const currentYear = new Date().getFullYear(); 
    const startYear = 2026;
    const endYear = currentYear + 4;
    
    let yearsSet = new Set();
    for(let y = startYear; y <= endYear; y++) yearsSet.add(y.toString());
    
    if (window.programs) {
        window.programs.forEach(p => { if (p.year) yearsSet.add(p.year.toString()); });
    }
    
    let sortedYears = Array.from(yearsSet).sort((a,b) => parseInt(a) - parseInt(b));
    
    const yearEls = ['prog-year', 'filter-prog-year', 'be-year'];
    yearEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            let prevVal = el.value;
            let html = id === 'filter-prog-year' ? '<option value="ALL">All Years</option>' : '';
            sortedYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
            el.innerHTML = html;
            if (prevVal && sortedYears.includes(prevVal)) el.value = prevVal;
        }
    });
}

function getUSHoliday(dateObj) {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();

    const nthDay = (nth, targetDayOfWeek, month) => {
        let count = 0;
        for (let i = 1; i <= 31; i++) {
            let tempDate = new Date(y, month, i);
            if (tempDate.getMonth() !== month) break;
            if (tempDate.getDay() === targetDayOfWeek) count++;
            if (count === nth) return i;
        }
        return null;
    };

    const lastDay = (targetDayOfWeek, month) => {
        for (let i = 31; i > 0; i--) {
            let tempDate = new Date(y, month, i);
            if (tempDate.getMonth() === month && tempDate.getDay() === targetDayOfWeek) return i;
        }
        return null;
    };

    if (m === 0 && d === 1) return "New Year's Day";
    if (m === 0 && d === nthDay(3, 1, 0)) return "MLK Jr. Day";
    if (m === 1 && d === nthDay(3, 1, 1)) return "Presidents' Day";
    if (m === 4 && d === lastDay(1, 4)) return "Memorial Day";
    if (m === 5 && d === 19) return "Juneteenth";
    if (m === 6 && d === 4) return "Independence Day";
    if (m === 8 && d === nthDay(1, 1, 8)) return "Labor Day";
    if (m === 9 && d === nthDay(2, 1, 9)) return "Columbus Day";
    if (m === 10 && d === 11) return "Veterans Day";
    if (m === 10 && d === nthDay(4, 4, 10)) return "Thanksgiving";
    if (m === 11 && d === 25) return "Christmas Day";

    return null;
}

function showToast(title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = "bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs flex items-center gap-3 border border-gray-700 transition-all duration-300 pointer-events-auto";
    toast.innerHTML = `
        <div class="text-brandAccent"><i class="fa-solid fa-circle-check text-base"></i></div>
        <div>
            <p class="font-bold">${title}</p>
            <p class="text-gray-300 text-[11px]">${message}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setFormLoading(formEl, isLoading, loadingText = "Saving...") {
    if (!formEl) return;
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const inputs = formEl.querySelectorAll('input, select, textarea, button');

    if (isLoading) {
        inputs.forEach(i => i.disabled = true);
        if (submitBtn) {
            submitBtn.dataset.originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> ${loadingText}`;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        }
    } else {
        inputs.forEach(i => i.disabled = false);
        if (submitBtn && submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }
}

const PERSISTENT_FILTER_IDS = [
    'filter-cal-group', 'filter-cal-prog-type', 'filter-cal-program', 'filter-cal-season',
    'filter-task-group', 'filter-task-program', 'filter-task-level', 'filter-task-assignee', 'filter-task-status',
    'filter-prog-group', 'filter-prog-year', 'filter-prog-season', 'filter-prog-type',
    'filter-template-group', 'filter-template-type',
    'workload-group-filter', 'audit-log-group-filter'
];

function saveFilterState(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.value !== undefined) {
        localStorage.setItem(`pd_filter_${elementId}`, el.value);
    }
}

function restoreSavedFilters() {
    PERSISTENT_FILTER_IDS.forEach(id => {
        const el = document.getElementById(id);
        const savedVal = localStorage.getItem(`pd_filter_${id}`);
        if (el && savedVal !== null) {
            const optionExists = Array.from(el.options).some(opt => opt.value === savedVal);
            if (optionExists) {
                el.value = savedVal;
            }
        }
    });
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
}

window.toggleAuthMode = toggleAuthMode;
window.login = login;
window.signup = signup;
window.logout = logout;
window.triggerPasswordReset = triggerPasswordReset;
window.loginWithGoogle = loginWithGoogle;
window.togglePasswordVisibility = togglePasswordVisibility;
window.toggleSignupAction = toggleSignupAction;
window.switchTab = switchTab;
window.openReportModal = openReportModal;
window.exportCurrentViewToCSV = exportCurrentViewToCSV;
window.closeModals = closeModals;

/* --- AUTHENTICATION & USER MANAGEMENT --- */
function toggleAuthMode(mode) {
    const err = document.getElementById('auth-error'); err.classList.add('hidden');
    if (mode === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-signup').classList.add('hidden');
        document.getElementById('tab-login').className = "flex-1 py-3 bg-white text-brandLight border-b-2 border-brandLight";
        document.getElementById('tab-signup').className = "flex-1 py-3 bg-gray-50 text-gray-500 hover:text-gray-700 border-b-2 border-transparent";
        document.getElementById('auth-title').textContent = "Sign In to PD Planner";
    } else {
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-signup').classList.remove('hidden');
        document.getElementById('tab-signup').className = "flex-1 py-3 bg-white text-brandLight border-b-2 border-brandLight";
        document.getElementById('tab-login').className = "flex-1 py-3 bg-gray-50 text-gray-500 hover:text-gray-700 border-b-2 border-transparent";
        document.getElementById('auth-title').textContent = "Request Access";
    }
}

function toggleSignupAction() {
    const action = document.querySelector('input[name="signup-action"]:checked').value;
    if(action === 'create') { 
        document.getElementById('signup-create-fields').classList.remove('hidden'); 
        document.getElementById('signup-join-fields').classList.add('hidden'); 
    } else { 
        document.getElementById('signup-create-fields').classList.add('hidden'); 
        document.getElementById('signup-join-fields').classList.remove('hidden'); 
    }
}

async function login(e) {
e.preventDefault();
    const em = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-password').value.trim();
    
    if (!em || !pw) return showError("Please enter both email and password.");

    try {
        showToast("Connecting", "Verifying credentials...");

        const isMasterAdmin = (em === 'nick@npsnm.com');
        let authUser = null;

        // Isolated Firebase Auth check so errors don't crash the function before unlocking
        if (window.auth && typeof window.signInWithEmailAndPassword === 'function') {
            try {
                const userCredential = await window.signInWithEmailAndPassword(window.auth, em, pw);
                authUser = userCredential.user;
            } catch (authErr) {
                console.warn("Firebase Auth Notice:", authErr.message);
                if (!isMasterAdmin) throw authErr;
            }
        }

        if (!window.users) window.users = [];

        let matched = window.users.find(u => u && u.username && u.username.toLowerCase() === em);

        // Fetch directly from cloud if local cache hasn't synced yet
        if (!matched && typeof window.cloudGetUser === 'function') {
            try {
                matched = await window.cloudGetUser(em);
                if (matched) window.users.push(matched);
            } catch (err) {
                console.warn("Cloud user check notice:", err);
            }
        }

        if (!matched) {
            throw new Error("User record not found. Please click 'Register / Join Group' first.");
        }
        if (isMasterAdmin) {
            matched.role = 'System Admin';
            matched.status = 'Active';
            matched.territories = ['ALL'];
            if (window.cloudSaveUser) await window.cloudSaveUser(matched);
        }

        if (!matched.territories) matched.territories = ['ALL'];

        currentUser = matched; 
        window.currentUser = matched; 
        
        const errEl = document.getElementById('auth-error');
        if (errEl) errEl.classList.add('hidden');

        unlockPortal();
        showToast("Welcome", `Logged in as ${matched.name}`);

    } catch (error) { 
        console.error("Login Error:", error);
        showError(error.message || "Authentication failed. Check credentials or register first."); 
    }
}
async function triggerPasswordReset() {
    const em = document.getElementById('login-email').value.trim();
    if (!em) return showError("Please enter your email address first to reset your password.");
    try { await window.sendPasswordResetEmail(window.auth, em); document.getElementById('auth-error').classList.add('hidden'); alert(`Success! A password reset link has been sent to ${em}.`); } catch (error) { showError("Error: " + error.message); }
}

async function adminSendPasswordReset(email) {
    if(confirm(`Send an automated password reset email to ${email}?`)) {
        try { await window.sendPasswordResetEmail(window.auth, email); showToast("Success", `Reset link sent to ${email}`); } catch(error) { alert("Error sending reset link: " + error.message); }
    }
}

function generateInviteEmail() {
    const email = document.getElementById('invite-email-input').value.trim();
    const subject = encodeURIComponent("Invitation: Access the Program Director Planner");
    const body = encodeURIComponent(`Hello,\n\nYou have been invited to join the Program Director Planner portal.\n\nPlease visit the portal, click 'Register / Join Group', and set up your secure account.\n\nThank you.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`; showToast("Draft Generated", "Your email client should open shortly.");
}

async function signup(e) {
    e.preventDefault();
    const fName = document.getElementById('signup-first').value.trim(); const lName = document.getElementById('signup-last').value.trim();
    const phone = document.getElementById('signup-phone').value.trim(); 
    const em = document.getElementById('signup-email').value.trim().toLowerCase(); 
    const pw = document.getElementById('signup-password').value.trim(); const action = document.querySelector('input[name="signup-action"]:checked').value;
    
    const fullName = `${fName} ${lName}`;
    const uObj = { username: em, name: fullName, firstName: fName, lastName: lName, phone: phone, role: 'Pending', territories: [] };
    let newGroupData = null;

    if(action === 'create') {
        let requestedId = document.getElementById('signup-create-id').value.trim();
        const gName = document.getElementById('signup-create-name').value.trim();
        
        if (!gName) return showError("Please provide a Group Name.");

        if (requestedId) {
            if (groups.find(g => String(g.id) === requestedId)) {
                return showError(`Group Number ${requestedId} is already in use. Please select 'Join Existing' or choose a different number.`);
            }
        } else {
            const validIds = groups.map(g => parseInt(g.id)).filter(id => !isNaN(id));
            requestedId = ((validIds.length > 0 ? Math.max(...validIds) : 8764) + 1).toString();
        }

        newGroupData = { id: requestedId, name: gName, fullName: `${requestedId} - ${gName}`, status: 'Active' };
        uObj.role = 'Group Owner'; 
        uObj.territories = [requestedId];
    } else {
        const joinId = document.getElementById('signup-join-id').value.trim();
        if(!joinId) return showError("Please enter a Group ID to join.");
        uObj.territories = [joinId];
    }
    
    try {
        showToast("Registering", "Creating secure account...");
        window.isRegistering = true; 
        
        await window.createUserWithEmailAndPassword(window.auth, em, pw);
        
        if (newGroupData) await window.cloudSaveGroup(newGroupData);
        await window.cloudSaveUser(uObj);
        
        window.currentUser = uObj;
        currentUser = uObj;

        window.isRegistering = false; 
        unlockPortal();
        
    } catch (error) { 
        window.isRegistering = false;
        showError("Database Error: " + error.message); 
    }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    // Forces prompt select account to avoid silent session locks
    provider.setCustomParameters({ prompt: 'select_account' }); 

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    showToast("Success", `Verified ${user.email}`);
    // Handle matched user and portal unlock...
  } catch (error) {
    console.error("Google Auth Error:", error);
    showError(error.message);
  }
}

async function logout() {
    try { 
        if (typeof window.detachRealtimeListeners === 'function') {
            window.detachRealtimeListeners();
        }
        if (window.signOut) await window.signOut(); 
    } catch (e) { console.error("Sign out error:", e); }
    currentUser = null; window.currentUser = null;

    const headerReportBtn = document.querySelector('button[onclick="openReportModal()"]');
    const headerExportBtn = document.querySelector('button[onclick="exportCurrentViewToCSV()"]');
    const headerUserBadge = document.getElementById('user-badge');
    if (headerReportBtn) headerReportBtn.classList.remove('hidden');
    if (headerExportBtn) headerExportBtn.classList.remove('hidden');
    if (headerUserBadge) headerUserBadge.classList.remove('hidden');

    const overlay = document.getElementById('auth-overlay');
    if (overlay) { 
        overlay.style.display = 'flex'; 
        overlay.classList.remove('hidden'); 
    }
    showToast("Signed Out", "Securely disconnected.");
}
function showError(msg) { document.getElementById('auth-error-text').textContent = msg; document.getElementById('auth-error').classList.remove('hidden'); }

function unlockPortal() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    
    if (window.isRegistering) return;

    if (currentUser.status === "Archived" || currentUser.status === "Frozen") { showError("Your account has been archived or temporarily disabled."); logout(); return; }
    
    const overlay = document.getElementById('auth-overlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.style.display = 'none'; }
    
    populateFilterOptions(); populateProfileForm(); applyPermissions(); 
    
    const headerReportBtn = document.querySelector('button[onclick="openReportModal()"]');
    const headerExportBtn = document.querySelector('button[onclick="exportCurrentViewToCSV()"]');
    const headerUserBadge = document.getElementById('user-badge');

    const sidebar = document.getElementById('sidebar');

        if (currentUser.role === "Pending" || currentUser.role === "Denied") {
            if (headerReportBtn) headerReportBtn.classList.add('hidden');
            if (headerExportBtn) headerExportBtn.classList.add('hidden');
            if (headerUserBadge) headerUserBadge.classList.add('hidden');
            if (sidebar) sidebar.classList.add('hidden');

            document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));

            if (currentUser.role === "Pending") {
                document.getElementById('pending-group-display').textContent = (currentUser.territories || []).join(', ');
                document.getElementById('view-pending').classList.remove('hidden');
            } else {
                document.getElementById('denied-group-display').textContent = (currentUser.territories || []).join(', ');
                document.getElementById('view-denied').classList.remove('hidden');
            }
        } else {
            if (headerReportBtn) headerReportBtn.classList.remove('hidden');
            if (headerExportBtn) headerExportBtn.classList.remove('hidden');
            if (headerUserBadge) headerUserBadge.classList.remove('hidden');
            if (sidebar) sidebar.classList.remove('hidden');

            const vPending = document.getElementById('view-pending');
            if (vPending) vPending.classList.add('hidden');
            const vDenied = document.getElementById('view-denied');
            if (vDenied) vDenied.classList.add('hidden');

            renderDashboard(); renderControlCenter(); renderTemplates(); renderActiveTasks(); checkPendingAlerts(); renderGroupPills(); renderUsersTable(); renderWorkloadSummary(); renderCalendar();
            
            handleInitialRoute();
        }

function checkPendingAlerts() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    const badge = document.getElementById('admin-alert-badge');
    if (!badge || !currentUser) return;
    
    if(hasPermission('manageGroups')) {
        const agIds = getAuthorizedGroups().map(g => String(g.id));
        const currTerrs = (currentUser.territories || []).map(t => String(t));
        
        const pendingCount = users.filter(u => {
            if (u.role !== 'Pending') return false;
            const userTerrs = (u.territories || []).map(t => String(t));
            return currTerrs.includes('ALL') || userTerrs.some(t => agIds.includes(t));
        }).length;
        
        if(pendingCount > 0) { 
            badge.textContent = pendingCount; 
            badge.classList.remove('hidden'); 
        } else { 
            badge.classList.add('hidden'); 
        }
    } else { 
        badge.classList.add('hidden'); 
    }
}

function hasPermission(permKey) {
    if (!currentUser) return false;
    if (currentUser.role === 'System Admin') return true;
    
    let hasIt = false;
    const terrs = currentUser.territories || [];
    const checkGroups = terrs.includes('ALL') ? groups.map(g=>g.id) : terrs;
    
    for (let gId of checkGroups) {
        let gPerms = window.groupPermissions[gId] || window.DEFAULT_PERMISSIONS;
        let rolePerms = gPerms[currentUser.role] || window.DEFAULT_PERMISSIONS["Staff"];
        if (rolePerms[permKey]) {
            hasIt = true;
            break;
        }
    }
    return hasIt;
}

   function applyPermissions() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    
    if (!currentUser.territories) currentUser.territories = ['ALL'];

    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = `${currentUser.name} (${currentUser.role})`;

    const scopeEl = document.getElementById('user-display-scope');
    if (scopeEl) scopeEl.textContent = `Groups: ${currentUser.territories.includes('ALL') ? 'All Groups' : currentUser.territories.join(', ') || 'None'}`;
    
    const canManageGroups = hasPermission('manageGroups');
    const canCreatePrograms = hasPermission('createPrograms');
    const canEditTemplates = hasPermission('editTemplates');
    const canEditTasks = hasPermission('editTasks');
    
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.permission-manage-groups').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.permission-create-program').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.permission-edit-template').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.permission-edit-tasks').forEach(el => el.classList.add('hidden'));

    if (currentUser.role === 'System Admin') document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    if (canManageGroups) { 
        document.querySelectorAll('.permission-manage-groups').forEach(el => el.classList.remove('hidden')); 
        const adminBtn = document.getElementById('nav-admin') || document.getElementById('tab-admin');
        if (adminBtn) adminBtn.classList.remove('hidden'); 
    }
    if (canCreatePrograms) document.querySelectorAll('.permission-create-program').forEach(el => el.classList.remove('hidden'));
    if (canEditTemplates) document.querySelectorAll('.permission-edit-template').forEach(el => el.classList.remove('hidden'));
    if (canEditTasks) document.querySelectorAll('.permission-edit-tasks').forEach(el => el.classList.remove('hidden'));
}

function populateProfileForm() {
    if (!currentUser) return;
    document.getElementById('setting-first').value = currentUser.firstName || '';
    document.getElementById('setting-last').value = currentUser.lastName || '';
    document.getElementById('setting-phone').value = currentUser.phone || '';
}

function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;
    currentUser.firstName = document.getElementById('setting-first').value.trim();
    currentUser.lastName = document.getElementById('setting-last').value.trim();
    currentUser.name = `${currentUser.firstName} ${currentUser.lastName}`;
    currentUser.phone = document.getElementById('setting-phone').value.trim();
    window.cloudSaveUser(currentUser);
    applyPermissions(); 
    showToast("Success", "Personal profile details updated.");
}

async function handleEmailUpdate(e) {
    e.preventDefault(); if (!currentUser) return;
    const newEmail = document.getElementById('setting-new-email').value.trim();
    try { await window.updateEmail(window.auth.currentUser, newEmail); currentUser.username = newEmail; window.currentUser = currentUser; window.cloudSaveUser(currentUser); showToast("Success", "Email updated in cloud."); } catch (err) { alert(err.message); }
}

async function handlePasswordUpdate(e) {
    e.preventDefault(); if (!currentUser) return;
    const pw = document.getElementById('setting-new-password').value;
    try { await window.updatePassword(window.auth.currentUser, pw); showToast("Success", "Password forcefully updated."); } catch (err) { alert("Security Notice: Please sign out and sign back in before updating password. " + err.message); }
}

async function linkGoogleAccount() { try { await window.linkGoogle(); showToast("Success", "Google account linked successfully!"); } catch (err) { alert(err.message); } }

/* --- NAVIGATION & SIDEBAR MANAGEMENT --- */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        
        if (toggleIcon) {
            if (sidebar.classList.contains('collapsed')) {
                toggleIcon.classList.remove('fa-chevron-left');
                toggleIcon.classList.add('fa-chevron-right');
            } else {
                toggleIcon.classList.remove('fa-chevron-right');
                toggleIcon.classList.add('fa-chevron-left');
            }
        }
    }
}

function switchTab(tab, updateHash = true) {
    if (!tab) tab = 'dashboard';

    // Prevent navigation for pending or denied accounts
    if (currentUser && (currentUser.role === 'Pending' || currentUser.role === 'Denied')) {
        return;
    }

    // Synchronize address bar URL hash
    if (updateHash && window.location.hash !== `#${tab}`) {
        window.location.hash = tab;
    }

    // Reset all sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.className = "sidebar-btn w-full px-3 py-2.5 rounded-lg font-semibold flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 transition" + 
            (btn.classList.contains('permission-manage-groups') ? ' hidden permission-manage-groups' : '') + 
            (btn.classList.contains('admin-only') ? ' hidden admin-only' : '');
    });

    // Hide all view sections
    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));

    // Highlight active sidebar button
    const activeNav = document.getElementById(`nav-${tab}`);
    if (activeNav) {
        activeNav.className = "sidebar-btn w-full px-3 py-2.5 rounded-lg font-bold flex items-center gap-3 text-white bg-indigo-600 transition shadow-sm" +
            (activeNav.classList.contains('permission-manage-groups') ? ' permission-manage-groups' : '') + 
            (activeNav.classList.contains('admin-only') ? ' admin-only' : '');
    }

    // Display active tab view
    const targetView = document.getElementById(`view-${tab}`);
    if (targetView) targetView.classList.remove('hidden');

    if (tab === 'dashboard') renderDashboard();
    if (tab === 'calendar') renderCalendar();
    if (tab === 'settings') populateProfileForm();
    applyPermissions(); 
}

/* --- URL ROUTING & DEEP LINKING --- */
function handleInitialRoute() {
    if (!currentUser || currentUser.role === 'Pending' || currentUser.role === 'Denied') return;
    const route = window.location.hash.replace('#', '').trim();
    const validTabs = ['dashboard', 'calendar', 'tasks', 'control', 'templates', 'admin', 'settings'];
    
    if (route && validTabs.includes(route)) {
        switchTab(route, true);
    } else {
        switchTab('dashboard', true);
    }
}

// Automatically navigate when clicking Browser Back / Forward buttons
window.addEventListener('hashchange', () => {
    if (!currentUser || currentUser.role === 'Pending' || currentUser.role === 'Denied') return;
    const route = window.location.hash.replace('#', '').trim();
    const validTabs = ['dashboard', 'calendar', 'tasks', 'control', 'templates', 'admin', 'settings'];
    if (route && validTabs.includes(route)) {
        const targetView = document.getElementById(`view-${route}`);
        if (targetView && targetView.classList.contains('hidden')) {
            switchTab(route, false);
        }
    }
});

/* --- URL ROUTING & DEEP LINKING --- */
function handleInitialRoute() {
    if (!currentUser) return;
    const route = window.location.hash.replace('#', '').trim();
    const validTabs = ['dashboard', 'calendar', 'tasks', 'control', 'templates', 'admin', 'settings'];
    
    if (route && validTabs.includes(route)) {
        switchTab(route, true);
    } else {
        switchTab('dashboard', true);
    }
}

// Listen for browser Back / Forward actions or manual URL hash changes
window.addEventListener('hashchange', () => {
    if (!currentUser) return;
    const route = window.location.hash.replace('#', '').trim();
    const validTabs = ['dashboard', 'calendar', 'tasks', 'control', 'templates', 'admin', 'settings'];
    if (route && validTabs.includes(route)) {
        const targetView = document.getElementById(`view-${route}`);
        if (targetView && targetView.classList.contains('hidden')) {
            switchTab(route, false);
        }
    }
});
function generateId(prefix) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`; }
function getAuthorizedGroups() { 
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return [];
    const terrs = currentUser.territories || [];
    return terrs.includes('ALL') ? groups.filter(g=>g.status!=='Archived') : groups.filter(g => terrs.includes(g.id) && g.status!=='Archived'); 
}
function closeModals() { document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden')); }

function populateFilterOptions() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const ag = getAuthorizedGroups();
    const pGroup = document.getElementById('prog-group');
    const atGroup = document.getElementById('at-program');
    const tplGroup = document.getElementById('tpl-group');
    const calProgramFilter = document.getElementById('filter-cal-program');
    const calGroupFilter = document.getElementById('filter-cal-group');
    const permGroupSelect = document.getElementById('perm-group-select'); 
    
    if(pGroup) pGroup.innerHTML = ''; if(atGroup) atGroup.innerHTML = '';
    if(tplGroup) tplGroup.innerHTML = '<option value="ALL">All Groups</option>';
    if(calProgramFilter) calProgramFilter.innerHTML = '<option value="ALL">All Specific Programs</option>';
    if(calGroupFilter) calGroupFilter.innerHTML = '<option value="ALL">All Authorized Groups</option>';
    if(permGroupSelect) permGroupSelect.innerHTML = '<option value="ALL">-- Select Specific Group --</option>';
    
    ag.forEach(g => { 
        if(pGroup) pGroup.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
        if(tplGroup) tplGroup.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
        if(calGroupFilter) calGroupFilter.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
        if(permGroupSelect) permGroupSelect.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
    });

    programs.forEach(p => { 
        if (ag.some(g=>g.id===p.groupId)) { 
            const priceDisplay = p.price ? ` - $${p.price}` : '';
            if(atGroup) atGroup.innerHTML += `<option value="${p.id}">[${p.groupId}] ${p.preHeader} ${p.season} - ${p.type}${priceDisplay}</option>`; 
            if(calProgramFilter) calProgramFilter.innerHTML += `<option value="${p.id}">[${p.groupId}] ${p.preHeader} ${p.season} ${p.type}${priceDisplay}</option>`;
        } 
    });

    const filters = ['filter-prog-group', 'filter-task-group', 'filter-template-group'];
    filters.forEach(f => {
        const el = document.getElementById(f);
        if(el) { el.innerHTML = '<option value="ALL">All Authorized Groups</option>'; ag.forEach(g => el.innerHTML += `<option value="${g.id}">${g.fullName}</option>`); }
    });

    const asSel = document.getElementById('at-assignee');
    const bulkAsSel = document.getElementById('be-assignee');
    const tplRoleSel = document.getElementById('tpl-role');

    if(asSel) {
        asSel.innerHTML = '<option value="">-- Leave Unassigned --</option>'; 
        if (bulkAsSel) bulkAsSel.innerHTML = '<option value="">-- Leave Unassigned --</option>';
        if (tplRoleSel) tplRoleSel.innerHTML = '<option value="">-- Unassigned / Any Staff --</option>';

        if (tplRoleSel) {
            ROLES.forEach(r => {
                if (r === 'System Admin' && currentUser && currentUser.role !== 'System Admin') return;
                tplRoleSel.innerHTML += `<option value="${r}">Role: ${r}</option>`;
            });
        }
        
        users.forEach(u => { 
            if (u.role === 'System Admin' && currentUser && currentUser.role !== 'System Admin') return;
            
            asSel.innerHTML += `<option value="${u.name}">${u.name} (${u.role})</option>`; 
            if (bulkAsSel) bulkAsSel.innerHTML += `<option value="${u.name}">${u.name} (${u.role})</option>`; 
            if (tplRoleSel && u.status !== 'Archived' && u.status !== 'Frozen') {
                tplRoleSel.innerHTML += `<option value="${u.name}">User: ${u.name}</option>`;
            }
        });
        
        asSel.innerHTML += '<option value="CUSTOM" class="font-bold text-brandLight">+ Custom / External...</option>';
        if (bulkAsSel) bulkAsSel.innerHTML += '<option value="CUSTOM" class="font-bold text-brandLight">+ Custom / External...</option>';
        if (tplRoleSel) tplRoleSel.innerHTML += '<option value="CUSTOM" class="font-bold text-brandLight">+ Custom Role / Person...</option>';
    }
    
    const auditFilter = document.getElementById('audit-log-group-filter');
    if (auditFilter) {
        auditFilter.innerHTML = '<option value="ALL">All Groups</option><option value="SYSTEM">System Events</option>';
        ag.forEach(g => {
            auditFilter.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
        });
    }

    restoreSavedFilters();
    renderPermissions(); 
}

/* --- CALENDAR SYSTEM --- */
function goToToday() {
    calendarDate = new Date();
    calendarDate.setHours(0,0,0,0);
    const jumpInput = document.getElementById('calendar-jump-date');
    if(jumpInput) {
        jumpInput.value = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth()+1).padStart(2,'0')}-${String(calendarDate.getDate()).padStart(2,'0')}`;
    }
    renderCalendar();
}

function jumpToDate(val) {
    if(!val) return;
    const [y, m, d] = val.split('-');
    calendarDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    calendarDate.setHours(0,0,0,0);
    renderCalendar();
}

function changeCalendarDate(offset) {
    const view = document.querySelector('input[name="cal-view-type"]:checked').value;
    if (view === 'month') {
        calendarDate.setMonth(calendarDate.getMonth() + offset);
    } else if (view === 'week') {
        calendarDate.setDate(calendarDate.getDate() + (offset * 7));
    } else if (view === 'day') {
        calendarDate.setDate(calendarDate.getDate() + offset);
    }
    renderCalendar();
}

function toggleCalFilter(key) {
    calFilters[key] = !calFilters[key];
    const btn = document.getElementById('cal-filt-' + key);
    if(calFilters[key]) {
        btn.classList.remove('opacity-40', 'grayscale');
        btn.classList.add('bg-gray-50');
    } else {
        btn.classList.add('opacity-40', 'grayscale');
        btn.classList.remove('bg-gray-50');
    }
    renderCalendar();
}

function renderCalendar() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    
    const grid = document.getElementById('calendar-grid');
    const headerGrid = document.getElementById('calendar-header-grid');
    if(!grid || !headerGrid) return;

    const agIds = getAuthorizedGroups().map(g=>g.id);
    const view = document.querySelector('input[name="cal-view-type"]:checked').value;
    
    const fGroup = document.getElementById('filter-cal-group') ? document.getElementById('filter-cal-group').value : 'ALL';
    const fProgType = document.getElementById('filter-cal-prog-type').value;
    const fProgramId = document.getElementById('filter-cal-program').value;
    const fSeason = document.getElementById('filter-cal-season').value;

    const today = new Date(); today.setHours(0,0,0,0);
    
    const jumpInput = document.getElementById('calendar-jump-date');
    if(jumpInput) {
        jumpInput.value = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth()+1).padStart(2,'0')}-${String(calendarDate.getDate()).padStart(2,'0')}`;
    }
    
    grid.innerHTML = '';
    
    if (view === 'month') {
        headerGrid.className = "grid grid-cols-7 gap-2 mb-2";
        headerGrid.innerHTML = `
            <div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Sun</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Mon</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Tue</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Wed</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Thu</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Fri</div><div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">Sat</div>
        `;
        grid.className = "grid grid-cols-7 gap-2";

        const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
        const displayEl = document.getElementById('calendar-date-display');
        if(displayEl) displayEl.textContent = new Date(y, m, 1).toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
        
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        
        for(let i=0; i<firstDay; i++) { grid.innerHTML += `<div class="h-28 bg-gray-50/50 rounded border border-gray-100"></div>`; }
        
        for(let d=1; d<=daysInMonth; d++) {
            const renderDate = new Date(y, m, d);
            const dayStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            grid.innerHTML += generateCalendarDayCell(dayStr, d, renderDate, today, agIds, fGroup, fProgType, fProgramId, fSeason, "h-28", view);
        }

    } else if (view === 'week') {
        headerGrid.className = "grid grid-cols-7 gap-2 mb-2";
        grid.className = "grid grid-cols-7 gap-2";
        
        const startOfWeek = new Date(calendarDate);
        startOfWeek.setDate(calendarDate.getDate() - calendarDate.getDay());
        startOfWeek.setHours(0,0,0,0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(0,0,0,0);
        
        const displayEl = document.getElementById('calendar-date-display');
        if(displayEl) displayEl.textContent = `${startOfWeek.toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${endOfWeek.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`;

        headerGrid.innerHTML = '';
        for(let i=0; i<7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            headerGrid.innerHTML += `<div class="font-bold text-center text-[10px] text-gray-500 uppercase tracking-wider">${days[i]} ${currentDay.getDate()}</div>`;
            
            const dayStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth()+1).padStart(2,'0')}-${String(currentDay.getDate()).padStart(2,'0')}`;
            grid.innerHTML += generateCalendarDayCell(dayStr, currentDay.getDate(), currentDay, today, agIds, fGroup, fProgType, fProgramId, fSeason, "h-64", view);
        }

    } else if (view === 'day') {
        headerGrid.className = "grid grid-cols-1 mb-2";
        grid.className = "grid grid-cols-1 gap-2";

        const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        headerGrid.innerHTML = `<div class="font-bold text-left text-sm text-brandLight uppercase tracking-wider">${daysFull[calendarDate.getDay()]} Schedule</div>`;

        const displayEl = document.getElementById('calendar-date-display');
        if(displayEl) displayEl.textContent = calendarDate.toLocaleDateString('en-US', {month: 'long', day:'numeric', year: 'numeric'});

        const dayStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth()+1).padStart(2,'0')}-${String(calendarDate.getDate()).padStart(2,'0')}`;
        grid.innerHTML += generateCalendarDayCell(dayStr, calendarDate.getDate(), calendarDate, today, agIds, fGroup, fProgType, fProgramId, fSeason, "min-h-[400px]", view);
    }
}

function generateCalendarDayCell(dayStr, displayDay, renderDate, todayDate, agIds, fGroup, fProgType, fProgramId, fSeason, heightClass = "h-28", view = "month") {
    renderDate.setHours(0,0,0,0);
    const isToday = renderDate.getTime() === todayDate.getTime();
    const holidayName = getUSHoliday(renderDate);

    const dayTasks = activeTasks.filter(t => {
        if(t.targetDate !== dayStr) return false;
        if(t.status === 'Archived') return false; 
        if(!agIds.includes(t.groupId)) return false;
        if(fGroup !== 'ALL' && t.groupId !== fGroup) return false; 
        
        const isComplete = t.status === 'Complete';
        const isInProgress = t.status === 'In Progress';
        const isOverdue = !isComplete && (renderDate < todayDate) && !t.isNote;
        const taskLevel = t.level || 'Operational';

        if(isComplete && !calFilters.complete) return false;
        if(isOverdue && !calFilters.overdue) return false;
        if(isInProgress && !calFilters.inProgress) return false;
        if(!isComplete && !isOverdue && !isInProgress) {
            if(taskLevel === 'Operational' && !calFilters.pendingOps) return false;
            if(taskLevel === 'Marketing' && !calFilters.pendingMktg) return false;
        }

        if(fProgramId !== 'ALL' && t.programId !== fProgramId) return false;
        
        const p = programs.find(x => x.id === t.programId);
        if(p) {
            if(fProgType !== 'ALL' && p.type !== fProgType) return false;
            if(fSeason !== 'ALL' && p.season !== fSeason) return false;
        } else if (fProgType !== 'ALL' || fSeason !== 'ALL') return false; 

        return true;
    });

    let milestonesHTML = '';
    if(calFilters.milestones !== false) {
        const dayPrograms = programs.filter(p => {
            if(!agIds.includes(p.groupId)) return false;
            if(fGroup !== 'ALL' && p.groupId !== fGroup) return false;
            if(fProgramId !== 'ALL' && p.id !== fProgramId) return false;
            if(fProgType !== 'ALL' && p.type !== fProgType) return false;
            if(fSeason !== 'ALL' && p.season !== fSeason) return false;
            
            const isSecStart = Array.isArray(p.secStartDates) && p.secStartDates.includes(dayStr);
            const isBye = Array.isArray(p.byeDates) && p.byeDates.includes(dayStr);
            return p.dateStart === dayStr || p.dateStart2 === dayStr || p.dateFinal === dayStr || p.dateEarly === dayStr || p.dateOffseason === dayStr || isBye || isSecStart;
        });

        dayPrograms.forEach(p => {
            const milestoneTypes = [];
            if(p.dateStart === dayStr) milestoneTypes.push("Start Date");
            if(p.dateStart2 === dayStr) milestoneTypes.push("Secondary Start");
            if(Array.isArray(p.secStartDates) && p.secStartDates.includes(dayStr)) milestoneTypes.push("Secondary Start");
            if(p.dateFinal === dayStr) milestoneTypes.push("Final Deadline");
            if(p.dateEarly === dayStr) milestoneTypes.push("Early Deadline");
            if(p.dateOffseason === dayStr) milestoneTypes.push("Offseason Deadline");
            if(Array.isArray(p.byeDates) && p.byeDates.includes(dayStr)) milestoneTypes.push("Bye / Skip Date"); 
            
            milestoneTypes.forEach(mt => {
                const styleCls = mt.includes("Bye") ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-indigo-100 text-indigo-800 border-indigo-300";
                milestonesHTML += `<div onclick="event.stopPropagation(); openEditProgramModal('${p.id}')" class="text-[9px] font-bold leading-tight truncate px-1 py-0.5 mb-1 rounded border shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${styleCls}" title="${p.groupId} ${p.preHeader} ${p.season} ${p.type}\n${mt}"><i class="fa-solid fa-flag text-[8px] mr-1"></i>${p.groupId} ${p.season}: ${mt}</div>`;
            });
        });
    }

    let dateStyle = '';
    if(isToday) {
        dateStyle = 'bg-brandLight text-white w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-md';
    } else {
        dateStyle = 'text-gray-400 group-hover:text-brandLight ' + (view === 'day' ? 'text-4xl opacity-40 mb-2' : 'text-[10px]');
    }

    const cellHighlight = isToday ? 'ring-2 ring-brandLight border-transparent shadow-sm' : 'border-gray-200 hover:border-blue-300';
    const todayText = isToday ? `<span class="text-[9px] uppercase tracking-wider font-black text-brandLight mr-2">TODAY</span>` : '';

    let tasksHTML = dayTasks.map(t => {
        const isComplete = t.status === 'Complete';
        const isInProgress = t.status === 'In Progress';
        const isOverdue = !isComplete && (renderDate < todayDate) && !t.isNote;
        
        let bg = '';
        if (t.isNote) bg = 'bg-gray-800 text-white border border-gray-900 shadow-sm';
        else if (isComplete) bg = 'bg-gray-200 text-gray-500 border border-gray-300 line-through opacity-70';
        else if (isOverdue) bg = 'bg-rose-100 text-rose-800 border-2 border-rose-400 shadow-md animate-pulse';
        else if (isInProgress) bg = 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm';
        else if (t.level === 'Marketing') {
            if (t.marketingCategory && MARKETING_CATEGORIES[t.marketingCategory]) {
                bg = MARKETING_CATEGORIES[t.marketingCategory];
            } else {
                bg = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            }
        }
        else bg = 'bg-blue-100 text-blue-800 border border-blue-200';

        const icon = isOverdue ? `<i class="fa-solid fa-triangle-exclamation text-[8px] text-rose-600 mr-1"></i>` : (t.isNote ? `<i class="fa-solid fa-circle-info text-[8px] mr-1"></i>` : '');

        return `<div onclick="event.stopPropagation(); openEditActiveTask('${t.id}')" class="text-[9px] font-medium leading-tight truncate px-1 py-0.5 mb-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${bg}" title="Group: ${t.groupId}\nTask: ${t.name}\nStatus: ${t.isNote ? 'Note Event' : t.status}\nAssigned: ${t.assignee || 'Unassigned'}">${icon}<span class="font-bold opacity-60 mr-1">[${t.groupId}]</span>${t.name}</div>`;
    }).join('');

    return `<div onclick="openAddOneOffTaskModal('${dayStr}')" class="${heightClass} border ${cellHighlight} rounded p-1 overflow-y-auto bg-white flex flex-col relative group transition-colors cursor-pointer hover:bg-gray-50">
        <div class="flex justify-between items-start mb-2">
            <div class="text-[9px] text-rose-500 font-bold uppercase leading-tight max-w-[60%]">${holidayName || ''}</div>
            <div class="flex items-center gap-1">${todayText}<span class="font-bold ${dateStyle}">${displayDay}</span></div>
        </div>
        <div class="flex-grow content-start space-y-1">${milestonesHTML}${tasksHTML}</div>
    </div>`;
}

/* --- DASHBOARD --- */
function setDashboardFilter(f) { 
    currentDashFilter = f; 
    renderDashboard(); 
}

function renderDashList(containerId, tasks, emptyMsg) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if(tasks.length === 0) {
        el.innerHTML = `<p class="text-[11px] text-gray-500 italic p-3 bg-gray-50 rounded">${emptyMsg}</p>`;
        return;
    }
    
    tasks.sort((a,b) => new Date(a.targetDate) - new Date(b.targetDate));
    
    tasks.forEach(t => {
        const isOverdue = !t.isNote && t.status !== 'Complete' && t.status !== 'Archived' && (new Date(t.targetDate + "T00:00:00") < new Date().setHours(0,0,0,0));
        let borderLeft = isOverdue ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-brandLight';
        if(t.isNote) borderLeft = 'border-l-4 border-l-gray-800';

        let levelIcon = '<i class="fa-solid fa-gears text-brandLight"></i>';
        if(t.isNote) levelIcon = '<i class="fa-solid fa-circle-info text-gray-800"></i>';
        else if(t.level === 'Marketing') levelIcon = '<i class="fa-solid fa-bullhorn text-emerald-600"></i>';

        el.innerHTML += `
        <div class="p-2.5 bg-gray-50 border border-gray-200 rounded ${borderLeft} flex justify-between items-center transition hover:bg-gray-100 cursor-pointer mb-2" onclick="openEditActiveTask('${t.id}')">
            <div class="overflow-hidden pr-2">
                <div class="font-bold text-gray-800 text-xs flex items-center gap-1.5 truncate">${levelIcon} <span class="text-gray-400 font-normal text-[10px]">[${t.groupId}]</span> ${t.name}</div>
                <div class="text-[10px] text-gray-600 mt-0.5 truncate">Due: ${formatTargetDate(t.targetDate)} | Assigned: ${t.isNote ? 'N/A' : (t.assignee || '<span class="text-rose-500 font-bold">Unassigned</span>')}</div>
            </div>
            <button class="text-gray-400 hover:text-brandLight flex-shrink-0"><i class="fa-solid fa-chevron-right text-[10px]"></i></button>
        </div>`;
    });
}

function renderDashboard() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const agIds = getAuthorizedGroups().map(g=>g.id);
    
    let tot = 0, comp = 0, due = 0, over = 0, unassigned = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    let todayTasks = [];
    let myTasks = [];
    let focusedTasks = [];

    document.getElementById('dashboard-season-progress').innerHTML = '';

    const focusTitle = {
        'active': '<i class="fa-solid fa-list-ul text-brandLight"></i> Focused Viewer: Active Tasks',
        'completed': '<i class="fa-solid fa-circle-check text-emerald-600"></i> Focused Viewer: Completed',
        'unassigned': '<i class="fa-solid fa-user-minus text-amber-600"></i> Focused Viewer: Unassigned',
        'overdue': '<i class="fa-solid fa-triangle-exclamation text-rose-600"></i> Focused Viewer: Overdue'
    };
    document.getElementById('dash-focused-title').innerHTML = focusTitle[currentDashFilter];

    programs.filter(p => agIds.includes(p.groupId)).forEach(p => {
        const pTasks = activeTasks.filter(t => t.programId === p.id && t.status !== 'Archived' && !t.isNote);
        const pOpTasks = pTasks.filter(t => t.level === 'Operational' || !t.level);
        const pMktTasks = pTasks.filter(t => t.level === 'Marketing');

        const pTotOp = pOpTasks.length; const pCompOp = pOpTasks.filter(t => t.status === "Complete").length;
        const pTotMkt = pMktTasks.length; const pCompMkt = pMktTasks.filter(t => t.status === "Complete").length;

        const pctOp = pTotOp > 0 ? Math.round((pCompOp/pTotOp)*100) : 0;
        const pctMkt = pTotMkt > 0 ? Math.round((pCompMkt/pTotMkt)*100) : 0;

        if (pTasks.length > 0) {
            document.getElementById('dashboard-season-progress').innerHTML += `
            <div class="mb-4 bg-gray-50 border p-3 rounded">
                <h4 class="text-[11px] font-bold text-gray-800 mb-2 border-b pb-1">[${p.groupId}] ${p.preHeader} ${p.season} ${p.type}</h4>
                <div class="mb-2">
                    <div class="flex justify-between text-[10px] font-bold mb-1 text-gray-600">
                        <span><i class="fa-solid fa-gears text-brandLight mr-1"></i> Operational Execution</span>
                        <span class="text-brandLight">${pCompOp}/${pTotOp} (${pctOp}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5"><div class="bg-brandLight h-1.5 rounded-full" style="width: ${pctOp}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-[10px] font-bold mb-1 text-gray-600">
                        <span><i class="fa-solid fa-bullhorn text-emerald-600 mr-1"></i> Marketing Execution</span>
                        <span class="text-emerald-600">${pCompMkt}/${pTotMkt} (${pctMkt}%)</span>
                    </div>
                    <div class="w-full bg-emerald-200 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${pctMkt}%"></div></div>
                </div>
            </div>`; 
        }
    });

    activeTasks.filter(t => agIds.includes(t.groupId) && t.status !== 'Archived').forEach(t => {
        const tgt = new Date(t.targetDate + "T00:00:00");
        const isComplete = t.status === "Complete";
        const isUnassigned = (!t.assignee || t.assignee.trim() === '');
        const isOverdue = !isComplete && !t.isNote && (today > tgt);

        if (!isComplete && !t.isNote) tot++;
        if (isComplete && !t.isNote) comp++;
        if (!isComplete && isUnassigned && !t.isNote) unassigned++;
        if (isOverdue) over++;

        if (t.targetDate === todayStr && !isComplete) todayTasks.push(t);
        
        const inNext7 = tgt >= today && tgt <= new Date(today.getTime() + (7*86400000));
        if (t.assignee === currentUser.name && !isComplete && inNext7 && !t.isNote) myTasks.push(t);

        if (currentDashFilter === 'active' && !isComplete) focusedTasks.push(t);
        else if (currentDashFilter === 'completed' && isComplete) focusedTasks.push(t);
        else if (currentDashFilter === 'unassigned' && !isComplete && isUnassigned && !t.isNote) focusedTasks.push(t);
        else if (currentDashFilter === 'overdue' && isOverdue) focusedTasks.push(t);
    });

    document.getElementById('kpi-total').textContent = tot;
    document.getElementById('kpi-completed').textContent = comp;
    document.getElementById('kpi-unassigned').textContent = unassigned;
    document.getElementById('kpi-overdue').textContent = over;

    renderDashList('dashboard-today-list', todayTasks, "No tasks due today. You're all caught up!");
    renderDashList('dashboard-my-tasks', myTasks, "No upcoming tasks assigned to you.");
    renderDashList('dashboard-focused-list', focusedTasks, "No tasks match this filter setting.");
}

/* --- HARD DELETE UNIFIED LOGIC --- */
function openHardDeleteModal(type, ids, groupId, names) {
    document.getElementById('hd-item-ids').value = Array.isArray(ids) ? ids.join(',') : ids;
    document.getElementById('hd-item-type').value = type;
    document.getElementById('hd-item-group').value = groupId;
    document.getElementById('hd-item-names').value = Array.isArray(names) ? names.join(' | ') : names;
    document.getElementById('hd-reason').value = '';
    document.getElementById('hd-notes').value = '';
    document.getElementById('hard-delete-modal').classList.remove('hidden');
}

function executeHardDelete(e) {
    e.preventDefault();
    const type = document.getElementById('hd-item-type').value;
    const ids = document.getElementById('hd-item-ids').value.split(',');
    const names = document.getElementById('hd-item-names').value;
    const groupId = document.getElementById('hd-item-group').value || 'SYSTEM';
    const reason = document.getElementById('hd-reason').value;
    const notes = document.getElementById('hd-notes').value.trim();

    ids.forEach(id => {
        if(type === 'program') window.cloudDeleteProgram(id);
        else if(type === 'template') window.cloudDeleteTemplate(id);
        else if(type === 'task') window.cloudDeleteActiveTask(id);
        else if(type === 'group') window.cloudDeleteGroup(id);
    });

    logActivity(groupId, `Permanent Delete (${type})`, `Erased: ${names}. Reason: ${reason}. Notes: ${notes}`);
    
    closeModals();
    showToast("Permanently Deleted", `${ids.length} item(s) have been erased.`);
    
    const elProg = document.getElementById('selectAllProgs'); if (elProg) elProg.checked = false;
    const elTask = document.getElementById('selectAllTasks'); if (elTask) elTask.checked = false;
    const elTpl = document.getElementById('selectAllTpls'); if (elTpl) elTpl.checked = false;
}
/* --- PROGRAMS --- */
function renderControlCenter() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const agIds = getAuthorizedGroups().map(g=>g.id);
    const tb = document.getElementById('control-center-table-body'); if(!tb) return; tb.innerHTML = '';
    
    const isManager = hasPermission('createPrograms');

    const fGrp = document.getElementById('filter-prog-group').value; const fYr = document.getElementById('filter-prog-year').value;
    const fSea = document.getElementById('filter-prog-season').value; const fTyp = document.getElementById('filter-prog-type').value;

    programs.filter(p => agIds.includes(p.groupId)).forEach(p => {
        if(fGrp !== 'ALL' && p.groupId !== fGrp) return; if(fYr !== 'ALL' && p.year !== fYr) return;
        if(fSea !== 'ALL' && p.season !== fSea) return; if(fTyp !== 'ALL' && p.type !== fTyp) return;

        let byeDisplay = '';
        if(Array.isArray(p.byeDates) && p.byeDates.length > 0) {
            const formattedDates = p.byeDates.map(d => formatTargetDate(d)).join(', ');
            byeDisplay = `<br><span class="text-amber-600 font-bold">Skips: ${formattedDates}</span>`;
        }

        let priceDisplay = p.price ? `<span class="text-emerald-700 font-bold">$${p.price}</span>` : '<span class="text-gray-400 italic">No Base Price</span>';
        if (p.priceEarly || p.priceOffseason || p.priceLateFee) {
            priceDisplay += `<div class="text-[9px] text-gray-500 mt-0.5 space-y-0.5 font-mono">`;
            if (p.priceOffseason) priceDisplay += `<div>Offseason: <strong class="text-indigo-600">$${p.priceOffseason}</strong></div>`;
            if (p.priceEarly) priceDisplay += `<div>Early: <strong class="text-emerald-600">$${p.priceEarly}</strong></div>`;
            if (p.priceLateFee) priceDisplay += `<div>Late Fee: <strong class="text-rose-600">+$${p.priceLateFee}</strong></div>`;
            priceDisplay += `</div>`;
        }

        tb.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-center"><input type="checkbox" class="prog-cb" value="${p.id}"></td>
            <td class="px-4 py-2">
                <span class="font-bold text-brandLight">${p.groupId}</span><br>
                <span class="font-bold text-gray-800">${p.preHeader} ${p.season} ${p.year}</span>
                ${getRecentLogHTML(p.id)}
            </td>
            <td class="px-4 py-2"><span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">${p.type}</span></td>
            <td class="px-4 py-2 text-[10px] text-gray-600">Start: ${formatTargetDate(p.dateStart)}${p.dateStart2 ? `<br>Start 2: ${formatTargetDate(p.dateStart2)}` : ''}${p.dateFinal ? `<br>Final: ${formatTargetDate(p.dateFinal)}` : ''}</td>
            <td class="px-4 py-2 text-[10px] text-gray-600">${priceDisplay}<br>${p.days ? `<span class="font-bold text-gray-800">${p.days}</span><br>` : ''}${p.weeks} Wks | ${p.venue || 'No Venue'} ${byeDisplay}</td>
            <td class="px-4 py-2 text-center whitespace-nowrap">
                ${isManager ? `
                <div class="inline-flex flex-col gap-1 mr-1 align-middle">
                    <button onclick="generateTaskPlan('${p.id}', 'Operational')" class="text-[9px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded shadow-sm transition"><i class="fa-solid fa-gears"></i> Gen Ops</button>
                    <button onclick="generateTaskPlan('${p.id}', 'Marketing')" class="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded shadow-sm transition"><i class="fa-solid fa-bullhorn"></i> Gen Mktg</button>
                </div>
                <button onclick="syncProgramTasks('${p.id}')" class="text-indigo-500 hover:text-indigo-700 mx-1" title="Sync Task Dates"><i class="fa-solid fa-rotate"></i></button>
                <button onclick="openPricingPane('${p.id}')" class="text-emerald-600 hover:text-emerald-800 mx-1" title="Manage Tiered Pricing & Deadlines"><i class="fa-solid fa-tags"></i></button>
                <button onclick="openEditProgramModal('${p.id}')" class="text-blue-600 hover:text-blue-800 mx-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="cloneProgram('${p.id}')" class="text-amber-500 hover:text-amber-700 mx-1"><i class="fa-regular fa-copy"></i></button>
                <button onclick="openHistoryModal('${p.id}', '${p.preHeader || ''} ${p.season} ${p.type}')" class="text-gray-500 hover:text-gray-700 mx-1" title="View History"><i class="fa-solid fa-clock-rotate-left"></i></button>
                ${hasPermission('manageGroups') ? `<button onclick="openHardDeleteModal('program', '${p.id}', '${p.groupId}', '${p.preHeader || ''} ${p.season} ${p.type}')" class="text-red-800 hover:text-red-900 mx-1" title="Permanently Delete"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                ` : '-'}
            </td>
        </tr>`;
    });
}

window.openPricingPane = function(progId) {
    const p = programs.find(x => x.id === progId);
    if (!p) return;

    document.getElementById('price-prog-id').value = p.id;
    document.getElementById('price-prog-title').textContent = `[${p.groupId}] ${p.preHeader || ''} ${p.season} ${p.type}`;
    
    // Bind dates
    document.getElementById('price-date-offseason').value = p.dateOffseason || '';
    document.getElementById('price-date-early').value = p.dateEarly || '';
    document.getElementById('price-date-final').value = p.dateFinal || '';

    // Bind price tier values
    document.getElementById('price-val-offseason').value = p.priceOffseason || '';
    document.getElementById('price-val-early').value = p.priceEarly || '';
    document.getElementById('price-val-full').value = p.price || '';
    document.getElementById('price-val-late').value = p.priceLateFee || '';

    document.getElementById('price-master-edit-toggle').checked = true;

    // Show overlay and slide side pane in smoothly
    document.getElementById('pricing-pane-overlay').classList.remove('hidden');
    const pane = document.getElementById('pricing-pane');
    pane.classList.remove('translate-x-full');
    pane.classList.add('translate-x-0');
};

window.closePricingPane = function() {
    document.getElementById('pricing-pane-overlay').classList.add('hidden');
    const pane = document.getElementById('pricing-pane');
    pane.classList.remove('translate-x-0');
    pane.classList.add('translate-x-full');
};

window.saveProgramPricing = async function(e) {
    e.preventDefault();
    try {
        const id = document.getElementById('price-prog-id').value;
        const p = programs.find(x => x.id === id);
        if (!p) return;

        // Capture old values for marketing delta note
        const oldPrices = {
            offseason: p.priceOffseason || 'N/A',
            early: p.priceEarly || 'N/A',
            full: p.price || 'N/A',
            late: p.priceLateFee || 'N/A'
        };

        // Update program object
        p.dateOffseason = document.getElementById('price-date-offseason').value;
        p.dateEarly = document.getElementById('price-date-early').value;
        p.dateFinal = document.getElementById('price-date-final').value;

        p.priceOffseason = document.getElementById('price-val-offseason').value;
        p.priceEarly = document.getElementById('price-val-early').value;
        p.price = document.getElementById('price-val-full').value;
        p.priceLateFee = document.getElementById('price-val-late').value;

        await window.cloudSaveProgram(p);

        // Handle Master Edit: Generate Marketing Delta Note & Calendar Entries
        const isMasterEdit = document.getElementById('price-master-edit-toggle').checked;
        if (isMasterEdit) {
            const todayStr = new Date().toISOString().split('T')[0];
            const changeSummary = `Pricing updated for ${p.season} ${p.type}: Full Price ($${oldPrices.full} -> $${p.price}), Early ($${oldPrices.early} -> $${p.priceEarly || 'N/A'}), Offseason ($${oldPrices.offseason} -> $${p.priceOffseason || 'N/A'}), Late Fee ($${oldPrices.late} -> $${p.priceLateFee || 'N/A'}).`;

            const marketingTask = {
                id: generateId('ATK'),
                programId: p.id,
                groupId: p.groupId,
                type: p.type,
                preHeader: "Price Adjustment",
                level: "Marketing",
                marketingCategory: "Marketing Note",
                name: `Price Tier Change: ${p.season} ${p.type}`,
                desc: changeSummary,
                targetDate: todayStr,
                assignee: currentUser ? currentUser.name : '',
                status: "Complete",
                isOneOff: true,
                isNote: true, // Appears as note event on calendar & task list
                notes: `Old Full: $${oldPrices.full} | New Full: $${p.price}`
            };

            await window.cloudSaveActiveTask(marketingTask);
            logActivity(p.groupId, 'Price Tier Change', changeSummary, p.id);
        }

        closePricingPane();
        renderControlCenter();
        showToast("Pricing Updated", "Program price tiers and marketing notes synced successfully.");
    } catch (err) {
        showToast("Error", "Failed to update pricing: " + err.message);
    }
};

function updateDeadlineCount() {
    const count = parseInt(document.querySelector('input[name="prog-deadline-count"]:checked').value);
    document.getElementById('prog-dl-2-container').classList.toggle('hidden', count < 2);
    document.getElementById('prog-dl-3-container').classList.toggle('hidden', count < 3);
    document.getElementById('prog-dl-4-container').classList.toggle('hidden', count < 4);
}

function updateSecStartsCount() {
    const count = parseInt(document.getElementById('prog-sec-start-count').value);
    const container = document.getElementById('sec-starts-container');
    if(count > 0) container.classList.remove('hidden'); else container.classList.add('hidden');
    for(let i=1; i<=6; i++) {
        const el = document.getElementById('prog-start-sec-' + i);
        if(i <= count) el.classList.remove('hidden'); else { el.classList.add('hidden'); el.value = ''; }
    }
}

function updateByeCount() {
    const count = parseInt(document.querySelector('input[name="prog-bye-count"]:checked').value);
    const container = document.getElementById('bye-weeks-container');
    if(count > 0) container.classList.remove('hidden'); else container.classList.add('hidden');
    for(let i=1; i<=4; i++) {
        const el = document.getElementById('prog-bye-' + i);
        if(i <= count) el.classList.remove('hidden'); else { el.classList.add('hidden'); el.value = ''; }
    }
}

function updateProgPreHeaderOptions() {
    const select = document.getElementById('prog-pre'); select.innerHTML = '<option value="">-- None --</option>';
    const container = document.getElementById('prog-pre-container');
    const type = document.querySelector('input[name="prog-type-radio"]:checked').value;
    if (type === 'School') { container.classList.add('hidden'); } else { container.classList.remove('hidden'); ['Early', 'Late', 'Pre-Season', 'In-Season'].forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`); }
}

function openAddProgramModal() { 
    document.getElementById('prog-edit-id').value = ''; 
    updateProgPreHeaderOptions();
    
    document.querySelector(`input[name="prog-deadline-count"][value="4"]`).checked = true;
    updateDeadlineCount();

    document.getElementById('prog-sec-start-count').value = "0";
    updateSecStartsCount();

    document.querySelector(`input[name="prog-bye-count"][value="0"]`).checked = true;
    updateByeCount();
    
    document.querySelectorAll('.prog-day-cb').forEach(cb => cb.checked = false);
    
    setInputRawDate('prog-date-start', '');
    setInputRawDate('prog-date-final', '');
    setInputRawDate('prog-date-early', '');
    setInputRawDate('prog-date-offseason', '');

    for(let i=1; i<=6; i++) setInputRawDate(`prog-start-sec-${i}`, '');
    for(let i=1; i<=4; i++) setInputRawDate(`prog-bye-${i}`, '');

    document.getElementById('prog-weeks').value = '';
    document.getElementById('prog-venue').value = '';
    
    document.getElementById('prog-price-offseason').value = '';
    document.getElementById('prog-price-early').value = '';
    document.getElementById('prog-price').value = '';
    document.getElementById('prog-price-late').value = '';
    
    document.getElementById('program-modal').classList.remove('hidden'); 
}

function openEditProgramModal(id) {
    const p = programs.find(x => x.id === id); if(!p) return;
    document.getElementById('prog-edit-id').value = p.id;
    document.getElementById('prog-group').value = p.groupId;
    document.getElementById('prog-year').value = p.year;
    document.querySelector(`input[name="prog-type-radio"][value="${p.type}"]`).checked = true;
    updateProgPreHeaderOptions();
    document.getElementById('prog-pre').value = p.preHeader || '';
    document.getElementById('prog-season').value = p.season;
    
    const count = p.deadlineCount || 4;
    const rb = document.querySelector(`input[name="prog-deadline-count"][value="${count}"]`);
    if(rb) rb.checked = true;
    updateDeadlineCount();
    
    const dArr = p.days ? p.days.split(', ') : [];
    document.querySelectorAll('.prog-day-cb').forEach(cb => cb.checked = dArr.includes(cb.value));
    
    setInputRawDate('prog-date-start', p.dateStart || '');
    setInputRawDate('prog-date-final', p.dateFinal || '');
    setInputRawDate('prog-date-early', p.dateEarly || '');
    setInputRawDate('prog-date-offseason', p.dateOffseason || '');

    document.getElementById('prog-weeks').value = p.weeks || '';
    document.getElementById('prog-venue').value = p.venue || '';

    document.getElementById('prog-price-offseason').value = p.priceOffseason || '';
    document.getElementById('prog-price-early').value = p.priceEarly || '';
    document.getElementById('prog-price').value = p.price || '';
    document.getElementById('prog-price-late').value = p.priceLateFee || '';

    const secCount = p.secStartDates ? p.secStartDates.length : 0;
    document.getElementById('prog-sec-start-count').value = secCount <= 6 ? secCount.toString() : "6";
    updateSecStartsCount();
    if(p.secStartDates) {
        for(let i=0; i<6; i++) {
            const idx = i + 1;
            setInputRawDate(`prog-start-sec-${idx}`, p.secStartDates[i] || '');
        }
    }

    const byeCount = p.byeDates ? p.byeDates.length : 0;
    const byeRb = document.querySelector(`input[name="prog-bye-count"][value="${byeCount}"]`);
    if(byeRb) byeRb.checked = true; else document.querySelector(`input[name="prog-bye-count"][value="0"]`).checked = true;
    updateByeCount();
    
    if(p.byeDates) {
        for(let i=0; i<4; i++) {
            const idx = i + 1;
            setInputRawDate(`prog-bye-${idx}`, p.byeDates[i] || '');
        }
    }

    document.getElementById('program-modal').classList.remove('hidden');
}

async function saveProgram(e) {
    e.preventDefault();
    const form = e.target;
    setFormLoading(form, true, "Saving Program...");

    try {
        const id = document.getElementById('prog-edit-id').value || generateId('PRG');
        const type = document.querySelector('input[name="prog-type-radio"]:checked').value;
        const dCount = parseInt(document.querySelector('input[name="prog-deadline-count"]:checked').value);
        const days = Array.from(document.querySelectorAll('.prog-day-cb:checked')).map(cb => cb.value).join(', ');
        
        const secCount = parseInt(document.getElementById('prog-sec-start-count').value);
        let secDatesArray = [];
        for(let i=1; i<=secCount; i++) {
            const val = getInputRawDate('prog-start-sec-' + i);
            if (val) secDatesArray.push(val);
        }

        const byeCount = parseInt(document.querySelector('input[name="prog-bye-count"]:checked').value);
        let byeDatesArray = [];
        for(let i=1; i<=byeCount; i++) {
            const val = getInputRawDate('prog-bye-' + i);
            if (val) byeDatesArray.push(val);
        }

        const p = {
            id: id, groupId: document.getElementById('prog-group').value, year: document.getElementById('prog-year').value,
            type: type, preHeader: type === 'School' ? '' : document.getElementById('prog-pre').value,
            season: document.getElementById('prog-season').value, 
            deadlineCount: dCount, days: days,
            dateStart: getInputRawDate('prog-date-start'),
            secStartDates: secDatesArray,
            dateFinal: dCount >= 2 ? getInputRawDate('prog-date-final') : '', 
            dateEarly: dCount >= 3 ? getInputRawDate('prog-date-early') : '',
            dateOffseason: dCount >= 4 ? getInputRawDate('prog-date-offseason') : '', 
            weeks: document.getElementById('prog-weeks').value,
            byeDates: byeDatesArray,
            venue: document.getElementById('prog-venue').value,
            priceOffseason: document.getElementById('prog-price-offseason').value,
            priceEarly: document.getElementById('prog-price-early').value,
            price: document.getElementById('prog-price').value,
            priceLateFee: document.getElementById('prog-price-late').value
        };
        await window.cloudSaveProgram(p);
        
        if (document.getElementById('prog-edit-id').value) {
            const linked = activeTasks.filter(t => t.programId === p.id && !t.isOneOff);
            linked.forEach(t => { const tpl = templates.find(x => x.id === t.templateId); if(tpl) { t.targetDate = calculateNewTargetDate(p, tpl); window.cloudSaveActiveTask(t); } });
            logActivity(p.groupId, 'Program Update', `Updated logistics/dates for Program ${p.id}`, p.id);
        } else {
            logActivity(p.groupId, 'Program Create', `Created new Program ${p.season} ${p.type}`, p.id);
        }
        closeModals(); showToast("Program Saved", "Successfully updated.");
    } catch (err) {
        alert("Error saving program: " + err.message);
    } finally {
        setFormLoading(form, false);
    }
}

function cloneProgram(id) { 
    const p = programs.find(x => x.id === id); 
    if(!p) return; 
    const clone = {...p, id: generateId('PRG')}; 
    window.cloudSaveProgram(clone); 
    logActivity(p.groupId, 'Program Cloned', `Cloned Program ${p.id} to new ID ${clone.id}`, clone.id);
    showToast("Cloned", "Program duplicated successfully."); 
}

/* --- TASK PROFILES --- */
function updateTplPreHeaderOptions() {
    const typeEl = document.getElementById('tpl-type'); if(!typeEl) return;
    const sel = document.getElementById('tpl-preheader'); if(!sel) return; sel.innerHTML = '<option value="">-- None (Blank) --</option>';
    if (typeEl.value !== 'School') { ['Early', 'Late', 'Pre-Season', 'In-Season'].forEach(opt => sel.innerHTML += `<option value="${opt}">${opt}</option>`); }
}

function renderTemplates() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const tb = document.getElementById('template-table-body'); if(!tb) return;
    const f = document.getElementById('filter-template-type').value; 
    const fGrp = document.getElementById('filter-template-group').value; 
    tb.innerHTML = '';
    const isManager = hasPermission('editTemplates');
    
    const agIds = getAuthorizedGroups().map(g=>g.id);

    templates.filter(t => {
        if (fGrp !== 'ALL' && t.groupId !== fGrp) return false;
        if (fGrp === 'ALL' && t.groupId !== 'ALL' && !agIds.includes(t.groupId)) return false;
        if (f !== 'ALL' && t.type !== f) return false;
        return true;
    }).forEach(t => {
        const grpDisplay = t.groupId === 'ALL' ? '<span class="text-brandLight font-bold">All Groups</span>' : `<span class="text-gray-800 font-bold">${t.groupId}</span>`;
        
        let levelDisplay = `<span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">Operational</span>`;
        if(t.level === 'Marketing') {
            if (t.marketingCategory) {
                levelDisplay = `<span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Mktg: ${t.marketingCategory}</span>`;
            } else {
                levelDisplay = `<span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Marketing</span>`;
            }
        }
        
        tb.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 text-center"><input type="checkbox" class="tpl-cb" value="${t.id}"></td>
                <td class="px-4 py-2 text-[11px]">${grpDisplay}</td>
                <td class="px-4 py-2 font-bold text-gray-800">${levelDisplay}</td>
                <td class="px-4 py-2 font-bold text-gray-800">${t.type}${t.preHeader ? `<br><span class="text-gray-500 font-normal">${t.preHeader}</span>` : ''}</td>
                <td class="px-4 py-2 text-brandLight font-medium">${t.name} ${getRecentLogHTML(t.id)}</td>
                <td class="px-4 py-2 text-[10px] text-gray-500">${t.seasons.join(', ')}</td>
                <td class="px-4 py-2 text-gray-700 font-mono text-[10px]">${t.offsetNum} Days ${t.offsetDir} ${t.anchor.replace('date','')}</td>
                <td class="px-4 py-2 text-gray-500 text-[10px]">${t.role}</td>
                <td class="px-4 py-2 text-center whitespace-nowrap">
                    ${isManager ? `
                    <button onclick="openEditTemplate('${t.id}')" class="text-blue-600 hover:text-blue-800 mx-1"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="cloneTemplate('${t.id}')" class="text-amber-500 hover:text-amber-700 mx-1"><i class="fa-regular fa-copy"></i></button>
                    ${hasPermission('manageGroups') ? `<button onclick="openHardDeleteModal('template', '${t.id}', '${t.groupId}', '${t.name}')" class="text-red-800 hover:text-red-900 mx-1" title="Permanently Delete"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                    ` : '-'}
                </td>
            </tr>`;
    });
}

function openAddTemplateModal() { 
    document.getElementById('tpl-edit-id').value = ''; 
    
    document.getElementById('tpl-name').value = '';
    document.getElementById('tpl-desc').value = '';
    document.getElementById('tpl-offset-num').value = '0';
    populateFilterOptions();
    const tplRoleSel = document.getElementById('tpl-role');
    if (tplRoleSel) tplRoleSel.value = '';
    document.getElementById('tpl-group').value = 'ALL';
    document.getElementById('tpl-level').value = 'Operational';
    
    document.getElementById('tpl-mktg-cat').value = '';
    document.getElementById('tpl-mktg-custom').value = '';
    document.getElementById('tpl-mktg-custom').classList.add('hidden');
    document.getElementById('tpl-mktg-cat-container').classList.add('hidden');

    updateTplPreHeaderOptions();
    document.getElementById('template-modal').classList.remove('hidden'); 
}

function openEditTemplate(id) {
    const t = templates.find(x=>x.id===id); if(!t) return;
    document.getElementById('tpl-edit-id').value = t.id;
    document.getElementById('tpl-group').value = t.groupId || 'ALL';
    document.getElementById('tpl-type').value = t.type; updateTplPreHeaderOptions(); 
    document.getElementById('tpl-preheader').value = t.preHeader || '';
    
    document.getElementById('tpl-level').value = t.level || 'Operational';
    const mktgContainer = document.getElementById('tpl-mktg-cat-container');
    if (t.level === 'Marketing') mktgContainer.classList.remove('hidden'); else mktgContainer.classList.add('hidden');
    
    const catSel = document.getElementById('tpl-mktg-cat');
    const catCus = document.getElementById('tpl-mktg-custom');
    if(t.marketingCategory && !Object.keys(MARKETING_CATEGORIES).includes(t.marketingCategory)) {
        catSel.value = 'CUSTOM';
        catCus.value = t.marketingCategory;
        catCus.classList.remove('hidden');
    } else {
        catSel.value = t.marketingCategory || '';
        catCus.classList.add('hidden');
    }

    document.getElementById('tpl-name').value = t.name; document.getElementById('tpl-desc').value = t.desc || '';
    document.querySelectorAll('.tpl-season-cb').forEach(cb => cb.checked = t.seasons.includes(cb.value));
    document.getElementById('tpl-offset-num').value = t.offsetNum; document.getElementById('tpl-offset-dir').value = t.offsetDir;
    document.getElementById('tpl-anchor').value = t.anchor;
    
    populateFilterOptions();
    const tplRoleSel = document.getElementById('tpl-role');
    if (tplRoleSel) {
        if (t.role) {
            const foundUser = users.find(u => u.name === t.role);
            const isArchived = foundUser && (foundUser.status === 'Archived' || foundUser.status === 'Frozen');

            if (isArchived) {
                let optExists = Array.from(tplRoleSel.options).some(o => o.value === t.role);
                if (!optExists) {
                    let opt = document.createElement('option');
                    opt.value = t.role;
                    opt.text = `Archived User: ${t.role}`;
                    opt.className = "text-rose-600 font-bold";
                    tplRoleSel.add(opt, tplRoleSel.options[1]);
                }
                tplRoleSel.value = t.role;
            } else {
                let optExists = Array.from(tplRoleSel.options).some(o => o.value === t.role);
                if (!optExists) {
                    let opt = document.createElement('option');
                    opt.value = t.role;
                    opt.text = `Custom Role: ${t.role}`;
                    tplRoleSel.add(opt, tplRoleSel.options[1]);
                }
                tplRoleSel.value = t.role;
            }
        } else {
            tplRoleSel.value = '';
        }
    }
    document.getElementById('template-modal').classList.remove('hidden');
}

function cloneTemplate(id) { 
    const t = templates.find(x => x.id === id); 
    if(!t) return; 
    const newT = {...t, id: generateId('TPL')};
    window.cloudSaveTemplate(newT); 
    logActivity(t.groupId, 'Profile Rule Cloned', `Cloned Rule: ${t.name}`, newT.id);
    showToast("Cloned", "Task Profile rule duplicated."); 
}

function saveTemplate(e) {
    e.preventDefault();
    const id = document.getElementById('tpl-edit-id').value || generateId('TPL');
    const seasons = Array.from(document.querySelectorAll('.tpl-season-cb:checked')).map(cb=>cb.value);
    
    let mktgCat = '';
    if (document.getElementById('tpl-level').value === 'Marketing') {
        mktgCat = document.getElementById('tpl-mktg-cat').value;
        if (mktgCat === 'CUSTOM') mktgCat = document.getElementById('tpl-mktg-custom').value.trim();
    }

    const t = {
        id: id, groupId: document.getElementById('tpl-group').value, type: document.getElementById('tpl-type').value, 
        preHeader: document.getElementById('tpl-preheader').value, level: document.getElementById('tpl-level').value,
        marketingCategory: mktgCat,
        name: document.getElementById('tpl-name').value, desc: document.getElementById('tpl-desc').value, 
        seasons: seasons, offsetNum: parseInt(document.getElementById('tpl-offset-num').value), 
        offsetDir: document.getElementById('tpl-offset-dir').value, anchor: document.getElementById('tpl-anchor').value, role: document.getElementById('tpl-role').value.trim()
    };
    window.cloudSaveTemplate(t); 
    logActivity(t.groupId, document.getElementById('tpl-edit-id').value ? 'Profile Rule Updated' : 'Profile Rule Created', `Rule: ${t.name}`, t.id);
    closeModals(); showToast("Task Profile Saved", "Master list updated.");
}

/* --- TASKS --- */

function setTaskView(view) {
    currentTaskView = view;
    const btnAct = document.getElementById('btn-tasks-active');
    const btnArch = document.getElementById('btn-tasks-archived');
    const bulkEditBtn = document.getElementById('btn-task-bulk-edit');
    const bulkArchBtn = document.getElementById('btn-task-bulk-archive');
    const bulkDelBtn = document.getElementById('btn-task-bulk-delete');

    if (view === 'active') {
        btnAct.className = "px-4 py-1.5 rounded-full bg-brandLight text-white shadow transition";
        btnArch.className = "px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 transition";
        bulkEditBtn.style.display = 'block'; bulkArchBtn.style.display = 'block';
        if(bulkDelBtn) bulkDelBtn.style.display = 'none';
    } else {
        btnAct.className = "px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 transition";
        btnArch.className = "px-4 py-1.5 rounded-full bg-brandLight text-white shadow transition";
        bulkEditBtn.style.display = 'none'; bulkArchBtn.style.display = 'none';
        if(bulkDelBtn && hasPermission('manageGroups')) bulkDelBtn.style.display = 'block';
    }
    renderActiveTasks();
}

function renderActiveTasks() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const agIds = getAuthorizedGroups().map(g=>g.id);
    const tb = document.getElementById('active-task-table-body'); if(!tb) return; tb.innerHTML = '';
    
    const canEdit = hasPermission('editTasks');
    const canDelete = hasPermission('manageGroups');
    
    const tHead = document.getElementById('task-table-head');
    if (currentTaskView === 'active') {
        tHead.innerHTML = `<tr>
            <th class="px-3 py-3 w-10 text-center"><input type="checkbox" id="selectAllTasks" onchange="toggleSelectAll('task-cb', this.checked)"></th>
            <th class="px-3 py-3 font-bold">Program Link / Group</th>
            <th class="px-3 py-3 font-bold">Level</th>
            <th class="px-3 py-3 font-bold">Task Name & Desc</th>
            <th class="px-3 py-3 font-bold">Target Date</th>
            <th class="px-3 py-3 font-bold">Assigned To</th>
            <th class="px-3 py-3 font-bold">Notes</th>
            <th class="px-3 py-3 font-bold">Status Update</th>
            <th class="px-3 py-3 text-center font-bold">Actions</th>
        </tr>`;
    } else {
        tHead.innerHTML = `<tr>
            <th class="px-3 py-3 w-10 text-center"><input type="checkbox" id="selectAllTasks" onchange="toggleSelectAll('task-cb', this.checked)"></th>
            <th class="px-3 py-3 font-bold pl-5">Program Link / Group</th>
            <th class="px-3 py-3 font-bold">Task Name</th>
            <th class="px-3 py-3 font-bold">Archived Date</th>
            <th class="px-3 py-3 font-bold">Removed By</th>
            <th class="px-3 py-3 font-bold">Reason & Details</th>
        </tr>`;
    }

    const fGrp = document.getElementById('filter-task-group').value; const fPrg = document.getElementById('filter-task-program').value;
    const fAss = document.getElementById('filter-task-assignee').value; const fSt = document.getElementById('filter-task-status').value;
    const fLev = document.getElementById('filter-task-level').value;
    
    activeTasks.forEach(t => {
        if (!agIds.includes(t.groupId)) return;
        if(fGrp !== 'ALL' && t.groupId !== fGrp) return; if(fPrg !== 'ALL' && t.programId !== fPrg) return;
        
        if (currentTaskView === 'active' && t.status === 'Archived') return;
        if (currentTaskView === 'archived' && t.status !== 'Archived') return;
        
        if(currentTaskView === 'active' && fSt !== 'ALL' && t.status !== fSt) return;
        
        const taskLevel = t.level || 'Operational';
        if(fLev !== 'ALL' && taskLevel !== fLev) return;

        let isUn = (!t.assignee || t.assignee.trim() === '');
        if (fAss === 'ME' && t.assignee !== currentUser.name) return;
        if (fAss === 'UNASSIGNED' && !isUn && !t.isNote) return;
        
        let pName = 'Unknown';
        const p = programs.find(x => x.id === t.programId);
        const priceStr = (p && p.price) ? ` - $${p.price}` : '';
        if (p) pName = `[${p.groupId}] ${p.preHeader} ${p.season}${priceStr}`;
        else if (t.isOneOff) pName = `[${t.groupId}] One-Off Task`;
        else pName = `[${t.groupId}] Unknown Program`;

        if (currentTaskView === 'archived') {
            const aDate = t.archivedAt ? new Date(t.archivedAt).toLocaleDateString() : 'Unknown';
            tb.innerHTML += `
                <tr class="hover:bg-gray-50 opacity-60">
                    <td class="px-3 py-2 text-center"><input type="checkbox" class="task-cb" value="${t.id}"></td>
                    <td class="px-3 py-2 font-bold text-gray-500 text-[11px] pl-5">${pName}</td>
                    <td class="px-3 py-2 font-medium text-gray-900 text-xs">${t.name} ${getRecentLogHTML(t.id)}</td>
                    <td class="px-3 py-2 font-mono font-bold text-gray-700 text-[11px] whitespace-nowrap">${aDate}</td>
                    <td class="px-3 py-2 text-xs font-bold text-gray-600">${t.archivedBy || 'System'}</td>
                    <td class="px-3 py-2 text-[10px] text-gray-500"><strong class="text-rose-600">${t.archiveReason || 'Other'}</strong><br>${t.archiveNotes || ''}</td>
                </tr>`;
        } else {
            let levelBadge = `<span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold"><i class="fa-solid fa-gears text-[9px]"></i> OPS</span>`;
            if (t.isNote) {
                levelBadge = `<span class="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"><i class="fa-solid fa-circle-info text-[9px]"></i> NOTE</span>`;
            } else if (taskLevel === 'Marketing') {
                if (t.marketingCategory && MARKETING_CATEGORIES[t.marketingCategory]) {
                    levelBadge = `<span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold"><i class="fa-solid fa-bullhorn text-[9px]"></i> ${t.marketingCategory.substring(0,12)}</span>`;
                } else {
                    levelBadge = `<span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold"><i class="fa-solid fa-bullhorn text-[9px]"></i> MKTG</span>`;
                }
            }

            const today = new Date(); today.setHours(0,0,0,0);
            const tgt = new Date(t.targetDate + "T00:00:00");
            let stHTML = `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px]">Upcoming</span>`;
            
            if (t.isNote) {
                stHTML = `<span class="bg-gray-800 text-white font-bold border border-gray-900 px-2 py-1 rounded text-[10px]">Note Event</span>`;
            } else if (t.status === "Complete") {
                stHTML = `<span class="bg-gray-200 text-gray-500 line-through px-2 py-1 rounded text-[10px]">Complete</span>`;
            } else if (t.status === "In Progress") {
                stHTML = `<span class="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded text-[10px] font-bold">In Progress</span>`;
            } else if (today > tgt) {
                stHTML = `<span class="bg-rose-100 text-rose-700 font-bold border border-rose-200 px-2 py-1 rounded text-[10px]">OVERDUE</span>`;
            }

            const notesText = `History: ${t.notes || 'None'}\nCompletion: ${t.completionNotes || 'None'}`;
            const hasAnyNotes = (t.notes && t.notes.trim() !== '') || (t.completionNotes && t.completionNotes.trim() !== '');
            const notesDisplay = hasAnyNotes ? `<div class="text-[10px] text-gray-500 italic max-w-[150px] truncate cursor-help" title="${notesText.replace(/"/g, '&quot;')}"><i class="fa-regular fa-comment-dots text-brandLight"></i> ${t.notes || t.completionNotes}</div>` : `<span class="text-gray-300 text-[10px]">-</span>`;
            
            const descDisplay = t.desc && t.desc.trim() !== '' ? `<div class="text-[9px] text-gray-500 font-normal mt-0.5 max-w-[200px] truncate" title="${t.desc.replace(/"/g, '&quot;')}">${t.desc}</div>` : '';

            const isCustomExt = t.assignee && !users.find(u => u.name === t.assignee);
            let assigneeDropdown = `<select onchange="updateTaskAssignee('${t.id}', this.value)" class="bg-transparent border-b border-gray-300 text-[11px] font-bold text-emerald-800 w-full p-1 outline-none appearance-none hover:bg-gray-50 cursor-pointer ${isUn ? 'text-rose-500' : ''}" ${canEdit ? '' : 'disabled'}>
                <option value="" class="text-gray-500">-- Unassigned --</option>
                ${users.map(u => `<option value="${u.name}" ${t.assignee === u.name ? 'selected' : ''}>${u.name}</option>`).join('')}
                ${isCustomExt ? `<option value="${t.assignee}" selected>${t.assignee} (External)</option>` : ''}
                <option value="CUSTOM" class="font-bold text-brandLight">+ Custom / External...</option>
            </select>`;

            let statusSelect = `<select onchange="updateActiveTaskStatus('${t.id}', this.value)" class="ml-1 bg-white border border-gray-300 rounded px-1 text-[10px] outline-none" ${canEdit ? '' : 'disabled'}>
                <option value="Pending" ${t.status==='Pending'?'selected':''}>Pending</option>
                <option value="In Progress" ${t.status==='In Progress'?'selected':''}>In Progress</option>
                <option value="Complete" ${t.status==='Complete'?'selected':''}>Done</option>
            </select>`;

            tb.innerHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 text-center" data-label="Select"><input type="checkbox" class="task-cb" value="${t.id}"></td>
                    <td class="px-3 py-2 font-bold text-brandLight text-[11px]" data-label="Program / Group">${pName}</td>
                    <td class="px-3 py-2" data-label="Level">${levelBadge}</td>
                    <td class="px-3 py-2 font-medium text-gray-900 text-xs" data-label="Task">${t.name} ${descDisplay} ${getRecentLogHTML(t.id)}</td>
                    <td class="px-3 py-2 font-mono font-bold text-gray-700 text-[11px] whitespace-nowrap" data-label="Target Date">${formatTargetDate(t.targetDate)}</td>
                    <td class="px-3 py-2 relative" data-label="Assigned To">${t.isNote ? '<span class="text-gray-400 italic text-[10px]">N/A (Note)</span>' : assigneeDropdown}</td>
                    <td class="px-3 py-2" data-label="Notes">${notesDisplay}</td>
                    <td class="px-3 py-2 whitespace-nowrap" data-label="Status">
                        ${stHTML}
                        ${t.isNote ? '' : statusSelect}
                    </td>
                    <td class="px-3 py-2 text-center whitespace-nowrap" data-label="Actions">
                        ${canEdit ? `
                            <button onclick="openEditActiveTask('${t.id}')" class="text-blue-600 hover:text-blue-800 mx-1"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="cloneTask('${t.id}')" class="text-amber-500 hover:text-amber-700 mx-1" title="Duplicate Task"><i class="fa-regular fa-copy"></i></button>
                            <button onclick="openArchiveTaskModal('${t.id}')" class="text-rose-600 hover:text-rose-800 mx-1" title="Archive / Soft Remove"><i class="fa-solid fa-box-archive"></i></button>
                            ${canDelete ? `<button onclick="openHardDeleteModal('task', '${t.id}', '${t.groupId}', '${t.name.replace(/'/g, "\\'")}')" class="text-red-800 hover:text-red-900 mx-1" title="Permanently Delete"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                        ` : '-'}
                    </td>
                </tr>`;
        }
    });
}

function updateActiveTaskStatus(id, st) { 
    const t = activeTasks.find(x => x.id === id); 
    if(t) { 
        t.status = st; window.cloudSaveActiveTask(t); 
        logActivity(t.groupId, 'Task Status Update', `Task ${t.name} marked as ${st}`, t.id);
    } 
}

function updateTaskAssignee(id, val) { 
    if (val === 'CUSTOM') {
        const customName = prompt("Enter the name of the external or non-member assignee:");
        if (customName) val = customName;
        else { renderActiveTasks(); return; } 
    }
    
    const t = activeTasks.find(x => x.id === id); 
    if(t) { 
        t.assignee = val; window.cloudSaveActiveTask(t); 
        logActivity(t.groupId, 'Task Reassigned', `Task ${t.name} assigned to ${val || 'Unassigned'}`, t.id);
        showToast("Reassigned", "Assignee updated directly."); 
        renderActiveTasks();
    } 
}

window.handleTaskModalAssigneeChange = function(sel) {
    const customInp = document.getElementById('at-assignee-custom');
    if (sel.value === 'CUSTOM') {
        const customName = prompt("Enter the name of the external or non-member assignee:");
        if (customName && customName.trim() !== '') {
            let opt = document.createElement('option');
            opt.value = customName.trim();
            opt.text = `${customName.trim()} (External)`;
            sel.add(opt, sel.options[1]);
            sel.value = customName.trim();
            if (customInp) customInp.classList.add('hidden');
        } else {
            sel.value = '';
            if (customInp) customInp.classList.add('hidden');
        }
    } else {
        if (customInp) customInp.classList.add('hidden');
    }
};

window.handleTplRoleChange = function(sel) {
    if (sel.value === 'CUSTOM') {
        const customTitle = prompt("Enter custom default role or person name:");
        if (customTitle && customTitle.trim() !== '') {
            let opt = document.createElement('option');
            opt.value = customTitle.trim();
            opt.text = `Custom Role: ${customTitle.trim()}`;
            sel.add(opt, sel.options[1]);
            sel.value = customTitle.trim();
        } else {
            sel.value = '';
        }
    }
};

function openArchiveTaskModal(id) {
    document.getElementById('archive-task-ids').value = id;
    document.getElementById('archive-reason').value = '';
    document.getElementById('archive-notes').value = '';
    document.getElementById('archive-task-modal').classList.remove('hidden');
}

function bulkArchiveTasks() {
    const ids = getSelected('task-cb');
    if(ids.length === 0) return alert("Select tasks to archive first.");
    document.getElementById('archive-task-ids').value = ids.join(',');
    document.getElementById('archive-reason').value = '';
    document.getElementById('archive-notes').value = '';
    document.getElementById('archive-task-modal').classList.remove('hidden');
}

function submitArchiveTasks(e) {
    e.preventDefault();
    const rawIds = document.getElementById('archive-task-ids').value;
    const ids = rawIds.split(',');
    const reason = document.getElementById('archive-reason').value;
    const notes = document.getElementById('archive-notes').value.trim();

    ids.forEach(id => {
        const t = activeTasks.find(x => x.id === id);
        if (t) {
            t.status = 'Archived';
            t.archiveReason = reason;
            t.archiveNotes = notes;
            t.archivedBy = currentUser.name;
            t.archivedAt = new Date().toISOString();
            window.cloudSaveActiveTask(t);
            logActivity(t.groupId, 'Task Removed/Archived', `Task ${t.name} archived. Reason: ${reason}`, t.id);
        }
    });

    closeModals();
    showToast("Tasks Archived", `${ids.length} task(s) removed from active view.`);
    document.getElementById('selectAllTasks').checked = false;
}

function openAddOneOffTaskModal(prefillDate = '') { 
    document.getElementById('at-edit-id').value = ''; 
    document.getElementById('at-is-oneoff').value = 'true'; 
    document.getElementById('at-level').value = 'Operational';
    document.getElementById('at-is-note').checked = false;
    
    document.getElementById('at-mktg-cat').value = '';
    document.getElementById('at-mktg-custom').value = '';
    document.getElementById('at-mktg-custom').classList.add('hidden');
    document.getElementById('at-mktg-cat-container').classList.add('hidden');

    document.getElementById('at-name').value = ''; 
    document.getElementById('at-desc').value = ''; 
    document.getElementById('at-date').value = typeof prefillDate === 'string' && prefillDate ? prefillDate : ''; 
    
    // Repopulate assignee options dynamically
    populateFilterOptions();

    const assigneeSel = document.getElementById('at-assignee');
    if (assigneeSel) assigneeSel.value = ''; 
    
    const customInp = document.getElementById('at-assignee-custom');
    if (customInp) customInp.classList.add('hidden');

    document.getElementById('at-notes').value = ''; 
    document.getElementById('at-completion-notes').value = '';
    document.getElementById('at-status').value = 'Pending';
    
    document.getElementById('at-program-select-container').classList.remove('hidden'); 
    document.getElementById('active-task-title').textContent = "Add One-Off Task"; 
    document.getElementById('active-task-modal').classList.remove('hidden'); 
}

function openEditActiveTask(id) {
    const t = activeTasks.find(x => x.id === id); if(!t) return;
    document.getElementById('at-edit-id').value = t.id; document.getElementById('at-is-oneoff').value = t.isOneOff.toString();
    document.getElementById('at-program-select-container').classList.add('hidden');
    document.getElementById('at-status').value = t.status || 'Pending';
    document.getElementById('at-level').value = t.level || 'Operational';
    document.getElementById('at-is-note').checked = t.isNote === true;
    
    const mktgContainer = document.getElementById('at-mktg-cat-container');
    if (t.level === 'Marketing') mktgContainer.classList.remove('hidden'); else mktgContainer.classList.add('hidden');
    
    const catSel = document.getElementById('at-mktg-cat');
    const catCus = document.getElementById('at-mktg-custom');
    if(t.marketingCategory && !Object.keys(MARKETING_CATEGORIES).includes(t.marketingCategory)) {
        catSel.value = 'CUSTOM';
        catCus.value = t.marketingCategory;
        catCus.classList.remove('hidden');
    } else {
        catSel.value = t.marketingCategory || '';
        catCus.classList.add('hidden');
    }

    document.getElementById('at-name').value = t.name; 
    document.getElementById('at-desc').value = t.desc || ''; 
    document.getElementById('at-date').value = t.targetDate; 
    
    const assigneeSel = document.getElementById('at-assignee');
    const customInp = document.getElementById('at-assignee-custom');
    
    // Refresh dropdown options respecting permissions
    populateFilterOptions();
    
    if (t.assignee) {
        const foundUser = users.find(u => u.name === t.assignee);
        const isArchived = foundUser && (foundUser.status === 'Archived' || foundUser.status === 'Frozen');

        if (isArchived) {
            // User was archived: Flag as Archived / Custom in the dropdown
            let optExists = Array.from(assigneeSel.options).some(o => o.value === t.assignee);
            if (!optExists) {
                let opt = document.createElement('option');
                opt.value = t.assignee;
                opt.text = `${t.assignee} (Archived User)`;
                opt.className = "text-rose-600 font-bold";
                assigneeSel.add(opt, assigneeSel.options[1]);
            }
            assigneeSel.value = t.assignee;
        } else if (!foundUser) {
            // Custom / External assignee
            let optExists = Array.from(assigneeSel.options).some(o => o.value === t.assignee);
            if (!optExists) {
                let opt = document.createElement('option');
                opt.value = t.assignee;
                opt.text = `${t.assignee} (External)`;
                assigneeSel.add(opt, assigneeSel.options[1]);
            }
            assigneeSel.value = t.assignee;
        } else {
            assigneeSel.value = t.assignee;
        }
    } else {
        assigneeSel.value = '';
    }

    if (customInp) customInp.classList.add('hidden');

    document.getElementById('at-notes').value = t.notes || '';
    document.getElementById('at-completion-notes').value = t.completionNotes || '';
    
    document.getElementById('active-task-title').textContent = "Edit Assigned Task"; document.getElementById('active-task-modal').classList.remove('hidden');
}

async function saveActiveTask(e) {
    e.preventDefault(); 
    const form = e.target;
    setFormLoading(form, true, "Saving Task...");

    try {
        const id = document.getElementById('at-edit-id').value; 
        const isOneOff = document.getElementById('at-is-oneoff').value === 'true';
        
        let assigneeVal = document.getElementById('at-assignee').value;
        if (assigneeVal === 'CUSTOM') assigneeVal = document.getElementById('at-assignee-custom').value.trim();

        let mktgCat = '';
        if (document.getElementById('at-level').value === 'Marketing') {
            mktgCat = document.getElementById('at-mktg-cat').value;
            if (mktgCat === 'CUSTOM') mktgCat = document.getElementById('at-mktg-custom').value.trim();
        }

        const isNote = document.getElementById('at-is-note').checked;

        if(id) {
            const t = activeTasks.find(x => x.id === id);
            if(t) { 
                t.status = document.getElementById('at-status').value;
                t.level = document.getElementById('at-level').value;
                t.marketingCategory = mktgCat;
                t.isNote = isNote;
                t.name = document.getElementById('at-name').value.trim(); 
                t.desc = document.getElementById('at-desc').value.trim(); 
                t.targetDate = document.getElementById('at-date').value; 
                t.assignee = isNote ? '' : assigneeVal; 
                t.notes = document.getElementById('at-notes').value.trim();
                t.completionNotes = document.getElementById('at-completion-notes').value.trim();
                await window.cloudSaveActiveTask(t); 
                logActivity(t.groupId, 'Task Update', `Updated task details: ${t.name}`, t.id);
            }
        } else if (isOneOff) {
            const progId = document.getElementById('at-program').value; const p = programs.find(x => x.id === progId);
            if(p) {
                const newTask = { 
                    id: generateId('ATK'), programId: p.id, groupId: p.groupId, type: p.type, preHeader: "One-Off", 
                    level: document.getElementById('at-level').value, marketingCategory: mktgCat,
                    name: document.getElementById('at-name').value.trim(), 
                    desc: document.getElementById('at-desc').value.trim(), assignee: isNote ? '' : assigneeVal, 
                    defaultRole: "Custom", targetDate: document.getElementById('at-date').value, 
                    status: document.getElementById('at-status').value, 
                    isOneOff: true, isNote: isNote,
                    notes: document.getElementById('at-notes').value.trim(), completionNotes: document.getElementById('at-completion-notes').value.trim() 
                };
                await window.cloudSaveActiveTask(newTask);
                logActivity(p.groupId, 'Task Create', `Created One-Off Task: ${newTask.name}`, newTask.id);
            }
        }
        closeModals();
        showToast("Task Saved", "Successfully updated task.");
    } catch (err) {
        alert("Error saving task: " + err.message);
    } finally {
        setFormLoading(form, false);
    }
}

function cloneTask(id) { 
    const t = activeTasks.find(x=>x.id===id); 
    if(t) { 
        const newT = {...t, id: generateId('ATK')};
        activeTasks.push(newT);
        window.cloudSaveActiveTask(newT); 
        logActivity(t.groupId, 'Task Cloned', `Cloned Task: ${t.name}`, newT.id);
        renderActiveTasks();
        showToast("Cloned", "Task duplicated successfully."); 
    } 
}

/* --- USER MANAGEMENT ADMIN FUNCTIONS --- */
function openUserManagementModal() { switchTab('admin'); } 
let currentGroupView = 'active';
function setGroupView(view) {
    currentGroupView = view;
    document.getElementById('btn-view-active-groups').className = view === 'active' ? "px-2 py-1 text-[9px] font-bold rounded bg-brandLight text-white transition" : "px-2 py-1 text-[9px] font-bold rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition";
    document.getElementById('btn-view-archived-groups').className = view === 'archived' ? "px-2 py-1 text-[9px] font-bold rounded bg-brandLight text-white transition" : "px-2 py-1 text-[9px] font-bold rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition";
    renderGroupPills();
}

window.renderGroupPills = function() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const ct = document.getElementById('group-pill-list'); if(!ct) return; ct.innerHTML = ''; 
    
    let visibleGroups = groups;
    if (!currentUser.territories.includes('ALL')) {
        visibleGroups = groups.filter(g => currentUser.territories.includes(g.id));
    }

    visibleGroups.filter(g => {
        const isArchived = g.status === 'Archived';
        return currentGroupView === 'active' ? !isArchived : isArchived;
    }).forEach(g => { 
        const isArchived = g.status === 'Archived';
        ct.innerHTML += `<div class="flex justify-between items-center bg-white p-2 rounded border border-blue-100 shadow-sm ${isArchived ? 'opacity-60' : ''}">
            <span class="font-bold text-brandLight">${g.fullName}</span> 
            <div>
                ${isArchived ? 
                    `<button onclick="unarchiveGroup('${g.id}')" class="text-emerald-500 hover:text-emerald-700 mr-2 text-[10px]" title="Restore"><i class="fa-solid fa-rotate-left"></i></button>` : 
                    `<button onclick="openEditGroupModal('${g.id}')" class="text-blue-500 hover:text-blue-700 mr-2 text-[10px]" title="Edit"><i class="fa-solid fa-pen"></i></button>
                     <button onclick="archiveGroup('${g.id}')" class="text-amber-500 hover:text-amber-700 mr-2 text-[10px]" title="Archive"><i class="fa-solid fa-box-archive"></i></button>`
                } 
                <button onclick="openHardDeleteModal('group', '${g.id}', 'SYSTEM', '${g.fullName}')" class="text-red-800 hover:text-red-900 text-[10px]" title="Permanently Delete"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>`; 
    });
}

function openEditGroupModal(id) {
    const g = groups.find(x => x.id === id);
    if (!g) return;
    document.getElementById('edit-group-original-id').value = g.id;
    document.getElementById('edit-group-id').value = g.id;
    document.getElementById('edit-group-name').value = g.name;
    document.getElementById('edit-group-modal').classList.remove('hidden');
}

function saveGroupEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-group-original-id').value;
    const newName = document.getElementById('edit-group-name').value.trim();
    const g = groups.find(x => x.id === id);
    if (g && newName) {
        g.name = newName;
        g.fullName = `${g.id} - ${newName}`;
        window.cloudSaveGroup(g);
        logActivity('SYSTEM', 'Group Edited', `Updated group name to ${g.fullName}`);
        showToast("Group Updated", "The group details were saved.");
        closeModals();
    }
}
function unarchiveGroup(id) { const g = groups.find(x=>x.id===id); if(g && confirm("Restore this group to Active status?")) { g.status = 'Active'; window.cloudSaveGroup(g); logActivity(id, 'System Config', `Restored group ${id}`); } }

function renderTerritoryCheckboxes() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const ct = document.getElementById('admin-u-terr'); if(!ct) return;
    ct.innerHTML = currentUser.territories.includes('ALL') ? `<label class="flex items-center gap-1 font-bold text-brandLight"><input type="checkbox" value="ALL" class="admin-cb"> All Groups</label>` : '';
    getAuthorizedGroups().forEach(g => ct.innerHTML += `<label class="flex items-center gap-1"><input type="checkbox" value="${g.id}" class="admin-cb"> ${g.fullName}</label>`);
}
function addGroup(e) { 
    e.preventDefault(); const gName = document.getElementById('new-group-name').value.trim(); const gId = document.getElementById('new-group-id').value.trim();
    if(gName && gId) {
        if (parseInt(gId) < 100) return alert("Group ID must be 3 digits or higher.");
        if (groups.find(g => g.id === gId)) return alert("This Group ID already exists.");
        window.cloudSaveGroup({ id: gId, name: gName, fullName: `${gId} - ${gName}`, status: 'Active' });
        if(currentUser && !currentUser.territories.includes('ALL')) { currentUser.territories.push(gId); window.currentUser = currentUser; window.cloudSaveUser(currentUser); }
        document.getElementById('new-group-name').value=''; document.getElementById('new-group-id').value=''; 
        logActivity('SYSTEM', 'Group Creation', `Created new group: ${gId} - ${gName}`);
    }
}
function archiveGroup(id) { const g = groups.find(x=>x.id===id); if(g && confirm("Archive this group?")) { g.status = 'Archived'; window.cloudSaveGroup(g); logActivity('SYSTEM', 'Group Archived', `Archived group ${id}`);} }
let currentUserView = 'active';
function setUserView(view) {
    currentUserView = view;
    document.getElementById('btn-view-active-users').className = view === 'active' ? "px-3 py-1 text-[10px] font-bold rounded bg-brandLight text-white shadow-sm transition" : "px-3 py-1 text-[10px] font-bold rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition";
    document.getElementById('btn-view-inactive-users').className = view === 'inactive' ? "px-3 py-1 text-[10px] font-bold rounded bg-brandLight text-white shadow-sm transition" : "px-3 py-1 text-[10px] font-bold rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition";
    
    renderUsersTable();
}

window.renderUsersTable = function() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const pendingTb = document.getElementById('pending-users-table'); const activeTb = document.getElementById('active-users-table');
    const pendingBadge = document.getElementById('pending-count-badge'); 
    const searchVal = document.getElementById('user-search-input') ? document.getElementById('user-search-input').value.toLowerCase() : '';
    if(!pendingTb || !activeTb) return;
    pendingTb.innerHTML = ''; activeTb.innerHTML = ''; 
    
    const agIds = getAuthorizedGroups().map(g => String(g.id));
    const currTerrs = (currentUser.territories || []).map(t => String(t));
    
    const visibleUsers = users.filter(u => {
        const userTerrs = (u.territories || []).map(t => String(t));
        if (currTerrs.includes('ALL')) return true;
        if (u.role === 'Pending') return userTerrs.some(t => agIds.includes(t));
        return userTerrs.some(t => agIds.includes(t));
    });
    
    let pendingCount = 0;
    const isSysAdmin = currentUser.role === 'System Admin';

    const bulkActions = document.getElementById('user-bulk-actions');
    const btnArchive = document.getElementById('btn-bulk-archive-user');
    const btnRestore = document.getElementById('btn-bulk-unarchive-user');
    const headerCheckbox = document.getElementById('user-bulk-checkbox-header');
    
    if (bulkActions) {
        if (isSysAdmin) {
            bulkActions.classList.remove('hidden');
            if (headerCheckbox) headerCheckbox.style.display = 'table-cell';
            if (btnArchive) btnArchive.style.display = currentUserView === 'active' ? 'block' : 'none';
            if (btnRestore) btnRestore.style.display = currentUserView === 'inactive' ? 'block' : 'none';
        } else {
            bulkActions.classList.add('hidden');
            if (headerCheckbox) headerCheckbox.style.display = 'none';
        }
    }

    visibleUsers.forEach(u => {
        // Hide System Admin users from non-System Admin accounts
        if (u.role === 'System Admin' && currentUser.role !== 'System Admin') return;

        const phoneDisplay = u.phone || "No Phone Provided";
        const searchString = `${u.name || ''} ${u.username || ''} ${u.role || ''}`.toLowerCase();
        const userTerrs = (u.territories || []).map(t => String(t));

        if (u.role === 'Pending') {
            pendingCount++;
            pendingTb.innerHTML += `<tr class="hover:bg-rose-100 transition-colors"><td class="p-2 border-b border-rose-100"><div class="font-bold text-rose-900">${u.name}</div><div class="text-[9px] text-rose-700">${u.username} • ${phoneDisplay}</div></td><td class="p-2 border-b border-rose-100 text-[10px] font-mono text-rose-800">${userTerrs.join(', ') || 'N/A'}</td><td class="p-2 border-b border-rose-100 text-center space-x-1"><button onclick="openAdminEdit('${u.username}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded shadow-sm text-[10px] font-bold">Approve</button><button onclick="deleteUserRow('${u.username}')" class="bg-white border border-rose-300 text-rose-600 hover:bg-rose-200 px-2 py-1 rounded shadow-sm text-[10px] font-bold">Deny</button></td></tr>`;
        } else {
            if (searchVal && !searchString.includes(searchVal)) return;
            
            const isArchived = u.status === 'Archived' || u.status === 'Frozen'; 
            if (currentUserView === 'active' && isArchived) return;
            if (currentUserView === 'inactive' && !isArchived) return;

            const checkboxHtml = isSysAdmin ? `<td class="p-2 text-center"><input type="checkbox" class="user-cb" value="${u.username}"></td>` : '';
            const archiveBadge = isArchived ? `<span class="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-black ml-2 uppercase">Archived</span>` : '';

            const quickArchiveBtn = isSysAdmin ? (isArchived 
                ? `<button onclick="toggleUserArchiveStatus('${u.username}', false)" class="text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded shadow-sm" title="Restore User"><i class="fa-solid fa-rotate-left"></i></button>`
                : `<button onclick="toggleUserArchiveStatus('${u.username}', true)" class="text-amber-600 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded shadow-sm" title="Archive User"><i class="fa-solid fa-box-archive"></i></button>`) : '';

            const deleteBtn = isSysAdmin ? `<button onclick="deleteUserRow('${u.username}')" class="text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded shadow-sm" title="Permanently Delete User"><i class="fa-solid fa-trash-can"></i></button>` : '';

            activeTb.innerHTML += `<tr class="hover:bg-gray-50 transition-colors">
                ${checkboxHtml}
                <td class="p-2"><div class="font-bold text-gray-900">${u.name} ${archiveBadge}</div><div class="text-[9px] text-gray-500">${u.username} • ${phoneDisplay}</div></td>
                <td class="p-2"><span class="font-bold text-brandLight">${u.role}</span><div class="text-[9px] text-gray-500">${userTerrs.includes('ALL')?'All Groups':userTerrs.join(', ')}</div></td>
                <td class="p-2 text-center space-x-1 whitespace-nowrap">
                    ${quickArchiveBtn}
                    <button onclick="openAdminEdit('${u.username}')" class="text-blue-600 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded shadow-sm" title="Manage Options"><i class="fa-solid fa-gear"></i></button>
                    <button onclick="adminSendPasswordReset('${u.username}')" class="text-gray-500 border border-gray-200 hover:bg-gray-50 px-2 py-1 rounded shadow-sm" title="Send Password Reset"><i class="fa-solid fa-key"></i></button>
                    ${deleteBtn}
                </td>
            </tr>`;
        }
    });
    if (pendingCount === 0) pendingTb.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-rose-500 italic">No users currently waiting for approval.</td></tr>`;
    if (pendingBadge) pendingBadge.textContent = `${pendingCount} Waiting`;
}

window.toggleUserArchiveStatus = function(email, archive) {
    if(!confirm(`Are you sure you want to ${archive ? 'archive' : 'restore'} access for ${email}?`)) return;
    const u = users.find(x => x.username === email);
    if (u) {
        u.status = archive ? 'Archived' : 'Active';
        window.cloudSaveUser(u);
        
        // If archiving, handle open assigned tasks
        if (archive) {
            const userOpenTasks = activeTasks.filter(t => t.assignee === u.name && t.status !== 'Complete' && t.status !== 'Archived');
            if (userOpenTasks.length > 0) {
                const resetOpen = confirm(`User ${u.name} has ${userOpenTasks.length} open task(s) assigned.\n\nClick OK to reset their open tasks to 'Unassigned', or Cancel to keep their name on the tasks as (Archived User).`);
                if (resetOpen) {
                    userOpenTasks.forEach(t => {
                        t.assignee = '';
                        window.cloudSaveActiveTask(t);
                    });
                    showToast("Tasks Reset", `${userOpenTasks.length} task(s) set to Unassigned.`);
                }
            }
        }

        logActivity('SYSTEM', archive ? 'User Archived' : 'User Restored', `Updated access status for ${u.username}`);
        showToast("Status Updated", `User has been ${archive ? 'archived' : 'restored'}.`);
        renderUsersTable();
        renderActiveTasks();
    }
}

window.bulkArchiveUsers = function(archive) {
    const emails = getSelected('user-cb');
    if(emails.length === 0) return alert("Select users first.");
    if(!confirm(`Are you sure you want to ${archive ? 'archive' : 'restore'} access for ${emails.length} user(s)?`)) return;
    emails.forEach(email => {
        const u = users.find(x => x.username === email);
        if (u) {
            u.status = archive ? 'Archived' : 'Active';
            window.cloudSaveUser(u);
            logActivity('SYSTEM', archive ? 'Account Archived' : 'Account Restored', `Updated access status for ${u.username}`);
        }
    });
    showToast("Status Updated", `${emails.length} user(s) have been ${archive ? 'archived' : 'restored'}.`);
    document.querySelectorAll('.user-cb').forEach(cb => cb.checked = false);
}

window.renderWorkloadSummary = function() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    
    const tb = document.getElementById('workload-summary-table');
    const filterEl = document.getElementById('workload-group-filter');
    if (!tb || !filterEl) return;
    
    const agIds = getAuthorizedGroups().map(g => g.id);
    if (filterEl.options.length === 0) {
        filterEl.innerHTML = '<option value="ALL">All Authorized Groups</option>';
        getAuthorizedGroups().forEach(g => {
            filterEl.innerHTML += `<option value="${g.id}">${g.fullName}</option>`;
        });
    }

    const selectedGroup = filterEl.value;
    tb.innerHTML = '';
    const workload = {};

    activeTasks.forEach(t => {
        if (!agIds.includes(t.groupId)) return;
        if (selectedGroup !== 'ALL' && t.groupId !== selectedGroup) return;
        if (t.status === 'Archived' || t.status === 'Complete' || t.isNote) return;

        const assignee = t.assignee && t.assignee.trim() !== '' ? t.assignee : '🚨 Unassigned';
        
        if (!workload[assignee]) workload[assignee] = { total: 0, overdue: 0 };
        workload[assignee].total++;

        const today = new Date(); 
        today.setHours(0,0,0,0);
        const tgt = new Date(t.targetDate + "T00:00:00");
        if (today > tgt) workload[assignee].overdue++;
    });

    const sortedAssignees = Object.keys(workload).sort((a, b) => workload[b].total - workload[a].total);

    if (sortedAssignees.length === 0) {
        tb.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-indigo-400 italic">No open tasks found for the selected group(s).</td></tr>`;
        return;
    }

    sortedAssignees.forEach(user => {
        const data = workload[user];
        const isUnassigned = user === '🚨 Unassigned';
        const userClass = isUnassigned ? 'text-rose-600 font-black' : 'text-gray-800 font-bold';
        const overdueClass = data.overdue > 0 ? 'text-rose-600 bg-rose-50 font-black' : 'text-emerald-600 font-bold';
        const safeUserStr = user.replace(/'/g, "\\'");
        
        tb.innerHTML += `
            <tr class="hover:bg-indigo-50 transition-colors cursor-pointer group" onclick="openAssigneeTaskModal('${safeUserStr}', '${selectedGroup}')" title="Click to view full task breakdown">
                <td class="p-3 ${userClass} flex items-center justify-between">
                    ${user} 
                    <i class="fa-solid fa-arrow-up-right-from-square text-indigo-300 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </td>
                <td class="p-3 text-center font-bold text-brandLight">${data.total}</td>
                <td class="p-3 text-center rounded ${overdueClass}">${data.overdue}</td>
            </tr>`;
    });
}

window.openAssigneeTaskModal = function(assignee, selectedGroup) {
    const subtitle = document.getElementById('assignee-modal-subtitle');
    const tb = document.getElementById('assignee-modal-table-body');
    subtitle.textContent = `Open tasks for: ${assignee}`;
    tb.innerHTML = '';
    
    const agIds = getAuthorizedGroups().map(g => g.id);
    const today = new Date(); 
    today.setHours(0,0,0,0);
    
    let userTasks = activeTasks.filter(t => {
        if (!agIds.includes(t.groupId)) return false;
        if (selectedGroup !== 'ALL' && t.groupId !== selectedGroup) return false;
        if (t.status === 'Archived' || t.status === 'Complete' || t.isNote) return false;
        
        const taskAssignee = t.assignee && t.assignee.trim() !== '' ? t.assignee : '🚨 Unassigned';
        return taskAssignee === assignee;
    });
    
    userTasks.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    
    userTasks.forEach(t => {
        const tgt = new Date(t.targetDate + "T00:00:00");
        const isOverdue = today > tgt;
        
        let dateDisplay = `<span class="font-mono text-[10px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-gray-700'}">${formatTargetDate(t.targetDate)}</span>`;
        if(isOverdue) dateDisplay += ` <br><span class="bg-rose-100 text-rose-700 px-1 py-0.5 rounded text-[8px] font-black uppercase">Overdue</span>`;
        
        let pName = 'Unknown Program';
        const p = programs.find(x => x.id === t.programId);
        if (p) pName = `[${p.groupId}]<br>${p.season}`;
        else if (t.isOneOff) pName = `[${t.groupId}]<br>One-Off`;
        
        let statusBadge = t.status === 'In Progress' ? 
            `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold">In Progress</span>` : 
            `<span class="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[9px]">Pending</span>`;
        
        tb.innerHTML += `
            <tr class="hover:bg-indigo-50 cursor-pointer" onclick="openEditActiveTask('${t.id}')">
                <td class="p-3 font-bold text-gray-500 text-[10px] leading-tight">${pName}</td>
                <td class="p-3 font-bold text-brandLight">${t.name}</td>
                <td class="p-3 whitespace-nowrap">${dateDisplay}</td>
                <td class="p-3 text-center">${statusBadge}</td>
            </tr>
        `;
    });
    
    document.getElementById('assignee-task-modal').classList.remove('hidden');
}

function deleteUserRow(em) { 
    if(confirm(`Are you sure you want to deny access for ${em}?`)) { 
        const u = users.find(x => x.username === em);
        if (u) {
            u.role = 'Denied';
            u.status = 'Denied';
            window.cloudSaveUser(u);
            logActivity('SYSTEM', 'User Denied', `Denied group access request for ${em}`);
            showToast("Access Denied", `Denied request for ${u.name}`);
        }
    } 
}

window.openSelfDeleteModal = function() {
    document.getElementById('self-delete-confirm-input').value = '';
    document.getElementById('self-delete-modal').classList.remove('hidden');
}

window.handleSelfDeleteAccount = async function(e) {
    e.preventDefault();
    if (!currentUser) return;

    const confirmText = document.getElementById('self-delete-confirm-input').value.trim();
    if (confirmText !== 'DELETE') {
        return alert("Please type 'DELETE' in all capital letters to confirm account deletion.");
    }

    try {
        showToast("Processing", "Deleting profile and authentication credentials...");
        const username = currentUser.username;
        
        await window.cloudDeleteUser(username);
        logActivity('SYSTEM', 'Self Account Deletion', `User ${username} deleted their own account.`);
        
        if (window.auth && window.auth.currentUser && typeof window.deleteAuthUser === 'function') {
            await window.deleteAuthUser();
        }

        closeModals();
        showToast("Account Deleted", "Your profile and login credentials have been permanently removed.");
        logout();

    } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
            alert("Security Notice: Deleting your login credentials requires a fresh sign-in. Please sign out, sign back in, and try deleting your account again.");
        } else {
            alert("Error deleting account credentials: " + err.message);
        }
    }
}

window.openReRouteModal = function(type) {
    document.getElementById('reroute-action-type').value = type;
    const createFields = document.getElementById('reroute-create-fields');
    const joinFields = document.getElementById('reroute-join-fields');
    const title = document.getElementById('reroute-modal-title');
    
    if (type === 'create') {
        title.textContent = "Create New Franchise Group";
        createFields.classList.remove('hidden');
        joinFields.classList.add('hidden');
    } else {
        title.textContent = "Request Access to Group";
        joinFields.classList.remove('hidden');
        createFields.classList.add('hidden');
    }
    
    document.getElementById('reroute-modal').classList.remove('hidden');
}

window.submitReRoute = async function(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const type = document.getElementById('reroute-action-type').value;
    
    if (type === 'create') {
        let requestedId = document.getElementById('reroute-create-id').value.trim();
        const gName = document.getElementById('reroute-create-name').value.trim();
        
        if (!gName) return alert("Please enter a Group Name.");
        
        if (requestedId) {
            if (groups.find(g => String(g.id) === requestedId)) {
                return alert(`Group Number ${requestedId} is already in use.`);
            }
        } else {
            const validIds = groups.map(g => parseInt(g.id)).filter(id => !isNaN(id));
            requestedId = ((validIds.length > 0 ? Math.max(...validIds) : 8764) + 1).toString();
        }

        const newGroupData = { id: requestedId, name: gName, fullName: `${requestedId} - ${gName}`, status: 'Active' };
        
        currentUser.role = 'Group Owner';
        currentUser.status = 'Active';
        currentUser.territories = [requestedId];
        
        await window.cloudSaveGroup(newGroupData);
        await window.cloudSaveUser(currentUser);
        
        closeModals();
        showToast("Group Created", `You are now Owner of Group ${requestedId}`);
        unlockPortal();

    } else {
        const joinId = document.getElementById('reroute-join-id').value.trim();
        if (!joinId) return alert("Please enter a Group Number.");
        
        currentUser.role = 'Pending';
        currentUser.status = 'Pending';
        currentUser.territories = [joinId];
        
        await window.cloudSaveUser(currentUser);
        
        closeModals();
        showToast("Request Sent", `Requested access to Group ${joinId}`);
        unlockPortal();
    }
}

function openAdminEdit(em) {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return;
    const u = users.find(x => x.username === em); if(!u) return;
    document.getElementById('admin-u-email').value = u.username;
    const roleSel = document.getElementById('admin-u-role'); roleSel.innerHTML = '';
    
    // Hide System Admin role tier from selection if current user is not a System Admin
    ROLES.forEach(r => { 
        if (r === 'System Admin' && currentUser.role !== 'System Admin') return;
        roleSel.innerHTML += `<option value="${r}">${r}</option>`; 
    });
    roleSel.innerHTML += `<option value="Pending">Pending (Lock Out)</option>`; 
    roleSel.value = u.role;
    
    renderTerritoryCheckboxes(); 
    
    const userTerrs = u.territories || [];
    document.querySelectorAll('.admin-cb').forEach(cb => cb.checked = userTerrs.includes(cb.value));
    document.getElementById('admin-edit-user-modal').classList.remove('hidden');
}

function adminSaveUser(e) {
    e.preventDefault(); const em = document.getElementById('admin-u-email').value; const u = users.find(x => x.username === em);
    if(u) { 
        const newRole = document.getElementById('admin-u-role').value;
        const selectedTerrs = Array.from(document.querySelectorAll('.admin-cb:checked')).map(cb=>cb.value);
        
        u.role = newRole; 
        u.territories = selectedTerrs.length > 0 ? selectedTerrs : (u.territories || []); 
        u.status = (newRole === 'Pending') ? 'Pending' : 'Active'; 
        
        window.cloudSaveUser(u); 
        document.getElementById('admin-edit-user-modal').classList.add('hidden'); 
        showToast("Saved", `Permissions updated for ${u.name}`);
        logActivity('SYSTEM', 'User Role Update', `Updated access/role for ${u.username} to ${newRole}`);
    }
}

function renderPermissions() {
    const tb = document.getElementById('permissions-table-body'); if(!tb) return; 
    const groupId = document.getElementById('perm-group-select').value;
    if (!groupId || groupId === 'ALL') { tb.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">Please select a specific group context to edit permissions.</td></tr>`; return; }
    
    tb.innerHTML = '';
    const gPerms = window.groupPermissions[groupId] || window.DEFAULT_PERMISSIONS;

    ROLES.forEach(r => {
        if (r === 'System Admin') return; 
        const p = gPerms[r] || window.DEFAULT_PERMISSIONS["Staff"] || {};
        
        tb.innerHTML += `<tr class="hover:bg-gray-50">
            <td class="p-3 font-bold text-gray-800">${r}</td>
            <td class="p-3 text-center"><input type="checkbox" onchange="updatePerm('${groupId}', '${r}','manageGroups',this.checked)" ${p.manageGroups?'checked':''}></td>
            <td class="p-3 text-center"><input type="checkbox" onchange="updatePerm('${groupId}', '${r}','createPrograms',this.checked)" ${p.createPrograms?'checked':''}></td>
            <td class="p-3 text-center"><input type="checkbox" onchange="updatePerm('${groupId}', '${r}','editTemplates',this.checked)" ${p.editTemplates?'checked':''}></td>
            <td class="p-3 text-center"><input type="checkbox" onchange="updatePerm('${groupId}', '${r}','editTasks',this.checked)" ${p.editTasks?'checked':''}></td>
        </tr>`;
    });
}

function updatePerm(groupId, tier, field, val) { 
    if(!window.groupPermissions[groupId]) window.groupPermissions[groupId] = JSON.parse(JSON.stringify(window.DEFAULT_PERMISSIONS));
    if(!window.groupPermissions[groupId][tier]) window.groupPermissions[groupId][tier] = {};
    
    window.groupPermissions[groupId][tier][field] = val; 
    window.cloudSavePermissions(groupId, window.groupPermissions[groupId]); 
    logActivity(groupId, 'System Config', `Updated Group System Permissions Matrix`);
}

/* --- MULTI-SELECT & BULK ACTIONS --- */
function toggleSelectAll(className, isChecked) { document.querySelectorAll(`.${className}`).forEach(cb => cb.checked = isChecked); }
function getSelected(className) { return Array.from(document.querySelectorAll(`.${className}:checked`)).map(cb => cb.value); }

function bulkDelete(type) {
    let cls, items;
    if(type === 'programs') { cls = 'prog-cb'; items = programs; }
    else if(type === 'templates') { cls = 'tpl-cb'; items = templates; }
    else if(type === 'tasks') { cls = 'task-cb'; items = activeTasks; }
    else return; 
    
    const ids = getSelected(cls);
    if(ids.length === 0) return alert("Select items first.");
    
    const selectedItems = items.filter(x => ids.includes(x.id));
    const names = selectedItems.map(x => x.name || `${x.preHeader || ''} ${x.season || ''}`).join(', ');
    const groupId = selectedItems.length > 0 ? selectedItems[0].groupId : 'SYSTEM';

    openHardDeleteModal(type.replace(/s$/, ''), ids, groupId, names);
}

function bulkEditOpen(type) {
    let cls;
    if(type === 'programs') cls = 'prog-cb';
    else if(type === 'tasks') cls = 'task-cb';
    else if(type === 'templates') cls = 'tpl-cb';
    
    const ids = getSelected(cls);
    if(ids.length === 0) return alert("Select items first.");
    
    document.getElementById('bulk-edit-count').textContent = ids.length;
    document.getElementById('bulk-edit-mode').value = type;
    
    document.getElementById('bulk-edit-programs-fields').classList.add('hidden');
    document.getElementById('bulk-edit-tasks-fields').classList.add('hidden');
    document.getElementById('bulk-edit-templates-fields').classList.add('hidden');
    
    if(type === 'programs') document.getElementById('bulk-edit-programs-fields').classList.remove('hidden');
    if(type === 'tasks') document.getElementById('bulk-edit-tasks-fields').classList.remove('hidden');
    if(type === 'templates') document.getElementById('bulk-edit-templates-fields').classList.remove('hidden');
    
    document.getElementById('bulk-edit-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('bulk-edit-pane').classList.add('open'), 10);
}

function closeBulkEdit() {
    document.getElementById('bulk-edit-pane').classList.remove('open');
    setTimeout(() => document.getElementById('bulk-edit-overlay').classList.add('hidden'), 300);
}

function executeBulkEdit(e) {
    e.preventDefault();
    const mode = document.getElementById('bulk-edit-mode').value;
    let ids = [];
    
    if(mode === 'programs') {
        ids = getSelected('prog-cb');
        const doYr = document.getElementById('be-cb-year').checked; const yrVal = document.getElementById('be-year').value;
        const doSea = document.getElementById('be-cb-season').checked; const seaVal = document.getElementById('be-season').value;
        const doVen = document.getElementById('be-cb-venue').checked; const venVal = document.getElementById('be-venue').value;
        
        ids.forEach(id => {
            const p = programs.find(x=>x.id===id);
            if(p) {
                if(doYr) p.year = yrVal; if(doSea) p.season = seaVal; if(doVen) p.venue = venVal;
                window.cloudSaveProgram(p);
            }
        });
        logActivity('SYSTEM', 'Bulk Edit', `Bulk edited ${ids.length} programs`);
    } else if (mode === 'tasks') {
        ids = getSelected('task-cb');
        const doAss = document.getElementById('be-cb-assignee').checked; 
        let assVal = document.getElementById('be-assignee').value;
        if(assVal === 'CUSTOM') assVal = document.getElementById('be-assignee-custom').value.trim();

        const doStat = document.getElementById('be-cb-status').checked; const statVal = document.getElementById('be-status').value;
        const doDate = document.getElementById('be-cb-date').checked; const dateVal = document.getElementById('be-date').value;
        
        ids.forEach(id => {
            const t = activeTasks.find(x=>x.id===id);
            if(t) {
                if(doAss) t.assignee = assVal; if(doStat) t.status = statVal; if(doDate && dateVal) t.targetDate = dateVal;
                window.cloudSaveActiveTask(t);
            }
        });
        logActivity('SYSTEM', 'Bulk Edit', `Bulk edited ${ids.length} tasks`);
    } else if (mode === 'templates') {
        ids = getSelected('tpl-cb');
        const doRole = document.getElementById('be-cb-tpl-role').checked; const roleVal = document.getElementById('be-tpl-role').value;
        const doAnchor = document.getElementById('be-cb-tpl-anchor').checked; const anchorVal = document.getElementById('be-tpl-anchor').value;
        const doOffset = document.getElementById('be-cb-tpl-offset').checked; 
        const offsetNum = parseInt(document.getElementById('be-tpl-offset-num').value || "0"); 
        const offsetDir = document.getElementById('be-tpl-offset-dir').value;
        
        ids.forEach(id => {
            const t = templates.find(x=>x.id===id);
            if(t) {
                if(doRole) t.role = roleVal;
                if(doAnchor) t.anchor = anchorVal;
                if(doOffset) { t.offsetNum = offsetNum; t.offsetDir = offsetDir; }
                window.cloudSaveTemplate(t);
            }
        });
        logActivity('SYSTEM', 'Bulk Edit', `Bulk edited ${ids.length} task profiles`);
    }
    
    closeBulkEdit(); showToast("Bulk Edit Complete", `${ids.length} items updated.`);
    const elProg = document.getElementById('selectAllProgs'); if (elProg) elProg.checked = false;
    const elTask = document.getElementById('selectAllTasks'); if (elTask) elTask.checked = false;
    const elTpl = document.getElementById('selectAllTpls'); if (elTpl) elTpl.checked = false;
}

/* --- BRANDING --- */
function applyBrandingUI() {
    if(!currentBranding) return;

    // Force Scheme 2 Colors
    currentBranding.primaryColor = '#0F172A';       // Dark Slate Header
    currentBranding.primaryLightColor = '#6366F1';  // Electric Indigo Tabs & Buttons
    currentBranding.accentColor = '#06B6D4';        // Bright Cyan
    currentBranding.successColor = '#059669';       // Forest Emerald
    currentBranding.dangerColor = '#E11D48';        // Rose Red

    document.documentElement.style.setProperty('--brand-primary', currentBranding.primaryColor);
    document.documentElement.style.setProperty('--brand-primary-light', currentBranding.primaryLightColor);
    document.documentElement.style.setProperty('--brand-accent', currentBranding.accentColor);
    document.documentElement.style.setProperty('--brand-success', currentBranding.successColor);
    document.documentElement.style.setProperty('--brand-danger', currentBranding.dangerColor);
    
    const titleEl = document.getElementById('brand-title-display'); 
    if(titleEl) titleEl.textContent = currentBranding.title || "TerritoryHub";
    
    const logoImg = document.getElementById('brand-logo-img'); 
    if(logoImg && currentBranding.logoUrl) logoImg.src = currentBranding.logoUrl;

    const authLogoImg = document.getElementById('auth-logo-img');
    if(authLogoImg && currentBranding.logoUrl) authLogoImg.src = currentBranding.logoUrl;
}

// --- CSV DOWNLOAD UTILITY ---
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- CONTEXT AWARE EXPORT (CURRENT VIEW) ---
function exportCurrentViewToCSV() {
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    if (!currentUser) return alert("Please log in first.");
    
    const agIds = getAuthorizedGroups().map(g => g.id);
    let csv = "";
    let filename = "";

    if (!document.getElementById('view-tasks').classList.contains('hidden')) {
        filename = `Task_List_Export_${new Date().toISOString().split('T')[0]}.csv`;
        csv = "Group ID,Program ID,Task Name,Level,Marketing Category,Note Event,Status,Target Date,Assignee,Notes,Completion Notes\n";
        
        const fGrp = document.getElementById('filter-task-group').value; 
        const fPrg = document.getElementById('filter-task-program').value;
        const fAss = document.getElementById('filter-task-assignee').value; 
        const fSt = document.getElementById('filter-task-status').value;
        const fLev = document.getElementById('filter-task-level').value;

        activeTasks.forEach(t => {
            if (!agIds.includes(t.groupId)) return;
            if(fGrp !== 'ALL' && t.groupId !== fGrp) return; 
            if(fPrg !== 'ALL' && t.programId !== fPrg) return;
            if(currentTaskView === 'active' && t.status === 'Archived') return;
            if(currentTaskView === 'archived' && t.status !== 'Archived') return;
            if(currentTaskView === 'active' && fSt !== 'ALL' && t.status !== fSt) return;
            if(fLev !== 'ALL' && (t.level || 'Operational') !== fLev) return;
            
            let isUn = (!t.assignee || t.assignee.trim() === '');
            if (fAss === 'ME' && t.assignee !== currentUser.name) return;
            if (fAss === 'UNASSIGNED' && !isUn) return;

            csv += `"${t.groupId}","${t.programId}","${t.name}","${t.level || 'Operational'}","${t.marketingCategory || ''}","${t.isNote ? 'Yes' : 'No'}","${t.status}","${t.targetDate}","${t.assignee || 'Unassigned'}","${(t.notes || '').replace(/"/g, '""')}","${(t.completionNotes || '').replace(/"/g, '""')}"\n`;
        });
    } 
    else if (!document.getElementById('view-control').classList.contains('hidden')) {
        filename = `Programs_Export_${new Date().toISOString().split('T')[0]}.csv`;
        csv = "Group ID,Pre-Header,Year,Season,Type,Start Date,Final Deadline,Early Deadline,Offseason Deadline,Secondary Start Dates,Bye Dates,Weeks,Venue,Full Price,Offseason Price,Early Price,Late Fee\n";
        
        const fGrp = document.getElementById('filter-prog-group').value; 
        const fYr = document.getElementById('filter-prog-year').value;
        const fSea = document.getElementById('filter-prog-season').value; 
        const fTyp = document.getElementById('filter-prog-type').value;

        programs.forEach(p => {
            if (!agIds.includes(p.groupId)) return;
            if(fGrp !== 'ALL' && p.groupId !== fGrp) return; 
            if(fYr !== 'ALL' && p.year !== fYr) return;
            if(fSea !== 'ALL' && p.season !== fSea) return; 
            if(fTyp !== 'ALL' && p.type !== fTyp) return;

            const secStartsStr = Array.isArray(p.secStartDates) ? p.secStartDates.join(';') : '';
            const byeDatesStr = Array.isArray(p.byeDates) ? p.byeDates.join(';') : '';

            csv += `"${p.groupId}","${p.preHeader || ''}","${p.year}","${p.season}","${p.type}","${p.dateStart || ''}","${p.dateFinal || ''}","${p.dateEarly || ''}","${p.dateOffseason || ''}","${secStartsStr}","${byeDatesStr}","${p.weeks || ''}","${(p.venue || '').replace(/"/g, '""')}","${p.price || ''}","${p.priceOffseason || ''}","${p.priceEarly || ''}","${p.priceLateFee || ''}"\n`;
        });
    }
    else if (!document.getElementById('view-templates').classList.contains('hidden')) {
        filename = `Task_Profiles_Export_${new Date().toISOString().split('T')[0]}.csv`;
        csv = "Group Scope,Level,Marketing Category,Type,Pre-Header,Task Name,Seasons,Offset Days,Offset Direction,Anchor,Default Role\n";
        
        const fGrp = document.getElementById('filter-template-group').value; 
        const fTyp = document.getElementById('filter-template-type').value;

        templates.forEach(t => {
            if (fGrp !== 'ALL' && t.groupId !== fGrp) return;
            if (fGrp === 'ALL' && t.groupId !== 'ALL' && !agIds.includes(t.groupId)) return;
            if (fTyp !== 'ALL' && t.type !== fTyp) return;

            csv += `"${t.groupId}","${t.level || 'Operational'}","${t.marketingCategory || ''}","${t.type}","${t.preHeader || ''}","${t.name}","${t.seasons.join(' ')}","${t.offsetNum}","${t.offsetDir}","${t.anchor}","${t.role || ''}"\n`;
        });
    } 
    else {
        return alert("Export is only available on the Task List, Programs, or Task Profiles tabs.");
    }

    if (csv.split("\n").length <= 1) return alert("No data matches current filters to export.");
    downloadCSV(csv, filename);
}

// --- CUSTOM DATE RANGE REPORTING ---
function openReportModal() {
    document.getElementById('report-start').value = '';
    document.getElementById('report-end').value = '';
    document.getElementById('reporting-modal').classList.remove('hidden');
}

function generateCustomReport(e) {
    e.preventDefault();
    if (!currentUser && window.currentUser) currentUser = window.currentUser;
    const agIds = getAuthorizedGroups().map(g => g.id);
    
    const type = document.getElementById('report-type').value;
    const startObj = new Date(document.getElementById('report-start').value + "T00:00:00");
    const endObj = new Date(document.getElementById('report-end').value + "T23:59:59");
    
    let csv = "";
    
    if (type === 'tasks') {
        csv = "Group ID,Task Name,Level,Status,Target Date,Assignee,Notes\n";
        activeTasks.forEach(t => {
            if (!agIds.includes(t.groupId) || t.status === 'Archived' || !t.targetDate) return;
            const tgt = new Date(t.targetDate + "T00:00:00");
            if (tgt >= startObj && tgt <= endObj) {
                csv += `"${t.groupId}","${t.name}","${t.level || 'Operational'}","${t.status}","${t.targetDate}","${t.assignee || 'Unassigned'}","${(t.notes || '').replace(/"/g, '""')}"\n`;
            }
        });
    } else if (type === 'programs') {
        csv = "Group ID,Pre-Header,Year,Season,Type,Start Date,Final Deadline,Early Deadline,Offseason Deadline,Secondary Start Dates,Bye Dates,Weeks,Venue,Full Price,Offseason Price,Early Price,Late Fee\n";
        programs.forEach(p => {
            if (!agIds.includes(p.groupId) || !p.dateStart) return;
            const startDate = new Date(p.dateStart + "T00:00:00");
            if (startDate >= startObj && startDate <= endObj) {
                const secStartsStr = Array.isArray(p.secStartDates) ? p.secStartDates.join(';') : '';
                const byeDatesStr = Array.isArray(p.byeDates) ? p.byeDates.join(';') : '';

                csv += `"${p.groupId}","${p.preHeader || ''}","${p.year}","${p.season}","${p.type}","${p.dateStart || ''}","${p.dateFinal || ''}","${p.dateEarly || ''}","${p.dateOffseason || ''}","${secStartsStr}","${byeDatesStr}","${p.weeks || ''}","${(p.venue || '').replace(/"/g, '""')}","${p.price || ''}","${p.priceOffseason || ''}","${p.priceEarly || ''}","${p.priceLateFee || ''}"\n`;
            }
        });
    }

    closeModals();
    
    if (csv.split("\n").length <= 1) {
        showToast("No Data", "No records found in that date range.");
        return;
    }
    
    downloadCSV(csv, `Custom_Report_${type}_${new Date().getTime()}.csv`);
    showToast("Report Downloaded", "Your custom CSV report has been generated.");
}

// --- TWO-STEP CSV IMPORT LOGIC ---

function openImportModal(type) {
    document.getElementById('import-type').value = type;
    document.getElementById('import-file-input').value = ''; 
    document.getElementById('import-modal').classList.remove('hidden');
}

function downloadImportTemplate() {
    const type = document.getElementById('import-type').value;
    let csv = "";
    let filename = "";

    if (type === 'programs') {
        csv = "Group ID,Pre-Header,Year,Season,Type,Start Date,Final Deadline,Early Deadline,Offseason Deadline,Secondary Start Dates,Bye Dates,Weeks,Venue,Full Price,Offseason Price,Early Price,Late Fee\n";
        filename = "Program_Import_Template.csv";
    } else if (type === 'templates') {
        csv = "Group Scope,Level,Marketing Category,Type,Pre-Header,Task Name,Seasons,Offset Days,Offset Direction,Anchor,Default Role\n";
        filename = "Task_Profile_Import_Template.csv";
    }

    downloadCSV(csv, filename);
    showToast("Template Downloaded", "Fill this out and upload it in Step 2.");
}

function executeImport() {
    const type = document.getElementById('import-type').value;
    const fileInput = document.getElementById('import-file-input');
    const file = fileInput.files[0];

    if (!file) return alert("Please select a file to import in Step 2.");
    if (file.size > 5 * 1024 * 1024) return alert("File is too large. Please upload a CSV smaller than 5MB.");

    showToast("Importing", "Parsing file data...");

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split(/\r?\n/);
        let importCount = 0;
        
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i] || rows[i].trim() === '') continue; 
            
            const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanCols = cols.map(col => col.replace(/^"|"$/g, '').trim());
            
            if (type === 'programs') {
                const secStartsRaw = cleanCols[9] || '';
                const byeDatesRaw = cleanCols[10] || '';

                const newProg = {
                    id: generateId('PRG'),
                    groupId: cleanCols[0],
                    preHeader: cleanCols[1] || '',
                    year: cleanCols[2],
                    season: cleanCols[3],
                    type: cleanCols[4],
                    dateStart: cleanCols[5] || '',
                    dateFinal: cleanCols[6] || '',
                    dateEarly: cleanCols[7] || '',
                    dateOffseason: cleanCols[8] || '',
                    secStartDates: secStartsRaw ? secStartsRaw.split(';') : [],
                    byeDates: byeDatesRaw ? byeDatesRaw.split(';') : [],
                    weeks: cleanCols[11] || '',
                    venue: cleanCols[12] || '',
                    price: cleanCols[13] || '',
                    priceOffseason: cleanCols[14] || '',
                    priceEarly: cleanCols[15] || '',
                    priceLateFee: cleanCols[16] || '',
                    deadlineCount: 4,
                    days: ''
                };
                window.cloudSaveProgram(newProg);
                importCount++;
            }
            else if (type === 'templates') {
                const newTpl = {
                    id: generateId('TPL'),
                    groupId: cleanCols[0],
                    level: cleanCols[1] || 'Operational',
                    marketingCategory: cleanCols[2] || '',
                    type: cleanCols[3],
                    preHeader: cleanCols[4] || '',
                    name: cleanCols[5],
                    seasons: cleanCols[6] ? cleanCols[6].split(' ') : [],
                    offsetNum: parseInt(cleanCols[7]) || 0,
                    offsetDir: cleanCols[8] || 'Before',
                    anchor: cleanCols[9] || 'dateStart',
                    role: cleanCols[10] || ''
                };
                window.cloudSaveTemplate(newTpl);
                importCount++;
            }
        }
        
        logActivity('SYSTEM', 'Data Import', `Imported ${importCount} new ${type} from CSV.`);
        showToast("Import Complete", `Successfully imported ${importCount} items.`);
        closeModals();
    };
    
    reader.onerror = function() {
        alert("Failed to read file! Please check the file and try again.");
    };
    
    reader.readAsText(file);
}

// EXPLICIT GLOBAL WINDOW ASSIGNMENTS (At bottom of file)
window.populateFilterOptions = populateFilterOptions;
window.renderGroupPills = renderGroupPills;
window.renderPermissions = renderPermissions;
window.renderUsersTable = renderUsersTable;
window.renderActivityLog = renderActivityLog;
window.populateYearDropdowns = populateYearDropdowns;
window.renderTemplates = renderTemplates;
window.renderActiveTasks = renderActiveTasks;
window.applyBrandingUI = applyBrandingUI;
window.renderWorkloadSummary = renderWorkloadSummary;
window.renderCalendar = renderCalendar;
window.unlockPortal = unlockPortal;
window.toggleSidebar = toggleSidebar;
window.switchTab = switchTab;
window.handleInitialRoute = handleInitialRoute;

// Pricing Side Panel Assignments
window.openPricingPane = openPricingPane;
window.closePricingPane = closePricingPane;
window.saveProgramPricing = saveProgramPricing;
window.handleTaskModalAssigneeChange = handleTaskModalAssigneeChange;
window.handleDatePaste = handleDatePaste;
window.formatInputDateBlur = formatInputDateBlur;
window.handleTplRoleChange = handleTplRoleChange;
