const API_BASE = "http://127.0.0.1:5000";
let joinMode = false; // true when user joins an existing trip (skip role step)

/* ---------- PAGE NAVIGATION ---------- */
function go(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function startCreateFlow() {
  joinMode = false;
  document.getElementById("userNameInput").value = "";
  document.getElementById("nameError").style.display = "none";
  // Clear any stale group state when starting fresh solo flow
  localStorage.removeItem("currentGroup");
  localStorage.removeItem("isGroupOwner");
  go("username");
}

async function proceedAfterRole() {
  const roleCard = document.querySelector("#role .card.selected");
  if (!roleCard) {
    alert("Please select a travel type");
    return;
  }
  
  const roleText = roleCard.innerText.split(" ")[1].toLowerCase();
  
  // Only create group for group modes (friends, couples, family)
  if (!joinMode && roleText !== "solo") {
    // Create group for team owner
    try {
      console.log("Creating group...");
      const res = await fetch(`${API_BASE}/create_group`, { method: "GET" });
      const data = await res.json();
      console.log("Group created:", data);
      localStorage.setItem("currentGroup", data.group_id);
      localStorage.setItem("isGroupOwner", "true");
      go("interests");
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Failed to create group: " + err.message);
    }
  } else {
    // Solo travelers or joiners proceed directly to interests
    console.log("Proceeding to interests (solo or join mode)");
    if (roleText === "solo") {
      // Ensure no leftover group ID forces a group call
      localStorage.removeItem("currentGroup");
      localStorage.removeItem("isGroupOwner");
    }
    go("interests");
  }
}

function showLobby() {
  go("group");
  const groupId = localStorage.getItem("currentGroup");
  const currentUserName = localStorage.getItem("currentUserName") || "Anonymous";
  
  // Display team code
  document.getElementById("groupTeamCode").innerText = groupId;
  
  // Add current user to group and fetch members
  addCurrentUserToGroup(groupId, currentUserName);
  
  // Start polling to refresh member list every 2 seconds
  const lobbyRefreshInterval = setInterval(() => {
    if (document.querySelector(".screen.active")?.id === "group") {
      fetchAndRenderMembers(groupId, currentUserName);
    } else {
      clearInterval(lobbyRefreshInterval);
    }
  }, 2000);
  localStorage.setItem("lobbyRefreshInterval", lobbyRefreshInterval);
}

function proceedToBudget() {
  // 1. FIX: Check joinMode first. If they joined a team, they MUST go to lobby.
  if (joinMode) {
    showLobby();
    return;
  }

  // Check if user is solo (for creators)
  const roleCard = document.querySelector("#role .card.selected");
  const roleText = roleCard
    ? roleCard.innerText.split(" ")[1].toLowerCase()
    : "solo";

  if (roleText === "solo") {
    runRecommendationFlow();
  } else {
    showLobby();
  }
}

async function addCurrentUserToGroup(groupId, currentUserName) {
  const roleCard = document.querySelector("#role .card.selected");
  const user_type = roleCard
    ? roleCard.innerText.split(" ")[1].toLowerCase()
    : "solo";

  const selectedChips = document.querySelectorAll(".chip.selected");
  const user_interests = Array.from(selectedChips).map(c => (c.dataset.tag || "").toLowerCase());

  const budgetCard = document.querySelector("#budget .card.selected");
  let budgetText = budgetCard ? budgetCard.innerText.trim() : "Low";
  const user_budget = budgetText.includes("Low")
    ? "low"
    : budgetText.includes("Medium")
    ? "mid"
    : "high";

  try {
    console.log("Adding user to group...", { groupId, currentUserName, user_type, user_interests, user_budget });
    const res = await fetch(`${API_BASE}/join_group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: groupId,
        user_name: currentUserName,
        user_type: user_type,
        user_interests: user_interests,
        user_budget: user_budget
      })
    });

    if (res.ok) {
      console.log("User added to group");
      // Now fetch all members
      fetchAndRenderMembers(groupId, currentUserName);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to add user to group:", res.status, errorData);
      alert("Error: " + (errorData.error || "Failed to join group"));
    }
  } catch (err) {
    console.error("Error adding user to group:", err);
    alert("Error: " + err.message);
  }
}

async function fetchAndRenderMembers(groupId, currentUserName) {
  try {
    const res = await fetch(`${API_BASE}/get_group_members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId })
    });

    if (res.ok) {
      const data = await res.json();
      renderMembers(data.members, currentUserName);

      // 2. FIX: Check if the trip has already been generated by the host
      if (data.trip_results && data.trip_results.length > 0) {
        // Stop polling
        const intervalId = localStorage.getItem("lobbyRefreshInterval");
        if (intervalId) clearInterval(intervalId);
        
        // Show results to this user
        console.log("Trip generated! Syncing results...");
        renderResults(data.trip_results);
        go("results");
      }

    } else {
      console.error("Failed to fetch members");
    }
  } catch (err) {
    console.error("Failed to fetch members:", err);
  }
}
function renderMembers(members, currentUserName) {
  const container = document.getElementById("membersList");
  container.innerHTML = "";

  members.forEach(member => {
    const card = document.createElement("div");
    card.className = "member-card ready";
    
    const isCurrentUser = member.name === currentUserName;
    const badge = `<span class="status-badge ready">${isCurrentUser ? "You" : "Ready"}</span>`;
    
    const interestSummary = (member.interests || []).slice(0, 3).join(", ") || "No interests";
    
    card.innerHTML = `
      <div class="member-name">${member.name}</div>
      <div class="member-status">${member.user_type || "Traveler"}</div>
      <div style="font-size: 0.9rem; color: var(--muted); margin-top: 8px;">
        ${interestSummary}
      </div>
      ${badge}
    `;
    
    container.appendChild(card);
  });
}

