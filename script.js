/**
 * Gossip & Rumors Platform - Bundled Script
 * (Bundled for file:// protocol compatibility without a local server)
 */

// ==========================================
// 1. ICONS AND UTILS
// ==========================================
// Lucide icons are loaded globally via script tag in HTML

// ==========================================
// 2. DATA STORE
// ==========================================

const INITIAL_RUMORS = [
    {
        id: 'r1',
        content: 'The new coffee shop on Main St. gives free pastries if you say "Antigravity".',
        authorId: 'u2',
        trueVotes: 12,
        falseVotes: 3,
        status: 'active',
        voters: {}
    },
    {
        id: 'r2',
        content: 'They are planning to replace the local park with a parking lot next month!',
        authorId: 'u3',
        trueVotes: 5,
        falseVotes: 45,
        status: 'debunked',
        voters: {}
    }
];

const INITIAL_USERS = [
    { id: 'u1', name: 'skibidi', points: 120, vouchers: [] },
    { id: 'u2', name: 'SecretSource', points: 350, vouchers: ['Free Coffee'] },
    { id: 'u3', name: 'TruthSeeker', points: 50, vouchers: [] }
];

const FAKE_GOSSIPS = [
    "My GPA is lower than my will to live right now. 📉💀",
    "Saw the campus power couple fighting near the library. Breakup season? 💔👀",
    "Pretty sure the hostel warden is running a fight club in the basement. 👊",
    "My sleep schedule is so messed up I just wished the watchman 'Good Morning' at 3 AM. 🧛‍♂️",
    "Heard someone is dating three people from the same friend group. Hazardous. ☢️💘",
    "Only thing verified about me is my attendance shortage. 🚫🏫",
    "If I fail one more exam I'm selling my kidney. Bidding starts at $50. 🏥💸",
    "Saw someone crying in the bathroom. Wait, that was me in the mirror. 🤡",
    "Rumor has it the 'mysterious meat' in the mess today was actually pigeons. 🐦🍖",
    "Confessed to my crush and she asked if it was a dare. Deleting myself. 🚮💔"
];

class Store {
    constructor() {
        this.state = this.loadState();
        this.listeners = [];
        this.currentUser = this.state.users[0];

        // Start Auto-Generator
        this.startAutoGenerator();
    }

    startAutoGenerator() {
        // Add a new rumor every 30 seconds for faster demo effect
        setInterval(() => {
            const randomGossip = FAKE_GOSSIPS[Math.floor(Math.random() * FAKE_GOSSIPS.length)];
            // Randomly assign to a user (excluding current user to make it realistic)
            const randomUser = this.state.users[Math.floor(Math.random() * this.state.users.length)];

            this.addRumor(randomGossip, randomUser.id);
            console.log("Auto-generated rumor:", randomGossip);
        }, 3000); // 3 seconds for "Hyper Speed" feel
    }

    loadState() {
        try {
            const stored = localStorage.getItem('gossip_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migration: Rename u1 if it's still GossipKing
                const u1 = parsed.users.find(u => u.id === 'u1');
                if (u1 && u1.name === 'GossipKing') {
                    u1.name = 'skibidi';
                }
                return parsed;
            }
        } catch (e) {
            console.error("Local Storage Error", e);
        }

        return {
            users: INITIAL_USERS,
            rumors: INITIAL_RUMORS
        };
    }

