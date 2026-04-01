let isPremiumUser = false; 
let timeOffset = 0;

// ==========================================
// 1. FLIP ANIMATION CONTROLLERS (नया डिज़ाइन)
// ==========================================
function showRegisterForm() { 
    document.getElementById("flip-container").className = 'flip-wrapper active'; 
}
function showLoginForm() { 
    document.getElementById("flip-container").className = 'flip-wrapper close'; 
}

// ==========================================
// 2. SECURITY & FIREBASE SETUP
// ==========================================
document.addEventListener('contextmenu', e => e.preventDefault()); 
document.addEventListener('copy', e => { e.preventDefault(); alert("🚫 कॉपी करना सख्त मना है!"); }); 
document.addEventListener('cut', e => { e.preventDefault(); alert("🚫 कट करना सख्त मना है!"); }); 
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault(); alert("🚫 डेवलपर टूल्स मना है!");
    }
});

const firebaseConfig = {
    apiKey: "AIzaSyBJzwVTvyXlYek1R6NxyvI2Zf-zql2S--E",
    authDomain: "hindi-steno-lab-1.firebaseapp.com",
    projectId: "hindi-steno-lab-1",
    storageBucket: "hindi-steno-lab-1.firebasestorage.app",
    messagingSenderId: "752963570462",
    appId: "1:752963570462:web:718d84f4fb4a3321d3d70f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let currentUserData = { name: "", roll: "", email: "", expiry: "", access: "" };
let currentCategory = "SSC"; 
let autoSaveKey = "";

// ==========================================
// ⚠️ अपनी Google Sheet की लिंक यहाँ डालें! ⚠️
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz14bVnbND--UxCY0la7r4zIfQg-8ZLywrP5cLQkoG1-GrCENErOIAfKe07AOZ_-AMK/exec"; 
// ==========================================

function getRealTime() { return new Date(new Date().getTime() + timeOffset); }

// ==========================================
// 3. NEW LOGIN & SIGNUP ENGINE (Firebase)
// ==========================================
function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    if(!email || !pwd) return alert("कृपया ईमेल और पासवर्ड डालें!");
    
    auth.signInWithEmailAndPassword(email, pwd).then((userCred) => {
        if (!userCred.user.emailVerified && userCred.user.email.toLowerCase() !== "cricketinnings07@gmail.com") {
            auth.signOut();
            alert("⚠️ आपका ईमेल अभी वेरिफाई नहीं हुआ है! कृपया अपने ईमेल (Inbox या Spam) में जाकर वेरिफिकेशन लिंक पर क्लिक करें।");
            return;
        }
        let sessionId = Date.now().toString();
        localStorage.setItem("steno_session", sessionId);
        firebase.database().ref('sessions/' + userCred.user.uid).set(sessionId);
    }).catch(e => { alert("❌ लॉगिन फेल: ईमेल/पासवर्ड गलत है या खाता मौजूद नहीं है।"); });
}

function doSignup() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pwd = document.getElementById('regPassword').value.trim();
    
    if(!name || !email || !pwd) return alert("कृपया सभी जानकारी भरें!");
    if(pwd.length < 6) return alert("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए!");
    
    auth.createUserWithEmailAndPassword(email, pwd).then((userCred) => {
        userCred.user.updateProfile({ displayName: name });
        return userCred.user.sendEmailVerification(); 
    }).then(() => {
        auth.signOut(); 
        alert("✅ आपका खाता बन गया है! सुरक्षा के लिए आपके ईमेल पर एक वेरिफिकेशन लिंक भेजा गया है। कृपया उसे वेरिफाई करें।");
        showLoginForm(); 
    }).catch(e => alert("एरर: " + e.message));
}

function resetPasswordNew() {
    const email = document.getElementById('loginEmail').value.trim();
    if(!email) return alert("पासवर्ड रीसेट के लिए पहले ऊपर अपना ईमेल दर्ज करें और फिर 'पासवर्ड भूल गए' पर क्लिक करें।");
    auth.sendPasswordResetEmail(email).then(() => alert("पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!")).catch(e => alert(e.message));
}

function logoutUser() { localStorage.removeItem("steno_session"); auth.signOut(); location.reload(); }

