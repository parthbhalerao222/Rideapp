const state = { users: [], drivers: [], rides: [] };
const $ = (selector) => document.querySelector(selector);
const formatFare = (amount) => `₹${Number(amount).toFixed(2)}`;

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function setNotice(message = "") {
  $("#notice").textContent = message;
}

function renderUsers() {
  const select = $("#booking-user");
  select.innerHTML = state.users.length
    ? state.users.map((user) => `<option value="${user.id}">${user.name}</option>`).join("")
    : '<option value="">Register a rider first</option>';
}

function renderDrivers() {
  $("#driver-count").textContent = state.drivers.length;
  $("#driver-list").innerHTML = state.drivers.length
    ? state.drivers.map((driver) => `
      <div class="driver-row">
        <div><div class="driver-name">${driver.name}</div><div class="driver-meta">${driver.vehicle.type} · ${driver.vehicle.model}</div></div>
        <span class="badge badge-${driver.status.toLowerCase().replace("_", "-")}">${driver.status.replace("_", " ")}</span>
      </div>`).join("")
    : '<div class="empty-state">No drivers registered yet.</div>';
}

function renderRides() {
  const active = state.rides.filter((ride) => ride.status === "ONGOING").length;
  const totalFare = state.rides.reduce((sum, ride) => sum + (ride.discountedFare ?? ride.fare ?? 0), 0);
  $("#active-ride-count").textContent = active;
  $("#fare-total").textContent = formatFare(totalFare);
  $("#ride-count-label").textContent = `${state.rides.length} ride${state.rides.length === 1 ? "" : "s"}`;
  $("#ride-list").classList.toggle("empty-state", state.rides.length === 0);
  $("#ride-list").innerHTML = state.rides.length
    ? [...state.rides].reverse().map((ride) => {
      const user = state.users.find((item) => item.id === ride.userId);
      const driver = state.drivers.find((item) => item.id === ride.driverId);
      const fare = ride.discountedFare ?? ride.fare;
      return `<div class="ride-row">
        <div><div class="driver-name">${user?.name ?? "Rider"} → ${driver?.name ?? "Driver"}</div><div class="ride-meta">${ride.requestedVehicleType} · ${ride.id.slice(0, 17)}</div></div>
        <div class="ride-row-actions"><span class="fare">${fare === undefined ? "Fare pending" : formatFare(fare)}</span><span class="badge badge-${ride.status.toLowerCase()}">${ride.status}</span>
        ${ride.status === "ONGOING" ? `<button class="button button-quiet button-small" data-end-ride="${ride.id}">Complete</button>` : ""}</div>
      </div>`;
    }).join("")
    : "No rides yet. Request one above to get started.";
}

async function refresh() {
  const [users, drivers] = await Promise.all([request("/api/users"), request("/api/drivers")]);
  state.users = users;
  state.drivers = drivers;
  const rides = [];
  for (const user of users) rides.push(...await request(`/api/users/${user.id}/rides`));
  state.rides = rides.filter((ride, index, list) => list.findIndex((item) => item.id === ride.id) === index);
  renderUsers(); renderDrivers(); renderRides();
  $("#rider-count").textContent = users.length;
  $("#api-status").textContent = "API connected";
}

$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setNotice("");
  try {
    await request("/api/rides", { method: "POST", body: JSON.stringify({
      userId: $("#booking-user").value,
      vehicleType: $("#booking-vehicle").value,
      startLatitude: Number($("#start-latitude").value),
      startLongitude: Number($("#start-longitude").value),
      endLatitude: Number($("#end-latitude").value),
      endLongitude: Number($("#end-longitude").value),
    })});
    await refresh();
  } catch (error) { setNotice(error.message); }
});

$("#user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request("/api/users", { method: "POST", body: JSON.stringify({
      name: $("#user-name").value, email: $("#user-email").value, phone: $("#user-phone").value,
    })});
    event.target.reset();
    await refresh();
  } catch (error) { setNotice(error.message); }
});

$("#driver-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request("/api/drivers", { method: "POST", body: JSON.stringify({
      name: $("#driver-name").value, email: $("#driver-email").value, phone: $("#driver-phone").value,
      vehicleType: $("#driver-vehicle").value, licensePlate: $("#driver-plate").value,
      vehicleModel: $("#driver-model").value, latitude: 28.7041, longitude: 77.1025,
    })});
    event.target.reset();
    await refresh();
  } catch (error) { setNotice(error.message); }
});

$("#ride-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-end-ride]");
  if (!button) return;
  try {
    await request(`/api/rides/${button.dataset.endRide}/end`, { method: "POST", body: "{}" });
    await refresh();
  } catch (error) { setNotice(error.message); }
});

$("#refresh-button").addEventListener("click", () => refresh().catch((error) => setNotice(error.message)));
refresh().catch((error) => { $("#api-status").textContent = "API unavailable"; setNotice(error.message); });
