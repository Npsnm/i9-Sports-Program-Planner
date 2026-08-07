import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updatePassword, 
    updateEmail, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup, 
    linkWithPopup, 
    sendPasswordResetEmail, 
    deleteUser 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    collection 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'i9-sports-portal';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { 
    apiKey: "AIzaSyBuXlwYrt2nAolPzjZBDbzDAE8qwO1yPRg", 
    authDomain: "program-planner-npsnm.firebaseapp.com", 
    projectId: "program-planner-npsnm", 
    storageBucket: "program-planner-npsnm.firebasestorage.app", 
    messagingSenderId: "255697704591", 
    appId: "1:255697704591:web:f67728f42bf1d694cec2fa" 
};

let app, db, auth;

try {
    app = initializeApp(firebaseConfig); 
    db = getFirestore(app); 
    auth = getAuth(app);
    window.auth = auth; 
    window.signInWithEmailAndPassword = signInWithEmailAndPassword; 
    window.createUserWithEmailAndPassword = createUserWithEmailAndPassword; 
    window.updatePassword = updatePassword; 
    window.updateEmail = updateEmail; 
    window.signOut = () => signOut(auth); 
    window.linkWithPopup = linkWithPopup; 
    window.sendPasswordResetEmail = sendPasswordResetEmail;
    window.deleteAuthUser = () => deleteUser(auth.currentUser);
    
    const googleProvider = new GoogleAuthProvider(); 
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    
    window.signInWithGoogle = () => signInWithPopup(auth, googleProvider); 
    window.linkGoogle = () => linkWithPopup(auth.currentUser, googleProvider);

    onAuthStateChanged(auth, (user) => {
        if (user) { 
            initRealtimeSync(); 
        } else { 
            window.currentUser = null;
            if (typeof currentUser !== 'undefined') currentUser = null;
            const overlay = document.getElementById('auth-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.classList.remove('hidden');
            }
            document.getElementById('sync-status-text').textContent = "Disconnected"; 
        }
    });
} catch (e) { console.error("Firebase Init Error:", e); }

let activeListeners = [];

function detachRealtimeListeners() {
    activeListeners.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
    activeListeners = [];
}
window.detachRealtimeListeners = detachRealtimeListeners;

function initRealtimeSync() {
    if (!auth.currentUser || !db) return;
    detachRealtimeListeners();
    document.getElementById('sync-status-text').textContent = "Cloud Active";

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'groups'), (snap) => {
            window.groups = snap.docs.map(d => d.data()); window.renderGroupPills(); window.populateFilterOptions(); window.applyPermissions();
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'permissions'), (snap) => {
            let p = {}; snap.docs.forEach(d => p[d.id] = d.data());
            window.groupPermissions = p;
            window.renderPermissions(); window.applyPermissions();
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'portal_users'), (snap) => {
            window.users = snap.docs.map(d => d.data()); 
            window.renderUsersTable();
            window.checkPendingAlerts();
            
            if (auth.currentUser) {
                const em = auth.currentUser.email.toLowerCase();
                let matched = window.users.find(u => u.username.toLowerCase() === em);
                
                if (em === 'nick@npsnm.com') {
                    matched = { username: 'nick@npsnm.com', name: 'Nick Padilla', firstName: 'Nick', lastName: 'Padilla', phone: 'N/A', role: 'System Admin', territories: ['ALL'] };
                }

                if (matched) {
                    window.currentUser = matched;
                    if (typeof currentUser !== 'undefined') currentUser = matched;
                    window.unlockPortal();
                }
            }
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), (snap) => {
            window.activityLogs = snap.docs.map(d => d.data());
            window.renderActivityLog();
            if(document.getElementById('view-control').classList.contains('hidden') === false) window.renderControlCenter();
            if(document.getElementById('view-tasks').classList.contains('hidden') === false) window.renderActiveTasks();
            if(document.getElementById('view-templates').classList.contains('hidden') === false) window.renderTemplates();
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'programs'), (snap) => {
            window.programs = snap.docs.map(d => d.data());
            window.populateYearDropdowns(); window.populateFilterOptions(); window.renderControlCenter(); window.renderActiveTasks(); window.renderDashboard(); window.renderCalendar();
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'task_templates'), (snap) => {
            window.templates = snap.docs.map(d => d.data());
            window.renderTemplates();
        })
    );

    activeListeners.push(
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'active_tasks'), (snap) => {
            window.activeTasks = snap.docs.map(d => d.data());
            window.renderActiveTasks(); 
            window.renderDashboard(); 
            window.renderCalendar();
            if (typeof window.renderWorkloadSummary === 'function') window.renderWorkloadSummary();
        })
    );

    activeListeners.push(
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'branding', 'current'), (docSnap) => {
            if (docSnap.exists()) { window.currentBranding = docSnap.data(); window.applyBrandingUI(); }
        })
    );
}

window.cloudSave = async (col, id, data) => setDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id), data);
window.cloudDelete = async (col, id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));

window.cloudSaveUser = (u) => window.cloudSave('portal_users', u.username.replace(/[^a-zA-Z0-9]/g, '_'), u);
window.cloudDeleteUser = (id) => window.cloudDelete('portal_users', id.replace(/[^a-zA-Z0-9]/g, '_'));
window.cloudSaveGroup = (g) => window.cloudSave('groups', g.id, g);
window.cloudDeleteGroup = (id) => window.cloudDelete('groups', id);
window.cloudSaveProgram = (p) => window.cloudSave('programs', p.id, p);
window.cloudDeleteProgram = (id) => window.cloudDelete('programs', id);
window.cloudSaveTemplate = (t) => window.cloudSave('task_templates', t.id, t);
window.cloudDeleteTemplate = (id) => window.cloudDelete('task_templates', id);
window.cloudSaveActiveTask = (t) => window.cloudSave('active_tasks', t.id, t);
window.cloudDeleteActiveTask = (id) => window.cloudDelete('active_tasks', id);
window.cloudSavePermissions = (groupId, data) => window.cloudSave('permissions', groupId, data);
window.cloudSaveBranding = (b) => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'branding', 'current'), b);