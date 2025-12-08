/* ---------- PAGE NAVIGATION ---------- */
function go(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

/* ---------- ROLE SELECTION ---------- */
function selectRole(el) {
  document.querySelectorAll("#role .card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("roleContinue").disabled = false;
}

/* ---------- INTEREST TAGS ---------- */
const tags = [
  "Mountains","Beach","Nature","Forest","Waterfalls",
  "Adventure","Trekking","Camping","Nightlife","Food",
  "Road Trips","Photography","Diving","Snow","Culture"
];

const chipContainer = document.getElementById("chipContainer");

tags.forEach(tag => {
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.innerText = tag;
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

/* ---------- JOIN CODE ---------- */
document.getElementById("joinCode").innerText =
  "TS-" + Math.floor(Math.random() * 9000 + 1000);

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
