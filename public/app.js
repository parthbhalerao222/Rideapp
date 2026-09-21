const state = { users: [], drivers: [], rides: [], historyFilter: "all" };
const locationPresets = [
  { name: "Connaught Place → India Gate", pickup: "Connaught Place", dropoff: "India Gate", start: [28.7041, 77.1025], end: [28.6139, 77.2090] },
  { name: "Hauz Khas → Saket", pickup: "Hauz Khas", dropoff: "Saket", start: [28.5494, 77.2001], end: [28.5244, 77.2066] },
  { name: "Bandra → Juhu", pickup: "Bandra", dropoff: "Juhu", start: [19.0607, 72.8362], end: [19.0988, 72.8266] },
  { name: "Koramangala → MG Road", pickup: "Koramangala", dropoff: "MG Road", start: [12.9352, 77.6245], end: [12.9756, 77.6060] },
  { name: "Same point (minimum fare)", pickup: "Pickup point", dropoff: "Nearby drop-off", start: [28.7041, 77.1025], end: [28.7041, 77.1025] },
  { name: "No driver nearby (edge case)", pickup: "Remote pickup", dropoff: "Remote destination", start: [0, 0], end: [0.05, 0.05] },
];
const $ = (selector) => document.querySelector(selector);
const formatFare = (amount) => `₹${Number(amount).toFixed(2)}`;
const toRadians = (value) => (value * Math.PI) / 180;
function distanceKm(startLatitude, startLongitude, endLatitude, endLongitude) {
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(startLatitude)) * Math.cos(toRadians(endLatitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFare(distance, vehicleType) {
  const rates = vehicleType === "SEDAN" ? [15, 12, 8] : [10, 8, 5];
  const fare = distance <= 2
    ? distance * rates[0]
    : distance <= 5
      ? 2 * rates[0] + (distance - 2) * rates[1]
      : 2 * rates[0] + 3 * rates[1] + (distance - 5) * rates[2];
  return Math.max(50, fare);
}

function updateLocationSummary() {
  const startLatitude = Number($("#start-latitude").value);
  const startLongitude = Number($("#start-longitude").value);
  const endLatitude = Number($("#end-latitude").value);
  const endLongitude = Number($("#end-longitude").value);
  $("#pickup-summary").textContent = `${startLatitude.toFixed(4)}, ${startLongitude.toFixed(4)}`;
  $("#dropoff-summary").textContent = `${endLatitude.toFixed(4)}, ${endLongitude.toFixed(4)}`;
  const distance = distanceKm(startLatitude, startLongitude, endLatitude, endLongitude);
  $("#route-distance").textContent = `${distance.toFixed(1)} km`;
  $("#estimated-fare").textContent = `₹${estimateFare(distance, $("#booking-vehicle").value).toFixed(2)}`;
}

function populateLocationPresets() {
  $("#route-preset").innerHTML = locationPresets
    .map((preset, index) => `<option value="${index}">${preset.name}</option>`)
    .join("");
}

function applyLocationPreset(index) {
  const preset = locationPresets[index];
  if (!preset) return;
  $("#start-location").value = preset.pickup;
  $("#end-location").value = preset.dropoff;
  $("#start-latitude").value = preset.start[0];
  $("#start-longitude").value = preset.start[1];
  $("#end-latitude").value = preset.end[0];
  $("#end-longitude").value = preset.end[1];
  updateLocationSummary();
  renderDrivers();
}

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function setNotice(message = "") {
  $("#notice").textContent = message;
}

function renderBookingResult(ride) {
  const driver = state.drivers.find((item) => item.id === ride.driverId);
  if (!ride || !driver) {
    $("#booking-result").textContent = "";
    return;
  }
  const upgrade = ride.actualVehicleType !== ride.requestedVehicleType
    ? ` Requested ${ride.requestedVehicleType}, upgraded to ${ride.actualVehicleType} at no extra vehicle charge.`
    : "";
  const coupon = ride.couponCode ? ` Coupon ${ride.couponCode} was validated and attached to the ride.` : "";
  $("#booking-result").innerHTML = `<strong>Driver assigned: ${driver.name}</strong><span>Nearest available ${driver.vehicle.type.toLowerCase()} · ${distanceKm(driver.location.latitude, driver.location.longitude, ride.startLocation.latitude, ride.startLocation.longitude).toFixed(1)} km from pickup.</span><small>${upgrade}${coupon}</small>`;
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
        <div><div class="driver-name">${driver.name}</div><div class="driver-meta">${driver.vehicle.type} · ${driver.vehicle.model} · ${distanceKm(driver.location.latitude, driver.location.longitude, Number($("#start-latitude").value), Number($("#start-longitude").value)).toFixed(1)} km from pickup</div></div>
        <span class="badge badge-${driver.status.toLowerCase().replace("_", "-")}">${driver.status.replace("_", " ")}</span>
      </div>`).join("")
    : '<div class="empty-state">No drivers registered yet.</div>';
}

function renderRides() {
  const visibleRides = state.rides.filter((ride) => state.historyFilter === "all"
    || ride.userId === state.historyFilter
    || ride.driverId === state.historyFilter);
  const active = state.rides.filter((ride) => ride.status === "ONGOING").length;
  const totalFare = state.rides.reduce((sum, ride) => sum + (ride.discountedFare ?? ride.fare ?? 0), 0);
  $("#active-ride-count").textContent = active;
  $("#fare-total").textContent = formatFare(totalFare);
  $("#ride-count-label").textContent = `${visibleRides.length} ride${visibleRides.length === 1 ? "" : "s"}`;
  $("#ride-list").classList.toggle("empty-state", visibleRides.length === 0);
  $("#ride-list").innerHTML = visibleRides.length
    ? [...visibleRides].reverse().map((ride) => {
      const user = state.users.find((item) => item.id === ride.userId);
      const driver = state.drivers.find((item) => item.id === ride.driverId);
      const fare = ride.discountedFare ?? ride.fare;
      const fareDetails = ride.status === "COMPLETED"
        ? `<div class="fare-details">Final fare <strong>${formatFare(fare)}</strong>${ride.appliedCoupon ? ` · ${ride.appliedCoupon} applied` : ""}</div>`
        : ride.status === "CANCELLED"
          ? `<div class="fare-details">Cancellation fee <strong>${formatFare(ride.cancellationFee ?? 0)}</strong></div>`
          : '<div class="fare-details">Fare calculated when trip is completed</div>';
      const progress = ride.status === "ONGOING"
        ? '<div class="ride-progress"><span class="complete">Requested</span><span class="complete">Driver assigned</span><span class="current">Ride in progress</span><span>Completed</span></div>'
        : ride.status === "COMPLETED"
          ? '<div class="ride-progress"><span class="complete">Requested</span><span class="complete">Driver assigned</span><span class="complete">Ride in progress</span><span class="complete">Completed</span></div>'
          : '<div class="ride-progress"><span class="complete">Requested</span><span class="cancelled">Cancelled</span></div>';
      return `<div class="ride-row">
        <div><div class="driver-name">${user?.name ?? "Rider"} → ${driver?.name ?? "Driver"}</div><div class="ride-meta">${ride.requestedVehicleType}${ride.actualVehicleType !== ride.requestedVehicleType ? ` → ${ride.actualVehicleType} upgrade` : ""} · ${ride.distance !== undefined ? `${ride.distance.toFixed(1)} km trip · ` : ""}${ride.id.slice(0, 17)}</div>${ride.appliedCoupon ? `<div class="ride-discount">Coupon ${ride.appliedCoupon} applied</div>` : ""}${progress}</div>
        <div class="ride-row-actions">${fareDetails}<span class="badge badge-${ride.status.toLowerCase()}">${ride.status}</span>
        ${ride.status === "ONGOING" ? `<button class="button button-quiet button-small" data-end-ride="${ride.id}">Complete</button><button class="button button-quiet button-small" data-cancel-ride="${ride.id}">Cancel</button>` : ""}</div>
      </div>`;
    }).join("")
    : state.rides.length ? "No rides match this history view." : "No rides yet. Request one above to get started.";
}

function renderHistoryFilter() {
  const filter = $("#history-filter");
  const options = [
    '<option value="all">All riders and drivers</option>',
    ...state.users.map((user) => `<option value="${user.id}">Rider · ${user.name}</option>`),
    ...state.drivers.map((driver) => `<option value="${driver.id}">Driver · ${driver.name}</option>`),
  ];
  filter.innerHTML = options.join("");
  filter.value = state.historyFilter;
}

async function refresh() {
  const [users, drivers] = await Promise.all([request("/api/users"), request("/api/drivers")]);
  state.users = users;
  state.drivers = drivers;
  const rides = [];
  for (const user of users) rides.push(...await request(`/api/users/${user.id}/rides`));
  state.rides = rides.filter((ride, index, list) => list.findIndex((item) => item.id === ride.id) === index);
  renderUsers(); renderDrivers(); renderHistoryFilter(); renderRides();
  $("#rider-count").textContent = users.length;
  $("#api-status").textContent = "API connected";
}

$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setNotice("");
  try {
    const ride = await request("/api/rides", { method: "POST", body: JSON.stringify({
      userId: $("#booking-user").value,
      vehicleType: $("#booking-vehicle").value,
      startLatitude: Number($("#start-latitude").value),
      startLongitude: Number($("#start-longitude").value),
      endLatitude: Number($("#end-latitude").value),
      endLongitude: Number($("#end-longitude").value),
      couponCode: $("#coupon-code").value.trim() || undefined,
    })});
    await refresh();
    renderBookingResult(ride);
    setNotice("Ride booked successfully. The selected driver is shown below.");
  } catch (error) { setNotice(error.message); }
});

$("#route-preset").addEventListener("change", (event) => applyLocationPreset(Number(event.target.value)));
$("#history-filter").addEventListener("change", (event) => {
  state.historyFilter = event.target.value;
  renderRides();
});
["start-latitude", "start-longitude", "end-latitude", "end-longitude"].forEach((id) => {
  $(`#${id}`).addEventListener("input", updateLocationSummary);
});
$("#booking-vehicle").addEventListener("change", updateLocationSummary);
populateLocationPresets();
applyLocationPreset(0);
updateLocationSummary();

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
  const cancelButton = event.target.closest("[data-cancel-ride]");
  if (!button && !cancelButton) return;
  try {
    const rideId = button?.dataset.endRide ?? cancelButton.dataset.cancelRide;
    const action = button ? "end" : "cancel";
    await request(`/api/rides/${rideId}/${action}`, { method: "POST", body: "{}" });
    await refresh();
  } catch (error) { setNotice(error.message); }
});

$("#refresh-button").addEventListener("click", () => refresh().catch((error) => setNotice(error.message)));
refresh().catch((error) => { $("#api-status").textContent = "API unavailable"; setNotice(error.message); });