    saveState() {
        try {
            localStorage.setItem('gossip_state', JSON.stringify(this.state));
        } catch (e) {
            console.error("Save Error", e);
        }
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    getCurrentUser() {
        return this.currentUser;
    }

    switchUser() {
        const currentIndex = this.state.users.findIndex(u => u.id === this.currentUser.id);
        const nextIndex = (currentIndex + 1) % this.state.users.length;
        this.currentUser = this.state.users[nextIndex];
        this.notify();
        window.location.reload(); // Simple refresh to update all views
    }

    addRumor(content, authorId = null) {
        const targetAuthorId = authorId || this.currentUser.id;
        const newRumor = {
            id: 'r' + Date.now() + Math.random(), // Ensure unique ID
            content,
            authorId: targetAuthorId,
            trueVotes: 0,
            falseVotes: 0,
            status: 'active',
            voters: {}
        };
        this.state.rumors.unshift(newRumor);

        // Reward author for posting
        const author = this.state.users.find(u => u.id === targetAuthorId);
        if (author) {
            author.points += 5;
        }

        this.saveState();
        this.notify(); // Ensure UI updates
    }

    voteRumor(rumorId, voteType) {
        const rumor = this.state.rumors.find(r => r.id === rumorId);
        if (!rumor || rumor.status !== 'active') return;

        const userId = this.currentUser.id;
        const previousVote = rumor.voters[userId];

        if (previousVote === voteType) return;

        if (previousVote === 'true') rumor.trueVotes--;
        if (previousVote === 'false') rumor.falseVotes--;

        if (voteType === 'true') rumor.trueVotes++;
        if (voteType === 'false') rumor.falseVotes++;

        rumor.voters[userId] = voteType;

        this.checkRumorStatus(rumor);
        this.saveState();
    }

    checkRumorStatus(rumor) {
        if (rumor.status !== 'active') return;

        const totalVotes = rumor.trueVotes + rumor.falseVotes;
        if (totalVotes < 5) return;

        if (rumor.trueVotes / totalVotes >= 0.7) {
            rumor.status = 'verified';
            this.rewardAuthor(rumor.authorId, 50); // Bonus for truth
        } else if (rumor.falseVotes / totalVotes >= 0.7) {
            rumor.status = 'debunked';
            this.rewardAuthor(rumor.authorId, -20); // Penalty for lying (reverses the +5 post reward + 15 fine)
        }
    }

    rewardAuthor(authorId, amount) {
        const author = this.state.users.find(u => u.id === authorId);
        if (author) {
            author.points += amount;
        }
    }

    deleteRumor(rumorId) {
        this.state.rumors = this.state.rumors.filter(r => r.id !== rumorId);
        this.saveState();
        this.notify();
    }

    redeemVoucher(cost, name) {
        if (this.currentUser.points >= cost) {
            this.currentUser.points -= cost;
            this.currentUser.vouchers.push(name);
            // Sync with state array
            const userIdx = this.state.users.findIndex(u => u.id === this.currentUser.id);
            this.state.users[userIdx] = { ...this.currentUser };
            this.saveState();
            return true;
        }
        return false;
    }
}

// Initialize Global Store
const appStore = new Store();

// Subscribe to store updates to auto-refresh UI
appStore.subscribe(() => {
    // Only refresh if we are on the page (simple check)
    refreshView();
});


// ==========================================
// 3. VIEWS
// ==========================================

// --- Navbar View ---
function renderNavbar() {
    const navbar = document.getElementById('navbar');
    const user = appStore.getCurrentUser();
    const currentHash = window.location.hash.slice(1) || 'home';

    navbar.innerHTML = `
        <div class="nav-links">
            <a href="#" onclick="window.location.reload(); return false;" class="nav-logo">Paradooshanam</a>
            <a href="#home" class="nav-item ${currentHash === 'home' ? 'active' : ''}">
                <i data-lucide="home"></i> Feed
            </a>
            <a href="#add" class="nav-item ${currentHash === 'add' ? 'active' : ''}">
                <i data-lucide="plus-circle"></i> Add Rumor
            </a>
            <a href="#redeem" class="nav-item ${currentHash === 'redeem' ? 'active' : ''}">
                <i data-lucide="shopping-bag"></i> Redeem
            </a>
        </div>
        
        <div class="nav-links">
            <div class="user-pill" id="user-switch-btn" title="Click to switch user">
                ${user.name} • ${user.points} pts
            </div>
            <a href="#profile" class="nav-item ${currentHash === 'profile' ? 'active' : ''}">
                <i data-lucide="user"></i>
            </a>
        </div>
    `;

    document.getElementById('user-switch-btn').addEventListener('click', () => {
        appStore.switchUser();
    });
}

// --- Home View ---
function renderHome() {
    const container = document.createElement('div');
    container.className = 'layout-grid'; // Removed fade-in

    // Main Feed Column
    const feedColumn = document.createElement('div');

    feedColumn.innerHTML = `
        <h1 style="margin-bottom: 2rem; font-size: 2.5rem; font-weight: 700;">Latest Rumors</h1>
    `;

    const rumorsList = document.createElement('div');
    const rumors = appStore.state.rumors;
    const currentUser = appStore.getCurrentUser();

    if (rumors.length === 0) {
        rumorsList.innerHTML = `<p style="color: var(--text-muted); text-align: center;">No rumors yet.</p>`;
    } else {
        rumors.forEach(rumor => {
            const card = document.createElement('div');
            card.className = 'glass-panel rumor-card';

            const userVote = rumor.voters[currentUser.id];

            card.innerHTML = `
                <div class="rumor-header">
                    <span class="rumor-author">@${appStore.state.users.find(u => u.id === rumor.authorId)?.name || 'Anonymous'}</span>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${rumor.authorId === currentUser.id ?
                    `<button class="delete-btn" data-id="${rumor.id}" title="Delete your rumor" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px;">
                                <i data-lucide="trash-2" size="16"></i>
                            </button>` : ''
                }
                        <span class="rumor-status status-${rumor.status}">${rumor.status}</span>
                    </div>
                </div>
                <div class="rumor-content">${rumor.content}</div>
                <div class="rumor-actions">
                    <button class="reaction-btn ${userVote === 'true' ? 'voted-true' : ''}" data-id="${rumor.id}" data-type="true">
                        <i data-lucide="check"></i> True (${rumor.trueVotes})
                    </button>
                    <button class="reaction-btn ${userVote === 'false' ? 'voted-false' : ''}" data-id="${rumor.id}" data-type="false">
                        <i data-lucide="x"></i> False (${rumor.falseVotes})
                    </button>
                </div>
            `;

            // Delete Listener
            if (rumor.authorId === currentUser.id) {
                const deleteBtn = card.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this rumor?')) {
                            appStore.deleteRumor(rumor.id);
                            refreshView();
                        }
                    };
                }
            }

            // Vote Listeners
            card.querySelector('[data-type="true"]').onclick = () => {
                appStore.voteRumor(rumor.id, 'true');
                refreshView();
            };
            card.querySelector('[data-type="false"]').onclick = () => {
                appStore.voteRumor(rumor.id, 'false');
                refreshView();
            };

            rumorsList.appendChild(card);
        });
    }

    feedColumn.appendChild(rumorsList);
    container.appendChild(feedColumn);

    // Sidebar Column (Ads) with Rotation Logic
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'ad-sidebar';

    // Ad Data
    const ADS = [
        { img: 'ad1.png', title: 'Astro Fizz 🥤', text: 'Taste the universe! Zero gravity bubbles guaranteed.' },
        { img: 'ad2.png', title: 'Visit Mars 🚀', text: 'Book your passage to Olympus Mons today.' },
        { img: 'ad3.png', title: 'Robo-Pup 🐶', text: 'The perfect metallic companion. Never needs a walk!' },
        { img: 'ad4.png', title: 'SkyGlide 🛹', text: 'The fastest hoverboard in the galaxy. Pre-order now.' }
    ];

    // Function to render random ads
    const renderAds = () => {
        // Pick 2 random unique ads
        const shuffled = [...ADS].sort(() => 0.5 - Math.random());
        const selectedAds = shuffled.slice(0, 2);

        sidebar.innerHTML = selectedAds.map(ad => `
            <div class="glass-panel ad-card fade-in">
                <span class="ad-label">Ad</span>
                <img src="${ad.img}" alt="${ad.title}">
                <div style="padding: 1rem;">
                    <h4 style="margin-bottom:0.5rem">${ad.title}</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted)">${ad.text}</p>
                </div>
            </div>
        `).join('');
    };

    // Initial Render
    renderAds();

    // Rotate every 5 minutes (300,000 ms)
    // Note: We use a global check or clear previous intervals if strict SPA, 
    // but for this simple app, setting it here works as long as we don't have memory leaks on re-renders.
    // To be safe, we assign it to a window property to clear it.
    if (window.adInterval) clearInterval(window.adInterval);
    window.adInterval = setInterval(renderAds, 15000);

    container.appendChild(sidebar);

    return container;
}