auth.onAuthStateChanged((user) => {
    if (user) {
        if (!user.emailVerified && user.email.toLowerCase() !== "cricketinnings07@gmail.com") {
            auth.signOut();
            alert("⚠️ आपका ईमेल अभी वेरिफाई नहीं हुआ है! कृपया अपने ईमेल (Inbox या Spam) में जाकर वेरिफिकेशन लिंक पर क्लिक करें।");
            return;
        }

        firebase.database().ref('sessions/' + user.uid).on('value', (snapshot) => {
            let dbSession = snapshot.val(); let currentLocalSession = localStorage.getItem("steno_session");
            if (dbSession && currentLocalSession && dbSession !== currentLocalSession) {
                alert("⚠️ सुरक्षा चेतावनी: आपका खाता किसी दूसरे कंप्यूटर या मोबाइल पर लॉगिन किया गया है! इसलिए आपको यहाँ से लॉगआउट किया जा रहा है।");
                auth.signOut(); location.reload();
            }
        });

        document.getElementById('authWrapper').style.display = 'none';
        document.getElementById('fullScreenLoader').style.display = 'flex'; 
        let loadText = document.getElementById('dynamicLoaderText');
        if(loadText) loadText.innerHTML = "<i class='fas fa-shield-alt'></i> अकाउंट स्टेटस चेक किया जा रहा है..."; 

        let noCacheUrl = GOOGLE_SHEET_WEB_APP_URL + "?t=" + new Date().getTime();

        fetch(noCacheUrl).then(res => res.json()).then(data => {
            if(data.serverTime) timeOffset = data.serverTime - new Date().getTime();

            let approvedUsersMap = data.approvedUsers || {};
            let userEmail = user.email.toLowerCase();
            let userName = user.displayName || user.email.split('@')[0];

            if(approvedUsersMap[userEmail]) {
                isPremiumUser = true; 
                let userDataFromSheet = approvedUsersMap[userEmail];
                currentUserData = { name: userName, roll: userDataFromSheet.roll, email: user.email, expiry: userDataFromSheet.expiry, access: userDataFromSheet.access || "All" };
                document.getElementById('vipBadge').innerHTML = '<i class="fas fa-crown"></i> VIP PRO';
                document.getElementById('vipBadge').style.color = '#ef4444';
            } else {
                isPremiumUser = false; 
                currentUserData = { name: userName, roll: "FREE-USER", email: user.email, expiry: "Demo & Live Only", access: "Demo" };
                document.getElementById('vipBadge').innerHTML = '<i class="fas fa-user"></i> FREE USER';
                document.getElementById('vipBadge').style.color = '#f59e0b';
            }

            autoSaveKey = "steno_autosave_" + currentUserData.email;
            document.getElementById('fullScreenLoader').style.display = 'none';
            document.getElementById('profileEmail').innerText = currentUserData.email;
            document.getElementById('profileName').innerText = currentUserData.name;
            document.getElementById('profileRoll').innerText = currentUserData.roll;
            document.getElementById('profileExpiry').innerText = currentUserData.expiry;
            document.getElementById('mainNavbar').style.display = 'flex';
            document.getElementById('homeName').innerText = currentUserData.name;
            
            adminSettingsData = data.adminSettings; globalHistoryData = data.history; 
            globalLeaderboardData = data.leaderboard; liveResultsData = data.liveResults;
            if(data.notification) document.getElementById('notificationText').innerText = "🔔 आवश्यक सूचना: " + data.notification;

            document.getElementById('dataLoadingMsg').style.color = "#059669"; 
            document.getElementById('dataLoadingMsg').style.background = "#d1fae5";
            document.getElementById('dataLoadingMsg').innerHTML = "<i class='fas fa-check-circle'></i> डिक्टेशन रेडी है!";
            document.getElementById('speedSelect').disabled = false;
            document.getElementById('startTestBtn').disabled = false; 
            document.getElementById('startTestBtn').style.opacity = 1;
            document.getElementById('startTestBtn').style.cursor = 'pointer';
            
            updateTopicName(); 
            let lbSelect = document.getElementById('leaderboardSpeedSelect'); lbSelect.innerHTML = "";
            adminSettingsData.forEach(item => {
                if(!item.isLive) {
                    if(!isPremiumUser && item.category !== 'Demo') return; 
                    lbSelect.innerHTML += `<option value="${item.topic}">[${item.category}] ${item.speed} WPM - ${item.topic}</option>`;
                }
            });

            let hashTab = window.location.hash.substring(1);
            if(['home', 'dashboard', 'test', 'profile', 'leaderboard', 'live', 'demo'].includes(hashTab)) { 
                if(hashTab === 'test') openPremiumTest(false);
                else if(hashTab === 'demo') openDemoTest(false);
                else switchTab(hashTab, false); 
            } else { switchTab('home', false); }
            
        }).catch(e => {
            alert("सर्वर से कनेक्ट होने में समस्या। कृपया रीफ्रेश करें।");
            auth.signOut(); document.getElementById('fullScreenLoader').style.display = 'none'; document.getElementById('authWrapper').style.display = 'flex';
        });
    } else {
        document.getElementById('fullScreenLoader').style.display = 'none';
        document.getElementById('authWrapper').style.display = 'flex';
        document.getElementById('mainNavbar').style.display = 'none';
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    }
});

function processAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const pwd = document.getElementById('authPassword').value.trim();
    const name = document.getElementById('authName') ? document.getElementById('authName').value.trim() : "";
    if(!email || !pwd) return alert("कृपया ईमेल और पासवर्ड डालें!");
    
    if(isSignupMode) {
        if(!name) return alert("नाम डालना ज़रूरी है!");
        auth.createUserWithEmailAndPassword(email, pwd).then((userCred) => {
            userCred.user.updateProfile({ displayName: name });
            return userCred.user.sendEmailVerification(); 
        }).then(() => {
            auth.signOut(); 
            alert("✅ आपका खाता बन गया है! सुरक्षा के लिए आपके ईमेल पर एक वेरिफिकेशन लिंक भेजा गया है। कृपया अपना ईमेल (Inbox या Spam) चेक करें और लिंक पर क्लिक करके खाता वेरिफाई करें।");
            location.reload(); 
        }).catch(e => alert("एरर: " + e.message));
    } else {
        auth.signInWithEmailAndPassword(email, pwd).then((userCred) => {
            let sessionId = Date.now().toString();
            localStorage.setItem("steno_session", sessionId);
            firebase.database().ref('sessions/' + userCred.user.uid).set(sessionId);
        }).catch(e => { alert("❌ लॉगिन फेल: ईमेल/पासवर्ड गलत है या खाता मौजूद नहीं है।"); });
    }
}

function resetPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if(!email) return alert("पासवर्ड रीसेट के लिए पहले अपना ईमेल दर्ज करें।");
    auth.sendPasswordResetEmail(email).then(() => alert("पासवर्ड रीसेट लिंक भेज दिया गया है!")).catch(e => alert(e.message));
}

function checkPendingTest() {
    if(!autoSaveKey) return;
    let savedStateStr = localStorage.getItem(autoSaveKey);
    if(savedStateStr) { document.getElementById('pendingTestBanner').style.display = 'block'; document.getElementById('newTestSetupArea').style.display = 'none'; } 
    else { document.getElementById('pendingTestBanner').style.display = 'none'; document.getElementById('newTestSetupArea').style.display = 'block'; }
}