function startJoinFlow() {
  joinMode = true;
  document.getElementById("teamcodeInput").value = "";
  document.getElementById("teamcodeError").style.display = "none";
  go("username");
}

/* ---------- USERNAME CAPTURE ---------- */
async function proceedWithName() {
  const name = document.getElementById("userNameInput").value.trim();
  const errorEl = document.getElementById("nameError");
  
  if (!name) {
    errorEl.textContent = "Please enter your name";
    errorEl.style.display = "block";
    return;
  }
  
  // Store name in localStorage
  localStorage.setItem("currentUserName", name);
  errorEl.style.display = "none";
  
  // Proceed based on mode
  if (joinMode) {
    go("teamcode");
  } else {
    go("role");
  }
}

async function joinTeam() {
  const teamcode = document.getElementById("teamcodeInput").value.trim().toUpperCase();
  const errorEl = document.getElementById("teamcodeError");

  if (!teamcode) {
    errorEl.textContent = "Please enter a team code";
    errorEl.style.display = "block";
    return;
  }

  // Store the team code and proceed to interests selection
  localStorage.setItem("currentGroup", teamcode);
  localStorage.setItem("isGroupOwner", "false");
  errorEl.style.display = "none";
  go("interests");
}

/* ---------- ROLE SELECTION ---------- */
function selectRole(el) {
  document.querySelectorAll("#role .card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("roleContinue").disabled = false;
}

/* ---------- INTEREST TAGS ---------- */
const tags = [
  "Mountains", "Beach", "Nature", "Forest", "Waterfalls",
  "Lakes", "Desert", "River", "Islands", "Caves",
  "Trekking", "Adventure", "Camping", "Safari", "Rafting",
  "Skiing", "Paragliding", "Water-sports", "Bird-watching", "Boating",
  "Heritage", "Spiritual", "Culture", "Peaceful", "Offbeat",
  "Romantic", "History", "Luxury", "Food", "Nightlife"
];

const tagIcons = {
  "Mountains": "⛰️",
  "Beach": "🏖️",
  "Nature": "🌿",
  "Forest": "🌲",
  "Waterfalls": "💧",
  "Lakes": "🏞️",
  "Desert": "🏜️",
  "River": "🌊",
  "Islands": "🏝️",
  "Caves": "🕳️",
  "Trekking": "🥾",
  "Adventure": "⚡",
  "Camping": "🏕️",
  "Safari": "🦁",
  "Rafting": "🛶",
  "Skiing": "🎿",
  "Paragliding": "🪂",
  "Water-sports": "🏄‍♂️",
  "Bird-watching": "🦜",
  "Boating": "⛵",
  "Heritage": "🏛️",
  "Spiritual": "🧘",
  "Culture": "🎭",
  "Peaceful": "🕊️",
  "Offbeat": "🌀",
  "Romantic": "❤️",
  "History": "📜",
  "Luxury": "💎",
  "Food": "🍜",
  "Nightlife": "🌃"
};

const chipContainer = document.getElementById("chipContainer");

tags.forEach(tag => {
  const chip = document.createElement("div");
  chip.className = "chip";
  const icon = tagIcons[tag] || "•";
  chip.dataset.tag = tag;
  chip.innerHTML = `${icon} <span>${tag}</span>`;
  chip.onclick = () => {
    chip.classList.toggle("selected");
    const selected = document.querySelectorAll(".chip.selected").length;
    document.getElementById("interestContinue").disabled = selected < 3;
  };
  chipContainer.appendChild(chip);
});

/* ---------- BUDGET ---------- */
function selectBudget(el) {
  document.querySelectorAll("#budget .card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("budgetContinue").disabled = false;
}

/* ---------- JOIN CODE (guard if element exists) ---------- */
const joinCodeEl = document.getElementById("joinCode");
if (joinCodeEl) {
  joinCodeEl.innerText = "TS-" + Math.floor(Math.random() * 9000 + 1000);
}

/* ---------- LOADING -> RESULTS ---------- */
const loadingMessages = [
  "Balancing vibes...",
  "Resolving travel conflicts...",
  "Maximizing group happiness..."
];

let i = 0;

function startLoading() {
  go("loading");

  setInterval(() => {
    i = (i + 1) % loadingMessages.length;
    document.getElementById("loadingMessage").innerText = loadingMessages[i];
  }, 1200);

  setTimeout(() => {
    go("results");
  }, 3000);
}

/* ---------- FINAL API CALL + DISPLAY RESULTS ---------- */

async function generateRecommendations() {
  // 1. Check if we are part of a group (Host or Joiner)
  const groupId = localStorage.getItem("currentGroup");
  
  // Get user preferences for the request
  const selectedChips = document.querySelectorAll(".chip.selected");
  const user_interests = Array.from(selectedChips).map(c => (c.dataset.tag || "").toLowerCase());

  const budgetCard = document.querySelector("#budget .card.selected");
  let budgetText = budgetCard ? budgetCard.innerText.trim() : "Low";
  const user_budget = budgetText.includes("Low") ? "low" : budgetText.includes("Medium") ? "mid" : "high";
  const roleCard = document.querySelector("#role .card.selected");
  const roleText = roleCard ? roleCard.innerText.split(" ")[1].toLowerCase() : "solo";

  try {
    // Use group API only when a groupId exists AND either user joined a group or selected a group role.
    const shouldUseGroup = groupId && (joinMode || roleText !== "solo");

    if (shouldUseGroup) {
      console.log("Generating group recommendations for:", groupId);
      
      // Ensure user is updated in group before generating
      const currentUserName = localStorage.getItem("currentUserName") || "Anonymous";
      
      // We assume user_type is "friends" for mixed groups, or fallback to 'solo' if undefined
      // But for the API call, we just need to ensure we join the group first.
      await addCurrentUserToGroup(groupId, currentUserName);

      const res = await fetch(`${API_BASE}/generate_group_trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId })
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      console.log("Received Group results:", data);
      renderResults(data);

    } else {
      // 3. SOLO MODE (Only if no Group ID exists)
      console.log("Generating SOLO recommendations...");

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_type: roleText,
          user_interests: user_interests,
          user_budget: user_budget
        })
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      console.log("Received Solo results:", data);
      renderResults(data);
    }
  } catch (err) {
    console.error(err);
    renderResults([], `Request failed: ${err.message}`);
  }
}

/* ---------- RENDER RESULTS INTO HTML ---------- */
function renderResults(results, errorMsg) {
  const container = document.getElementById("resultsContainer");
  
  if (errorMsg) {
    container.innerHTML = `
      <p style="color: #f88; text-align: center; padding: 40px 20px;">
        ${errorMsg}
      </p>
    `;
    return;
  }

  if (!results || results.length === 0) {
    container.innerHTML = `
      <p style="opacity: 0.7; text-align: center; padding: 40px 20px;">
        No results yet. Try adjusting your interests or budget.
      </p>
    `;
    return;
  }

  // Show image fetching message
  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; animation: pulse 1.5s infinite;">
      <div class="loader" style="margin: 0 auto 20px;"></div>
      <p class="subtitle" style="color: var(--accent); font-size: 1.1rem; margin-bottom: 8px;">
        🖼️ Loading destination images...
      </p>
      <p class="subtitle" style="opacity: 0.6; font-size: 0.9rem;">
        Just a moment while we fetch beautiful photos
      </p>
    </div>
  `;

  const formatTag = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  const formatList = arr => (arr || []).slice(0, 3).map(formatTag).join(", ") || "—";
  const formatCurrency = num => typeof num === "number" ? `₹${num.toLocaleString("en-IN")}/day` : "—";

  const grid = document.createElement("div");
  grid.className = "result-grid";
  grid.id = "resultsGrid";

  results.slice(0, 6).forEach((place, index) => {
    const tags = (place.tags || []).slice(0, 4).map(t => `<span class="tag-chip">${formatTag(t)}</span>`).join("");
    const bestFor = formatList(place.best_for);
    const seasons = formatList(place.season);
    const cost = formatCurrency(place.avg_cost_per_day);
    const duration = place.trip_duration ? `${place.trip_duration} day${place.trip_duration > 1 ? "s" : ""}` : "—";
    const climate = place.climate ? formatTag(place.climate) : "—";
    const popularity = place.popularity ? formatTag(place.popularity) : "—";
    const imageUrl = place.image || "";

    const card = document.createElement("div");
    card.className = "card result-card";
    card.setAttribute("data-place", place.place);
    card.style.opacity = "0";
    card.style.animation = `fadeInUp 0.5s ease forwards`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Show skeleton loader while image loads
    const imageSrc = imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect fill='%23222' width='400' height='250'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3E⏳ Loading...%3C/text%3E%3C/svg%3E";
    
    card.innerHTML = `
      <div class="result-image" style="width: 100%; height: 180px; overflow: hidden; border-radius: 8px; margin-bottom: 16px; background: #1a1a1a; position: relative;">
        <img class="result-img" src="${imageSrc}" alt="${place.place}" 
             style="width: 100%; height: 100%; object-fit: cover; opacity: ${imageUrl ? '0.8' : '0.5'};" 
             data-place="${place.place}"
             data-state="${place.state || ''}"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23333%22 width=%22400%22 height=%22250%22/%3E%3C/svg%3E'; this.classList.add('loaded');">
      </div>

      <div class="result-top">
        <div>
          <h3>${place.place || "Unknown"}</h3>
          <p class="result-sub">${place.state || ""}</p>
        </div>
        <div class="pill score-pill">Score: ${place.score ?? "-"}</div>
      </div>

      <div class="result-meta">
        <div><strong>Budget</strong><span>${cost}</span></div>
        <div><strong>Duration</strong><span>${duration}</span></div>
        <div><strong>Climate</strong><span>${climate}</span></div>
        <div><strong>Popularity</strong><span>${popularity}</span></div>
      </div>

      <div class="result-meta">
        <div><strong>Best for</strong><span>${bestFor}</span></div>
        <div><strong>Seasons</strong><span>${seasons}</span></div>
      </div>

      <div class="tag-list">${tags}</div>
      
      <button class="btn ghost know-more-btn" onclick="showPlaceInfo('${(place.place || '').replace(/'/g, "\\'")}')">🗺️ Get Plan</button>
    `;
    grid.appendChild(card);
  });

  // Clear loading message and show results after a brief delay
  setTimeout(() => {
    container.innerHTML = "";
    container.appendChild(grid);

    // Show progress indicator while images load
    const progressDiv = document.createElement("div");
    progressDiv.id = "imageProgress";
    progressDiv.style.cssText = "text-align: center; padding: 20px; color: var(--accent); font-size: 0.9rem; opacity: 0.8;";
    progressDiv.innerHTML = "📸 Loading images...";
    container.appendChild(progressDiv);

    // Fetch images asynchronously for each place that doesn't have one
    let imagesLoaded = 0;
    const imagesToLoad = results.filter(p => !p.image);
    const totalImages = imagesToLoad.length;

    if (totalImages === 0) {
      // All images already present, remove progress
      setTimeout(() => {
        const prog = document.getElementById("imageProgress");
        if (prog) prog.remove();
      }, 500);
      return;
    }

    results.forEach(place => {
      const placeName = place.place;
      const state = place.state || "";
      
      // Only fetch if image is not already present
      if (!place.image) {
        fetchPlaceImage(placeName, state).then(imageUrl => {
          if (imageUrl) {
            updateCardImage(placeName, imageUrl);
          }
          imagesLoaded++;
          
          // Update progress
          const prog = document.getElementById("imageProgress");
          if (prog && totalImages > 0) {
            const percentage = Math.round((imagesLoaded / totalImages) * 100);
            prog.innerHTML = `📸 Loading images... ${imagesLoaded}/${totalImages} (${percentage}%)`;
            
            // Remove progress indicator when all done
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                prog.style.transition = "opacity 0.5s";
                prog.style.opacity = "0";
                setTimeout(() => prog.remove(), 500);
              }, 500);
            }
          }
        }).catch(err => {
          console.error(`Failed to fetch image for ${placeName}:`, err);
          imagesLoaded++;
          
          // Update progress even on error
          const prog = document.getElementById("imageProgress");
          if (prog && totalImages > 0) {
            const percentage = Math.round((imagesLoaded / totalImages) * 100);
            prog.innerHTML = `📸 Loading images... ${imagesLoaded}/${totalImages} (${percentage}%)`;
            
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                prog.style.transition = "opacity 0.5s";
                prog.style.opacity = "0";
                setTimeout(() => prog.remove(), 500);
              }, 500);
            }
          }
        });
      }
    });
  }, 600);
}