// --- Add Rumor View ---
function renderAddRumor() {
    const container = document.createElement('div');
    container.className = 'glass-panel fade-in';
    container.style.padding = '2rem';
    container.style.maxWidth = '600px';
    container.style.margin = '0 auto';

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Spill the Tea ☕</h2>
        <form id="add-rumor-form">
            <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">What's the gossip?</label>
                <textarea rows="5" placeholder="Typing..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Post Rumor</button>
        </form>
    `;

    setTimeout(() => {
        const form = document.getElementById('add-rumor-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const content = form.querySelector('textarea').value;
                if (content.trim()) {
                    appStore.addRumor(content);
                    window.location.hash = 'home';
                }
            });
        }
    }, 0);

    return container;
}

// --- Profile View ---
function renderProfile() {
    const user = appStore.getCurrentUser();
    const container = document.createElement('div');
    container.className = 'fade-in';

    const myRumors = appStore.state.rumors.filter(r => r.authorId === user.id);

    container.innerHTML = `
        <div class="glass-panel" style="padding: 2rem; text-align: center; margin-bottom: 2rem;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700;">
                ${user.name[0]}
            </div>
            <h2>${user.name}</h2>
            <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem;">
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #c084fc;">${user.points}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Points</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #f472b6;">${myRumors.length}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Rumors</div>
                </div>
            </div>
        </div>

        <h3 style="margin-bottom: 1rem;">My Voucher Wallet 💼</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            ${user.vouchers.length ? user.vouchers.map(v => `
                <div class="glass-panel" style="padding: 1.5rem; position: relative; overflow: hidden; border: 1px solid var(--primary); background: rgba(139, 92, 246, 0.1);">
                    <div style="position: absolute; -top: 10px; right: -10px; background: var(--success); color: black; font-size: 0.7rem; font-weight: 800; padding: 20px 20px 5px 20px; transform: rotate(45deg);">OWNED</div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <div style="background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 8px;">
                            <i data-lucide="ticket" style="color: var(--primary);"></i>
                        </div>
                        <h4 style="margin: 0;">${v}</h4>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Ready to use code: <b>${Math.random().toString(36).substring(7).toUpperCase()}</b></p>
                </div>
            `).join('') : '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: 12px;">No vouchers yet. Visit the Redeem store to spend your points!</div>'}
        </div>

        <h3 style="margin-bottom: 1rem;">My Rumors</h3>
        <div>
            ${myRumors.map(r => `
                <div class="glass-panel" style="padding: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1; margin-right: 1rem;">${r.content}</div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="rumor-status status-${r.status}">${r.status}</span>
                        <button class="delete-btn-profile" data-id="${r.id}" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); border-radius: 6px; padding: 4px; cursor: pointer;">
                            <i data-lucide="trash-2" size="16"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    setTimeout(() => {
        container.querySelectorAll('.delete-btn-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this rumor?')) {
                    appStore.deleteRumor(btn.dataset.id);
                    refreshView();
                }
            });
        });
    }, 0);

    return container;
}

// --- Redeem View ---
function renderRedeem() {
    const user = appStore.getCurrentUser();
    const container = document.createElement('div');
    container.className = 'fade-in';

    const REWARDS = [
        { id: 5, name: 'Mystery Box 🎁', cost: 50, icon: 'box' },
        { id: 1, name: 'Free Coffee @ Starbeans', cost: 100, icon: 'coffee' },
        { id: 6, name: 'Skip Homework Pass', cost: 150, icon: 'file-text' },
        { id: 2, name: '50% Off Cinema Ticket', cost: 250, icon: 'film' },
        { id: 7, name: 'Front of Line Pass', cost: 300, icon: 'fast-forward' },
        { id: 3, name: '$10 Amazon Gift Card', cost: 500, icon: 'gift' },
        { id: 4, name: 'VIP Status (1 Week)', cost: 1000, icon: 'crown' },
        { id: 8, name: '$50 Steam Gift Card', cost: 2000, icon: 'gamepad-2' },
        { id: 9, name: 'Lunch with Principal 🥗', cost: 5000, icon: 'user-check' }
    ];

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1>Rewards Store</h1>
            <div class="glass-panel" style="padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border-color: var(--success); color: var(--success); font-weight: 700;">
                <i data-lucide="coins" style="vertical-align: middle; margin-right: 0.5rem;"></i>
                ${user.points} Points Available
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
            ${REWARDS.map(reward => `
                <div class="glass-panel rumor-card" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="${reward.icon}" size="32"></i>
                    </div>
                    <h3 style="margin-bottom: 0.5rem;">${reward.name}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${reward.cost} Points</p>
                    <button class="btn btn-primary redeem-btn" 
                        data-cost="${reward.cost}" 
                        data-name="${reward.name}"
                        style="width: 100%;"
                        ${user.points < reward.cost ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        Claim Reward
                    </button>
                </div>
            `).join('')}
        </div>
    `;

    setTimeout(() => {
        container.querySelectorAll('.redeem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cost = parseInt(e.target.dataset.cost);
                const name = e.target.dataset.name;

                if (appStore.redeemVoucher(cost, name)) {
                    alert(`Successfully claimed: ${name}!`);
                    refreshView();
                } else {
                    alert('Not enough points!');
                }
            });
        });
    }, 0);

    return container;
}