function openPremiumTest(pushHistory = true) {
    if(!isPremiumUser) { alert("🔒 यह सेक्शन केवल 'VIP' विद्यार्थियों के लिए है! फुल एक्सेस के लिए एडमिशन लें। आप 'Demo Test' और 'Live Exam' फ्री में दे सकते हैं।"); return; }
    document.getElementById('categorySelectionArea').style.display = 'block'; selectCategory('SSC'); switchTab('test', false); 
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active')); document.getElementById('btn-test').classList.add('active');
    if(pushHistory) history.pushState({ tab: 'test' }, '', '#test');
}

function openDemoTest(pushHistory = true) {
    document.getElementById('categorySelectionArea').style.display = 'none'; currentCategory = 'Demo'; updateTopicName(); switchTab('test', false); 
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active')); document.getElementById('btn-demo').classList.add('active');
    if(pushHistory) history.pushState({ tab: 'demo' }, '', '#demo');
}

// ==========================================
// 🔄 TAB SWITCHER (Result Box Fix)
// ==========================================
function switchTab(tabId, pushHistory = true) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    let audioSec = document.getElementById('audioSection'); if(audioSec) audioSec.style.display = 'none'; 
    let readSec = document.getElementById('readingSection'); if(readSec) readSec.style.display = 'none';
    
    let rBox = document.getElementById('resultBox');
    if(rBox) rBox.style.display = 'none';

    let newView = document.getElementById(tabId + 'View'); if(newView) newView.classList.add('active');
    let btn = document.getElementById('btn-' + tabId); if(btn) btn.classList.add('active');

    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'leaderboard') renderLeaderboard();
    if(tabId === 'live') renderLiveTestLogic();
    if(tabId === 'test') {
        document.getElementById('studentDetailsBox').style.display = 'block'; 
        document.getElementById('typingSection').style.display = 'none';
        if(!localStorage.getItem(autoSaveKey)) document.getElementById('studentText').value = '';
        checkPendingTest();
    }
    
    if (pushHistory) { history.pushState({ tab: tabId }, '', '#' + tabId); }
}
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.tab) { 
        if(event.state.tab === 'test') openPremiumTest(false);
        else if(event.state.tab === 'demo') openDemoTest(false);
        else switchTab(event.state.tab, false); 
    } else {
        let hashTab = window.location.hash.substring(1);
        if(['home', 'dashboard', 'test', 'profile', 'leaderboard', 'live', 'demo'].includes(hashTab)){ 
            if(hashTab === 'test') openPremiumTest(false);
            else if(hashTab === 'demo') openDemoTest(false);
            else switchTab(hashTab, false);
        } else { switchTab('home', false); }
    }
});

let adminSettingsData = null, globalHistoryData = null, globalLeaderboardData = null, liveResultsData = null;
let finalMasterText = "", totalDuration = 3600, timeLeft = totalDuration, timerInterval, isTestRunning = false;
let currentTestSpeed = "", currentTestTopic = "", isLiveTestActive = false;
let currentFontSize = 26;

function changeFontSize(change) {
    if(change === 0) currentFontSize = 26; else currentFontSize += change;
    document.getElementById('studentText').style.fontSize = currentFontSize + 'px';
}

function saveTestState() {
    if(!isTestRunning) return;
    let stdArea = document.getElementById('studentText');
    let testState = { speed: currentTestSpeed, topic: currentTestTopic, text: stdArea.value, timeLeft: timeLeft, totalDuration: totalDuration, masterText: finalMasterText, backspace: document.getElementById('backspaceToggle').value, category: currentCategory, isLive: isLiveTestActive };
    localStorage.setItem(autoSaveKey, JSON.stringify(testState));
}

function resumeTest() {
    let savedStateStr = localStorage.getItem(autoSaveKey); if(!savedStateStr) return;
    let savedState = JSON.parse(savedStateStr);
    currentTestSpeed = savedState.speed; currentTestTopic = savedState.topic; finalMasterText = savedState.masterText; totalDuration = savedState.totalDuration; timeLeft = savedState.timeLeft; currentCategory = savedState.category || 'SSC'; isLiveTestActive = savedState.isLive || false;
    document.getElementById('backspaceToggle').value = savedState.backspace || 'on'; document.getElementById('studentText').value = savedState.text;
    document.getElementById('studentDetailsBox').style.display = 'none'; document.getElementById('audioSection').style.display = 'none'; document.getElementById('readingSection').style.display = 'none'; document.getElementById('mainNavbar').style.display = 'none'; document.querySelector('.top-header').style.display = 'none';
    if(isLiveTestActive) { try { var e = document.documentElement; if (e.requestFullscreen) e.requestFullscreen(); } catch(e) {} }
    startTypingTestFromResume(); 
}

function discardPendingTest() {
    if(confirm("क्या आप पक्का यह अधूरा टेस्ट डिलीट करके नया टेस्ट देना चाहते हैं?")) { localStorage.removeItem(autoSaveKey); document.getElementById('studentText').value = ''; checkPendingTest(); }
}

function selectCategory(cat) {
    if (isPremiumUser && cat !== 'Demo') {
        let userAccess = (currentUserData.access || "").toLowerCase();
        if (userAccess !== "all" && !userAccess.includes(cat.toLowerCase())) {
            alert(`🔒 आपके पास '${cat}' पैनल का एक्सेस नहीं है! इसे अनलॉक करने के लिए एडमिन से संपर्क करें।`);
            return; 
        }
    }

    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if(cat==='SSC') document.getElementById('cat-ssc').classList.add('active');
    if(cat==='Court') document.getElementById('cat-court').classList.add('active');
    if(cat==='News') document.getElementById('cat-news').classList.add('active');
    if(cat==='Reporter') document.getElementById('cat-reporter').classList.add('active');

    let speedDropdown = document.getElementById('speedSelect');
    if (cat === 'Reporter') { speedDropdown.innerHTML = `<option value="120">120 WPM</option><option value="140">140 WPM</option><option value="160">160 WPM</option>`; } 
    else { speedDropdown.innerHTML = `<option value="60">60 WPM</option><option value="70">70 WPM</option><option value="80" selected>80 WPM</option><option value="90">90 WPM</option><option value="100">100 WPM</option>`; }

    updateTopicName();
}