/* ---------- SHOW LOADING SKELETONS ---------- */
function showLoadingSkeletons(count) {
  const container = document.getElementById("resultsContainer");
  const grid = document.createElement("div");
  grid.className = "result-grid";
  grid.id = "skeletonLoader";

  for (let i = 0; i < Math.min(count, 6); i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "card result-card skeleton-card";
    skeleton.style.opacity = "0";
    skeleton.style.animation = `fadeInUp 0.5s ease forwards`;
    skeleton.style.animationDelay = `${i * 0.1}s`;
    
    skeleton.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-subtitle"></div>
      <div style="margin: 12px 0;">
        <div class="skeleton skeleton-meta" style="width: 100%; margin-bottom: 6px;"></div>
        <div class="skeleton skeleton-meta" style="width: 95%; margin-bottom: 6px;"></div>
        <div class="skeleton skeleton-meta" style="width: 90%;"></div>
      </div>
    `;
    grid.appendChild(skeleton);
  }

  container.innerHTML = "";
  container.appendChild(grid);
}

/* ---------- FETCH WIKIPEDIA IMAGES ASYNCHRONOUSLY ---------- */
async function fetchPlaceImage(placeName, state = "") {
  // Fetch a Wikipedia image for a place from the backend
  try {
    const params = new URLSearchParams({
      place: placeName,
      state: state
    });
    
    const res = await fetch(`${API_BASE}/get_place_image?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.image || null;
    }
  } catch (err) {
    console.error(`Error fetching image for ${placeName}:`, err);
  }
  return null;
}