// ==========================================
// 4. ROUTER & APP INIT
// ==========================================

const routes = {
    '': renderHome,
    'home': renderHome,
    'add': renderAddRumor,
    'profile': renderProfile,
    'redeem': renderRedeem
};

// Simple visual diffing to prevent flicker
function refreshView() {
    const hash = window.location.hash.slice(1) || 'home';
    const main = document.getElementById('main-content');

    // If we are strictly navigating to a NEW view, full render
    // Or if it's the first load
    if (main.dataset.currentHash !== hash) {
        const renderFn = routes[hash] || renderHome;
        main.innerHTML = '';
        main.appendChild(renderFn());
        main.dataset.currentHash = hash;
    } else if (hash === 'home' || hash === '') {
        // We are staying on Home, so just update the Feed list (Smart Update)
        // This prevents the whole page (navbar, sidebar) from blinking
        const feedContainer = document.querySelector('.layout-grid > div:first-child > div:last-child'); // Target rumor list
        if (feedContainer) {
            // Re-render just the rumors logic
            const rumors = appStore.state.rumors;
            const currentUser = appStore.getCurrentUser();

            // For simplicity in this vanilla setup, we will replace the inner HTML of the list container only
            // This is much less jarring than replacing the whole page
            // Ideally we would diff individual cards, but this stops layout shift.

            feedContainer.innerHTML = rumors.map(rumor => {
                const userVote = rumor.voters[currentUser.id];
                const author = appStore.state.users.find(u => u.id === rumor.authorId);
                const authorName = author ? author.name : 'Anonymous';
                const isAuthor = rumor.authorId === currentUser.id;

                return `
                <div class="glass-panel rumor-card fade-in">
                    <div class="rumor-header">
                        <span class="rumor-author">@${authorName}</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            ${isAuthor ?
                        `<button class="delete-btn" data-id="${rumor.id}" title="Delete your rumor" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px;">
                                    <i data-lucide="trash-2" size="16"></i>
                                </button>` : ''
                    }
                            <span class="rumor-status status-${rumor.status}">${rumor.status}</span>
                        </div>
                    </div>
                    <div class="rumor-content">${rumor.content}</div>
                    <div class="rumor-actions">
                        <button class="reaction-btn ${userVote === 'true' ? 'voted-true' : ''}" onclick="appStore.voteRumor('${rumor.id}', 'true')" data-type="true">
                            <i data-lucide="check"></i> True (${rumor.trueVotes})
                        </button>
                        <button class="reaction-btn ${userVote === 'false' ? 'voted-false' : ''}" onclick="appStore.voteRumor('${rumor.id}', 'false')" data-type="false">
                            <i data-lucide="x"></i> False (${rumor.falseVotes})
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            // Re-attach listeners for delete buttons (inline onlicks handle votes now to save complexity)
            feedContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this rumor?')) {
                        appStore.deleteRumor(btn.dataset.id);
                    }
                };
            });
        } else {
            // Fallback if structure missing
            const renderFn = routes[hash] || renderHome;
            main.innerHTML = '';
            main.appendChild(renderFn());
        }
    } else {
        // specific view update for non-home pages (Profile/Redeem) - Full render is fine here as they update less often automatically
        const renderFn = routes[hash] || renderHome;
        main.innerHTML = '';
        main.appendChild(renderFn());
    }

    // Render Navbar (Always update points)
    renderNavbar();

    // Icons
    if (window.lucide) window.lucide.createIcons();
}

window.addEventListener('hashchange', () => {
    // Force full re-render on navigation
    document.getElementById('main-content').innerHTML = '';
    document.getElementById('main-content').dataset.currentHash = '';
    refreshView();
});
document.addEventListener('DOMContentLoaded', () => {
    refreshView();
});