function updateTopicName() {
    let speed = document.getElementById('speedSelect').value; let topicBox = document.getElementById('topicSelect');
    let matchingSettings = adminSettingsData ? adminSettingsData.filter(item => item.speed == speed && item.category === currentCategory && !item.isLive) : [];
    topicBox.innerHTML = ""; 
    if(matchingSettings.length > 0) {
        matchingSettings.reverse().forEach(setting => { let displayDate = setting.date ? `[${setting.date}] ` : ""; topicBox.innerHTML += `<option value="${setting.topic}">${displayDate}${setting.topic}</option>`; });
        topicBox.disabled = false;
    } else { topicBox.innerHTML = `<option>इस पैनल में डिक्टेशन नहीं है</option>`; topicBox.disabled = true; }
}

function startAudioSection(isLive) {
    isLiveTestActive = isLive;
    if(isLiveTestActive) {
        try { var e = document.documentElement; if (e.requestFullscreen) e.requestFullscreen(); } catch(e) {}
        let setting = adminSettingsData.find(item => item.isLive);
        if(!setting) return alert("आज का लाइव टेस्ट उपलब्ध नहीं है!");
        currentTestSpeed = setting.speed; currentTestTopic = setting.topic; finalMasterText = setting.text; document.getElementById('dictationAudio').src = setting.audio;
    } else {
        currentTestSpeed = document.getElementById('speedSelect').value; currentTestTopic = document.getElementById('topicSelect').value; 
        let setting = adminSettingsData.find(item => item.speed == currentTestSpeed && item.topic == currentTestTopic && item.category === currentCategory);
        if(!setting) return alert(`तकनीकी त्रुटि!`);
        finalMasterText = setting.text; document.getElementById('dictationAudio').src = setting.audio;
    }
    totalDuration = 60 * 60; timeLeft = totalDuration;
    document.getElementById('mainNavbar').style.display = 'none'; document.querySelector('.top-header').style.display = 'none'; 
    if(!isLiveTestActive) document.getElementById('studentDetailsBox').style.display = 'none'; else document.getElementById('liveView').style.display = 'none';
    document.getElementById('audioSection').style.display = 'flex';
    let audioPlayer = document.getElementById('dictationAudio'); if(audioPlayer) audioPlayer.onended = function() { startReadingTest(); };
}

function exitTest() {
    if(confirm("क्या आप वाकई टेस्ट बीच में छोड़ना चाहते हैं? आपका डेटा डिलीट हो जाएगा।")) {
        isTestRunning = false; clearInterval(timerInterval); localStorage.removeItem(autoSaveKey); document.getElementById('studentText').value = ''; document.getElementById('audioSection').style.display = 'none'; document.getElementById('readingSection').style.display = 'none'; document.getElementById('typingSection').style.display = 'none'; document.querySelector('.top-header').style.display = 'flex'; document.getElementById('mainNavbar').style.display = 'flex'; try { if (document.exitFullscreen) document.exitFullscreen(); } catch(e) {} switchTab('dashboard', true); 
    }
}