function updateCardImage(placeName, imageUrl) {
  // Update a result card's image dynamically with smooth fade-in
  const cards = document.querySelectorAll(".result-card");
  cards.forEach(card => {
    const heading = card.querySelector("h3");
    if (heading && heading.textContent === placeName) {
      const img = card.querySelector(".result-image img");
      if (img && imageUrl) {
        // Add loading class to trigger fade-in animation
        img.classList.add("loading");
        img.src = imageUrl;
        
        // When image loads, mark as loaded and fade in
        img.onload = function() {
          this.classList.remove("loading");
          this.classList.add("loaded");
          this.style.opacity = "1";
        };
        
        // Fallback for slow connections - ensure it looks good
        setTimeout(() => {
          if (img.style.opacity !== "1") {
            img.classList.add("loaded");
            img.style.opacity = "1";
          }
        }, 1000);
      }
    }
  });
}

async function runRecommendationFlow() {
  // Go to results page FIRST to show loading
  go("results");
  
  // Show immediate loading state
  const container = document.getElementById("resultsContainer");
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; animation: pulse 1.5s infinite;">
      <div class="loader" style="margin: 0 auto 20px;"></div>
      <p class="subtitle" style="color: var(--accent); font-size: 1.1rem; margin-bottom: 8px;">
        🎯 Finding your perfect destinations...
      </p>
      <p class="subtitle" style="opacity: 0.6; font-size: 0.9rem;">
        Analyzing preferences and calculating matches
      </p>
    </div>
  `;
  
  // Then fetch recommendations
  await generateRecommendations();
}

/* ---------- PLACE INFO (WIKIPEDIA) ---------- */
function showPlaceInfo(placeName) {
  // Get user preferences from localStorage
  const roleCard = document.querySelector("#role .card.selected");
  const roleText = roleCard ? roleCard.innerText.split(" ")[1].toLowerCase() : "tourist";
  
  const selectedChips = document.querySelectorAll(".chip.selected");
  const interests = Array.from(selectedChips).map(c => (c.dataset.tag || "").toLowerCase());
  
  const budgetCard = document.querySelector("#budget .card.selected");
  let budgetText = budgetCard ? budgetCard.innerText.trim() : "Medium";
  const budget = budgetText.includes("Low") ? "low" : budgetText.includes("Medium") ? "medium" : "high";
  
  // Build URL with all parameters
  const params = new URLSearchParams({
    place: placeName,
    role: roleText,
    budget: budget,
    interests: interests.join(",")
  });
  
  const url = `/templates/place_info.html?${params.toString()}`;
  window.open(url, "_blank");
}