function startTypingTestFromResume() {
    document.getElementById('typingSection').style.display = 'block'; isTestRunning = true; let stdArea = document.getElementById('studentText'); stdArea.focus(); updateTimer(); timerInterval = setInterval(updateTimer, 1000);
    stdArea.addEventListener('paste', e => { e.preventDefault(); alert("🚫 पेस्ट करना वर्जित है!"); }); stdArea.addEventListener('input', function() { saveTestState(); }); 
    function lockCursorToEnd() { setTimeout(() => { stdArea.selectionStart = stdArea.selectionEnd = stdArea.value.length; }, 0); } stdArea.addEventListener('click', lockCursorToEnd); stdArea.addEventListener('select', lockCursorToEnd);
    stdArea.addEventListener('keydown', e => { const blockedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']; if (blockedKeys.includes(e.key)) { e.preventDefault(); return; } lockCursorToEnd(); let backspaceSetting = document.getElementById('backspaceToggle').value; if ((e.key === 'Backspace' || e.keyCode === 8) && backspaceSetting === 'off') { e.preventDefault(); } });
}

function updateTimer() { let m = Math.floor(timeLeft / 60); let s = timeLeft % 60; document.getElementById('timerDisplay').innerText = `समय शेष: ${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; saveTestState(); if (timeLeft <= 0) { clearInterval(timerInterval); submitTest(); } timeLeft--; }

function submitTest() {
    isTestRunning = false; clearInterval(timerInterval); localStorage.removeItem(autoSaveKey); 
    try { if (document.exitFullscreen) document.exitFullscreen(); } catch(e) {} document.querySelector('.top-header').style.display = 'flex'; document.getElementById('mainNavbar').style.display = 'flex';
    let tt = totalDuration - timeLeft; document.getElementById('r_timeTaken').innerText = `${Math.floor(tt / 60)} मिनट ${tt % 60} सेकंड`; document.getElementById('typingSection').style.display = 'none';
    let studentText = document.getElementById('studentText').value.trim(); calculateDetailedMistakes(finalMasterText, studentText, tt / 60, currentCategory);
}

function calculateDetailedMistakes(master, student, timeTakenMins, payloadCategory, isJustViewing = false) {
    let mWords = master.split(/\s+/).filter(w => w.length > 0); let sWords = student.split(/\s+/).filter(w => w.length > 0);
    let dp = Array(mWords.length+1).fill(null).map(()=>Array(sWords.length+1).fill(0)); let path = Array(mWords.length+1).fill(null).map(()=>Array(sWords.length+1).fill(0));
    for(let i=1; i<=mWords.length; i++){ dp[i][0] = i; path[i][0] = 2; } for(let j=1; j<=sWords.length; j++){ dp[0][j] = j; path[0][j] = 3; }
    for(let i=1; i<=mWords.length; i++){
        for(let j=1; j<=sWords.length; j++){
            let cost = (mWords[i-1] === sWords[j-1]) ? 0 : (mWords[i-1].replace(/[,\|]/g,'') === sWords[j-1].replace(/[,\|]/g,'') ? 0.5 : 1);
            let diag = dp[i-1][j-1] + cost, del = dp[i-1][j] + 1, ins = dp[i][j-1] + 1;
            if(diag <= del && diag <= ins){ dp[i][j] = diag; path[i][j] = 1; } else if(del <= ins){ dp[i][j] = del; path[i][j] = 2; } else { dp[i][j] = ins; path[i][j] = 3; }
        }
    }
    let om=0, hm=0, fm=0, ew=0; let currI=mWords.length, currJ=sWords.length, diffHtml=[]; 
    while(currI>0 || currJ>0) {
        if(currI>0 && currJ>0 && path[currI][currJ]===1) {
            let w1=mWords[currI-1], w2=sWords[currJ-1];
            if(w1===w2) { diffHtml.unshift(`<span style="color:#10b981;">${w2}</span>`); } 
            else { let cwHtml=` <span style="color:#10b981;font-family:Arial;">(</span><span style="color:#10b981;">${w1}</span><span style="color:#10b981;font-family:Arial;">)</span>`; if(w1.replace(/[,\|]/g,'') === w2.replace(/[,\|]/g,'')){ hm++; diffHtml.unshift(`<span style="color:#f59e0b;">${w2}</span>`+cwHtml); } else { fm++; diffHtml.unshift(`<span style="color:#ef4444;">${w2}</span>`+cwHtml); } }
            currI--; currJ--;
        } else if(currI>0 && (currJ===0 || path[currI][currJ]===2)) { om++; diffHtml.unshift(`<span style="color:#ef4444;text-decoration:line-through;">${mWords[currI-1]}</span>`); currI--;
        } else if(currJ>0 && (currI===0 || path[currI][currJ]===3)) { ew++; diffHtml.unshift(`<span style="color:#ef4444;border-bottom:2px solid #ef4444;">${sWords[currJ-1]}</span>`); currJ--; }
    }
    let tw = mWords.length; let totalErr = fm + ew + om, actualErr = totalErr + (hm/2); let allowed = (sWords.length===0) ? 0 : Math.round(tw * 0.05); let excess = actualErr > allowed ? actualErr - allowed : 0; let net = tw - excess; if(net > sWords.length) net = sWords.length; if(net < 0) net = 0; let acc = (tw>0 && sWords.length>0) ? (net/tw)*100 : 0, wpm = Math.round(net / (timeTakenMins<1 ? 1 : timeTakenMins));

    if(isLiveTestActive && !isJustViewing) {
        saveResultToGoogleSheet(wpm, acc.toFixed(2), actualErr, net, true, payloadCategory, student); liveResultsData.push({ email: currentUserData.email, topic: currentTestTopic, name: currentUserData.name, netWords: net, accuracy: acc.toFixed(2) }); document.getElementById('liveView').style.display = 'block'; document.getElementById('liveStatusBox').innerHTML = `<h3 style='color:#10b981;'><i class='fas fa-check-circle'></i> टेस्ट सफलतापुर्वक जमा हो गया!</h3><p style='font-size:18px; color:#333; font-weight:bold;'>आपका रिजल्ट आज शाम 6:00 बजे इसी पेज पर अनलॉक होगा。</p>`;
    } else {
        document.getElementById('r_omissions').innerText = om; document.getElementById('r_fullMistakes').innerText = fm; document.getElementById('r_halfMistakes').innerText = hm; document.getElementById('r_extraWords').innerText = ew; document.getElementById('r_name').innerText = currentUserData.name; document.getElementById('r_testSpeed').innerText = currentTestSpeed + " WPM"; document.getElementById('r_masterWords').innerText = tw; document.getElementById('r_actualMistakes').innerText = actualErr; document.getElementById('r_allowedMistakes').innerText = allowed; document.getElementById('r_excessMistakes').innerText = excess; document.getElementById('r_netWords').innerText = net; document.getElementById('r_speed').innerText = wpm + " WPM"; document.getElementById('r_accuracy').innerText = acc.toFixed(2) + "%"; document.getElementById('displayEvaluatedText').innerHTML = diffHtml.join(' '); document.getElementById('resultBox').style.display = 'block'; window.scrollTo(0,0); drawResultChart(net, actualErr);
        if(!isJustViewing) { saveResultToGoogleSheet(wpm, acc.toFixed(2), actualErr, net, false, payloadCategory, student); if(acc >= 95) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }}); }
    }
}

let resultChartInstance = null;
function drawResultChart(netWords, mistakes) { let canvas = document.getElementById('resultChart'); if(!canvas) return; let ctx = canvas.getContext('2d'); if(resultChartInstance) resultChartInstance.destroy(); resultChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: ['शुद्ध शब्द', 'कुल गलतियां'], datasets: [{ data: [netWords, mistakes], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 2, borderColor: '#ffffff' }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Segoe UI', size: 14 } } } } } }); }

// ==========================================
// 📄 PDF DOWNLOAD FIX (No Slicing, Perfect A4 Fit)
// ==========================================
window.downloadResultPDF = function() {
    var element = document.getElementById('resultBox');
    
    // 1. PDF बनाते समय बटनों को छुपाएं
    var buttons = element.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');

    // 2. 🚨 जादुई फिक्स 1: चौड़ाई को ज़बरदस्ती A4 पेज के साइज़ में फिट करना
    var oldMaxWidth = element.style.maxWidth;
    var oldWidth = element.style.width;
    var oldMargin = element.style.margin;

    element.style.maxWidth = '760px'; // A4 पन्ने के लिए परफेक्ट चौड़ाई
    element.style.width = '760px';
    element.style.margin = '0 auto';  // स्क्रीन के बीच में लाने के लिए

    // 3. 🚨 जादुई फिक्स 2: स्मार्ट पेज-ब्रेक (ताकि लंबी कॉपी अगले पन्ने पर आ जाए)
    var children = element.children;
    for (var i = 0; i < children.length; i++) {
        if (children[i].id !== 'displayEvaluatedText') {
            children[i].style.pageBreakInside = 'avoid'; // छोटे डिब्बे न कटें
        } else {
            children[i].style.pageBreakInside = 'auto';  // अनुवाद कॉपी को टूटने दें
        }
    }

    // 4. PDF की फाइनल सेटिंग
    var opt = {
        margin:       0.3, // मार्जिन थोड़ा कम किया ताकि जगह मिले
        filename:     'Steno_Result_' + (document.getElementById('r_name').innerText || 'Student') + '.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            windowWidth: 800 // कैमरे को बताया कि 800px मानकर फोटो खींचो
        },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    // 5. PDF जनरेट करें और काम होने के बाद डिब्बे को वापस पहले जैसा कर दें
    html2pdf().set(opt).from(element).save().then(function() {
        element.style.maxWidth = oldMaxWidth;
        element.style.width = oldWidth;
        element.style.margin = oldMargin;
        buttons.forEach(btn => btn.style.display = 'inline-block');
    });
};
function saveResultToGoogleSheet(speedWPM, accuracy, totalMistakes, netWords, isLive, payloadCategory, studentText) { let payload = { name: currentUserData.name, rollNumber: currentUserData.roll, email: currentUserData.email, speedTarget: currentTestSpeed, topic: currentTestTopic, actualSpeedWPM: speedWPM, accuracy: accuracy, totalMistakes: totalMistakes, netWords: netWords, isLive: isLive, category: payloadCategory, studentText: studentText }; fetch(GOOGLE_SHEET_WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) }).then(res => { if(!isLive) document.getElementById('saveStatus').innerText = "✅ रिज़ल्ट सेव हो गया!"; }); }

function viewLiveCopy(topicName) { let myLiveResult = liveResultsData.find(res => res.email === currentUserData.email && res.topic === topicName); let setting = adminSettingsData.find(item => item.topic === topicName && item.isLive); if(myLiveResult && setting) { isLiveTestActive = false; currentTestSpeed = myLiveResult.speed; document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active')); document.getElementById('testView').classList.add('active'); document.getElementById('studentDetailsBox').style.display = 'none'; document.getElementById('typingSection').style.display = 'none'; calculateDetailedMistakes(setting.text, myLiveResult.studentText || "", 60, myLiveResult.category, true); } else { alert("डेटा लोड नहीं हुआ!"); } }

function renderLiveTestLogic() {
    let now = getRealTime(); let day = now.getDay(); let hour = now.getHours(); let statusBox = document.getElementById('liveStatusBox');
    if (day === 0 && hour >= 10 && hour < 18) { let liveData = adminSettingsData ? adminSettingsData.find(i => i.isLive) : null; if(liveData) { let alreadySubmitted = liveResultsData.some(res => res.email === currentUserData.email && res.topic === liveData.topic); if (alreadySubmitted) { statusBox.innerHTML = `<div style="padding: 20px; background: #ecfdf5; border-radius: 12px; border: 2px dashed #6ee7b7;"><i class="fas fa-check-circle" style="font-size: 50px; color: #10b981; margin-bottom: 15px;"></i><h3 style="color:#059669; margin-top:0;">आप यह लाइव टेस्ट दे चुके हैं!</h3><p style="font-weight:bold; font-size:16px; color:#1f2937;">स्पीड: ${liveData.speed} WPM | टॉपिक: ${liveData.topic}</p><p style="color:#047857; font-size:15px; font-weight:bold;">आपका रिज़ल्ट सुरक्षित जमा हो गया है। कृपया शाम 6:00 बजे का इंतज़ार करें।</p></div>`; } else { statusBox.innerHTML = `<h3 style="color:#b45309;">आज का लाइव टेस्ट शुरू हो चुका है!</h3><p style="font-weight:bold; font-size:18px;">स्पीड: ${liveData.speed} WPM | टॉपिक: ${liveData.topic}</p><p style="color:#ef4444; font-size:14px;"><i class="fas fa-exclamation-triangle"></i> टेस्ट फुल स्क्रीन में होगा।</p><button class="btn" style="background:#ef4444; font-size:20px; padding:15px 30px;" onclick="startAudioSection(true)"><i class="fas fa-play-circle"></i> टेस्ट में प्रवेश करें</button>`; } } else { statusBox.innerHTML = `<h3 style="color:#ef4444;">आज कोई लाइव टेस्ट निर्धारित नहीं है।</h3>`; } } 
    else if (day === 0 && hour >= 18) {
        let tableRows = ""; let myTopic = ""; let liveSetting = adminSettingsData.find(i => i.isLive); let currentLiveTopic = liveSetting ? liveSetting.topic : "Live Exam";
        if(liveResultsData && liveResultsData.length > 0) {
            let currentResults = liveResultsData.filter(r => r.topic === currentLiveTopic); currentResults.sort((a,b) => b.accuracy - a.accuracy); 
            currentResults.forEach((res, idx) => { let rank = idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":(idx+1); tableRows += `<tr><td><b>${rank}</b></td><td>${res.name}</td><td>${res.netWords}</td><td style="color:#10b981; font-weight:bold;">${res.accuracy}%</td></tr>`; if(res.email === currentUserData.email) myTopic = res.topic; });
        } else { tableRows = `<tr><td colspan="4" style="text-align:center;">अभी तक कोई रिज़ल्ट घोषित नहीं हुआ है।</td></tr>`; }
        let viewCopyBtn = ""; if(myTopic !== "") { viewCopyBtn = `<button class="btn btn-info" style="width:auto;" onclick="viewLiveCopy('${myTopic}')"><i class="fas fa-search"></i> अपनी कॉपी देखें</button>`; }
        let pdfDownloadBtn = `<button class="btn" style="width:auto; background:#f97316;" onclick="downloadLiveResultPDF('${currentLiveTopic}')"><i class="fas fa-file-pdf"></i> पूरी लिस्ट PDF</button>`;
        statusBox.innerHTML = `<h3 style="color:#10b981;"><i class="fas fa-check-double"></i> लाइव टेस्ट रिज़ल्ट घोषित!</h3><table class="data-table" style="text-align:left;"><thead style="background:#4f46e5;"><tr><th>Rank</th><th>Name</th><th>Net Words</th><th>Accuracy</th></tr></thead><tbody>${tableRows}</tbody></table><div style="text-align:center; margin-top:20px; display:flex; justify-content:center; flex-wrap:wrap; gap:10px;">${viewCopyBtn}${pdfDownloadBtn}</div>`;
    } else { statusBox.innerHTML = `<i class="fas fa-clock" style="font-size:50px; color:#64748b; margin-bottom:15px;"></i><h3 style="color:#1e293b;">लाइव टेस्ट अभी बंद है।</h3><p style="font-size:16px; color:#64748b; font-weight:bold;">यह टेस्ट केवल <b>रविवार सुबह 10:00 बजे से शाम 6:00 बजे</b> तक उपलब्ध होता है।</p>`; }
}

function renderLeaderboard() {
    let selectedTopic = document.getElementById('leaderboardSpeedSelect').value; let filteredData = globalLeaderboardData.filter(item => item.topic === selectedTopic); filteredData.sort((a, b) => b.accuracy - a.accuracy); let tableHtml = "";
    filteredData.forEach((st, idx) => { let r = idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":(idx+1); let display_name = st.name; if (!isPremiumUser && st.email !== currentUserData.email) { display_name = st.name.substring(0, 2) + "****"; } tableHtml += `<tr><td><b>${r}</b></td><td>${display_name}</td><td>${st.netWords}</td><td style="color: #10b981; font-weight: 800;">${parseFloat(st.accuracy).toFixed(2)}%</td></tr>`; });
    if(filteredData.length === 0) tableHtml = `<tr><td colspan='4' style='text-align:center;'>कोई डेटा नहीं।</td></tr>`; document.getElementById('leaderboardData').innerHTML = tableHtml;
}

function renderDashboard() {
    let myHistory = globalHistoryData.filter(item => item.email === currentUserData.email && item.type !== "LIVE"); let chartData = [...myHistory]; let labels = chartData.map(a => new Date(a.date).toLocaleDateString('en-IN').substring(0,5)); let accData = chartData.map(a => parseFloat(a.accuracy));
    let ctx = document.getElementById('progressLineChart').getContext('2d'); if(window.dashboardLineChart) window.dashboardLineChart.destroy(); window.dashboardLineChart = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Accuracy', data: accData, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 3, fill: true, tension: 0.3 }] }, options: { responsive: true, scales: { y: { min: 50, max: 100 } } } });
    myHistory.reverse(); let tHtml = ""; myHistory.forEach((a) => { let dStr = new Date(a.date).toLocaleDateString('en-IN'); tHtml += `<tr><td>${dStr}</td><td>${a.category || 'SSC'}</td><td>${a.speed} WPM</td><td style="font-weight:bold;">${a.netWords}</td><td style="color:#10b981; font-weight:bold;">${parseFloat(a.accuracy).toFixed(2)}%</td><td style="color:#ef4444; font-weight:bold;">${a.mistakes}</td></tr>`; });
    document.getElementById('dashboardData').innerHTML = tHtml || "<tr><td colspan='6' style='text-align:center;'>डेटा नहीं मिला</td></tr>";
  }
function downloadLiveResultPDF(topicName) {
    if (!liveResultsData || liveResultsData.length === 0) { alert("अभी कोई रिजल्ट डेटा उपलब्ध नहीं है!"); return; }
    let filteredResults = liveResultsData.filter(res => res.topic === topicName); filteredResults.sort((a,b) => b.accuracy - a.accuracy); let setting = adminSettingsData.find(item => item.topic === topicName && item.isLive); let totalMasterWords = setting ? setting.text.split(/\s+/).filter(w => w.length > 0).length : 0; let tableRows = "";
    filteredResults.forEach((res, idx) => {
        let typedWords = res.studentText ? res.studentText.split(/\s+/).filter(w => w.length > 0).length : 0; let display_name = res.name; if(!isPremiumUser && res.email !== currentUserData.email) { display_name = res.name.substring(0, 2) + "****"; }
        tableRows += `<tr><td style="padding:10px; border:1px solid #cbd5e1; text-align:center; font-weight:bold;">${idx+1}</td><td style="padding:10px; border:1px solid #cbd5e1; font-weight:bold;">${display_name}</td><td style="padding:10px; border:1px solid #cbd5e1; text-align:center; color:#e11d48; font-weight:bold;">${res.roll || 'N/A'}</td><td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${totalMasterWords}</td><td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${typedWords}</td><td style="padding:10px; border:1px solid #cbd5e1; text-align:center; color:#ef4444; font-weight:bold;">${res.mistakes}</td><td style="padding:10px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:900;">${res.accuracy}%</td></tr>`;
    });
    let printDiv = document.createElement('div'); printDiv.innerHTML = `<div style="padding: 30px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: white;"><div style="text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px;"><h1 style="color: #312e81; margin: 0; font-size: 28px;">हिंदी स्टेनो लैब</h1><h2 style="color: #ef4444; margin: 5px 0 0 0; font-size: 20px;">LIVE SUNDAY EXAM - RESULT</h2><p style="color: #64748b; font-weight: bold; margin: 5px 0 0 0;">Topic: ${topicName}</p></div><table style="width: 100%; border-collapse: collapse; font-size: 15px;"><thead style="background: #4f46e5; color: white;"><tr><th style="padding:12px; border:1px solid #312e81;">Rank</th><th style="padding:12px; border:1px solid #312e81; text-align:left;">Student Name</th><th style="padding:12px; border:1px solid #312e81;">Roll No.</th><th style="padding:12px; border:1px solid #312e81;">Total Words</th><th style="padding:12px; border:1px solid #312e81;">Typed Words</th><th style="padding:12px; border:1px solid #312e81;">Errors</th><th style="padding:12px; border:1px solid #312e81;">Accuracy</th></tr></thead><tbody>${tableRows}</tbody></table><p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">Generated automatically by Hindi Steno Lab Portal</p></div>`;
    document.body.appendChild(printDiv);
    let opt = { margin: [10, 10, 10, 10], filename: 'Steno_Live_Result_' + topicName.replace(/\s+/g, '_') + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(printDiv).save().then(() => { document.body.removeChild(printDiv); });
}

// ==========================================
// 🚀 AUDIO -> READING -> TYPING ENGINE
// ==========================================

window.skipAudio = function() {
    var audio = document.getElementById('dictationAudio');
    if(audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    document.getElementById('audioSection').style.display = 'none';
    document.getElementById('testView').style.display = 'block';
    document.getElementById('studentDetailsBox').style.display = 'none'; 
    document.getElementById('readingSection').style.display = 'flex';

    var readTime = 300; 
    var readDisplay = document.getElementById('readingTimerDisplay');
    if(window.readTimer) clearInterval(window.readTimer);

    window.readTimer = setInterval(function() {
        var m = Math.floor(readTime / 60);
        var s = readTime % 60;
        if(readDisplay) readDisplay.innerText = (m < 10 ? '0'+m : m) + ":" + (s < 10 ? '0'+s : s);
        
        if(readTime <= 0) skipReading();
        readTime--;
    }, 1000);
};

window.skipReading = function() {
    if (window.readTimer) clearInterval(window.readTimer);

    document.getElementById('readingSection').style.display = 'none';
    var setupBox = document.getElementById('studentDetailsBox');
    if (setupBox) setupBox.style.display = 'none';

    document.getElementById('testView').style.display = 'block';
    document.getElementById('typingSection').style.display = 'block';

    window.typeTime = 3600; 
    var display = document.getElementById('timerDisplay');
    if (window.typeTimer) clearInterval(window.typeTimer);

    // 🚨 टेस्ट शुरू करने के लिए सुरक्षा नियम लागू करना ज़रूरी है!
    startTypingTestFromResume();

    window.typeTimer = setInterval(function() {
        var m = Math.floor(window.typeTime / 60);
        var s = window.typeTime % 60;
        if (display) display.innerText = "समय शेष: " + (m < 10 ? '0' + m : m) + ":" + (s < 10 ? '0' + s : s);
        
        if (window.typeTime <= 0) {
            clearInterval(window.typeTimer);
            if (typeof submitTest === "function") submitTest();
        }
        window.typeTime--; 
    }, 1000);
};

setTimeout(function() {
    var audioEl = document.getElementById('dictationAudio');
    if(audioEl) {
        audioEl.onended = function() { skipAudio(); };
    }
}, 1000);

// ==========================================
// 🚫 STRICT CURSOR LOCK (BACKSPACE CONTROLLER)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    var studentTextArea = document.getElementById('studentText');
    var backspaceToggle = document.getElementById('backspaceToggle');

    if (studentTextArea && backspaceToggle) {
        
        function forceCursorToEnd() {
            if (backspaceToggle.value === 'off') {
                var len = studentTextArea.value.length;
                studentTextArea.setSelectionRange(len, len);
            }
        }

        studentTextArea.addEventListener('mousedown', function() {
            if (backspaceToggle.value === 'off') {
                setTimeout(forceCursorToEnd, 10); 
            }
        });
        studentTextArea.addEventListener('click', forceCursorToEnd);

        studentTextArea.addEventListener('keydown', function(e) {
            if (backspaceToggle.value === 'off') {
                var blockedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
                
                if (blockedKeys.includes(e.key)) {
                    e.preventDefault(); 
                } 
                else {
                    forceCursorToEnd();
                }
            }
        });
    }
});

// ==========================================
// ⏱️ TIME FIXER PATCH
// ==========================================
var oldSubmit = window.submitTest; 

window.submitTest = function() {
    if (typeof oldSubmit === 'function') {
        oldSubmit(); 
    }
    
    if (window.typeTime !== undefined) {
        var totalSecondsTaken = 3600 - window.typeTime; 
        var finalM = Math.floor(totalSecondsTaken / 60);
        var finalS = totalSecondsTaken % 60;
        
        var timeText = finalM + " मिनट " + finalS + " सेकंड";
        var timeSpan = document.getElementById('r_timeTaken');
        if (timeSpan) {
            timeSpan.innerText = timeText;
        }
    }
};
