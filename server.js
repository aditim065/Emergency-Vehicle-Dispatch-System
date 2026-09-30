// server.js (backend)
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");
const requestTimers = {};

// ---------- Helper Functions ----------
function readDB() {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    if (!data.users) data.users = [];
    if (!data.drivers) data.drivers = [];
    if (!data.requests) data.requests = [];
    if (!data.admin) data.admin = {};
    if (!data.locations) data.locations = [];
    return data;
  } catch {
    return { users: [], drivers: [], requests: [], admin: {}, locations: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- Sessions ----------
const sessions = {};

function validPassword(pw) {
  if (typeof pw !== "string") return false;
  if (pw.length !== 8) return false;

  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const specials = pw.match(/[^A-Za-z0-9]/g) || [];
  return hasUpper && hasLower && hasDigit && specials.length === 1;
}

function createSession(info) {
  const token = uuidv4();
  sessions[token] = info;
  return token;
}

// Allow requests from frontend
app.use(cors());
app.use(express.json());

// Seed drivers with phone numbers and ensure variety
(function seedDrivers() {
  const db = readDB();
  let changed = false;
  db.drivers = (db.drivers || []).map((d, idx) => {
    if (!d.phone) { d.phone = `+91-98${(10000000 + (idx*137))%99999999}`; changed = true; }
    return d;
  });
  const base = db.drivers.length;
  if (db.drivers.length < 20) {
    const samples = [
      { name: "Arjun Mehta", vehicle: "Ambulance" },
      { name: "Priya Singh", vehicle: "Police" },
      { name: "Vikram Rao", vehicle: "FireTruck" },
      { name: "Neha Verma", vehicle: "Ambulance" },
      { name: "Karan Patel", vehicle: "Police" },
      { name: "Aisha Khan", vehicle: "FireTruck" },
      { name: "Rohit Sharma", vehicle: "Ambulance" },
      { name: "Sneha Iyer", vehicle: "Police" },
      { name: "Manish Gupta", vehicle: "FireTruck" },
      { name: "Divya Nair", vehicle: "Ambulance" },
      { name: "Sanjay Reddy", vehicle: "Police" },
      { name: "Pooja Das", vehicle: "FireTruck" },
      { name: "Anil Kumar", vehicle: "Ambulance" },
      { name: "Meera Joshi", vehicle: "Police" },
      { name: "Harsh Vardhan", vehicle: "FireTruck" },
      { name: "Lakshmi Menon", vehicle: "Ambulance" },
      { name: "Nitin Yadav", vehicle: "Police" },
      { name: "Ritu Sharma", vehicle: "FireTruck" },
      { name: "Aman Tiwari", vehicle: "Ambulance" },
      { name: "Ishita Roy", vehicle: "Police" },
    ];
    const locIds = (db.locations || []).map(l=>l.id);
    for (let i=0; i<samples.length && db.drivers.length<20; i++) {
      const s = samples[i];
      const id = (db.drivers.length ? Math.max(...db.drivers.map(d=>Number(d.id)||d.id)) : 0) + 1;
      const vehicleNo = `${s.vehicle}-${String(id).padStart(2,'0')}`;
      const phone = `+91-9${(800000000 + id*1331)%999999999}`;
      const locationId = (locIds && locIds.length) ? String(locIds[i % locIds.length]) : "1";
      db.drivers.push({ id, name: s.name, password: `${s.name.split(' ')[0]}@12a`, vehicleNo, vehicle: s.vehicle, status: "available", locationId, phone });
      changed = true;
    }
  }
  if (changed) writeDB(db);
})();

// ---------- HEALTH ----------
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ---------- AUTHENTICATION (admin, driver, user) ----------
app.get("/authenticate", (req, res) => {
  const { username, password } = req.query;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required" });

  const db = readDB();

  // --- ADMIN login ---
  if (username === db.admin.username && password === db.admin.password) {
    const token = createSession({ role: "admin", id: "admin", username });
    return res.json({ result: "success", role: "admin", token });
  }

  // --- DRIVER login ---
  const driver = db.drivers.find(
    (d) => d.name === username && d.password === password
  );
  if (driver) {
    const token = createSession({
      role: "driver",
      id: driver.id,
      username,
    });
    return res.json({
      result: "success",
      role: "driver",
      token,
      id: driver.id,
    });
  }

  // --- USER login or auto-create ---
  let user = db.users.find((u) => u.username === username);

  if (user) {
    if (user.password !== password)
      return res.status(401).json({ error: "Invalid credentials" });
  } else {
    if (!validPassword(password))
      return res.status(400).json({
        error:
          "Password must be exactly 8 characters long with 1 uppercase, 1 lowercase, 1 number, and exactly 1 special character.",
      });

    // Check for duplicate name among drivers/admin
    if (
      db.drivers.some((d) => d.name === username) ||
      username === db.admin.username
    ) {
      return res.status(400).json({ error: "Username already exists" });
    }

    user = { id: "u" + (db.users.length + 1), username, password };
    db.users.push(user);
    writeDB(db);
  }

  const token = createSession({ role: "user", id: user.id, username });
  res.json({ result: "success", role: "user", token, id: user.id });
});

// ---------- LOCATIONS ----------
app.get("/locations", (req, res) => {
  const db = readDB();
  res.json(db.locations || []);
});

// ---------- DRIVERS (for Admin Dashboard) ----------
app.get("/drivers", (req, res) => {
  const db = readDB();
  res.json(db.drivers || []);
});

// ---------- REQUESTS (for Admin Dashboard) ----------
app.get("/requests", (req, res) => {
  const db = readDB();
  // Map the status to match the frontend expectations
  const requests = (db.requests || []).map(request => ({
    ...request,
    status: request.status === 'assigned' ? 'in-progress' : request.status
  }));
  res.json(requests);
});

// ---------- ASSIGN DRIVER TO USER REQUEST ----------
app.post("/assign", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { locationId, vehicleType, emergencyType } = req.body;
  if (!locationId || !vehicleType)
    return res.status(400).json({ error: "Missing location or vehicle type" });

  const db = readDB();

  const location = db.locations.find((l) => l.id == locationId);
  if (!location) return res.status(404).json({ error: "Invalid location" });

  const availableDriver = db.drivers.find(
    (d) =>
      d.status === "available" &&
      d.vehicle.toLowerCase() === vehicleType.toLowerCase()
  );

  if (!availableDriver)
    return res
      .status(404)
      .json({ error: "No available driver for that vehicle type" });

  availableDriver.status = "busy";

  const newRequest = {
    id: db.requests.length + 1,
    type: vehicleType,
    driverId: availableDriver.id,
    driverName: availableDriver.name,
    driverVehicleNumber: availableDriver.vehicleNo,
    vehicleType: availableDriver.vehicle,
    driverPhone: availableDriver.phone || "",
    driverLat: 12.9716,
    driverLng: 77.5946,
    locationId,
    locationName: location.name,
    locationLat: 12.9721,
    locationLng: 77.5933,
    distanceKm: (Math.random() * 5).toFixed(2),
    status: "assigned",
    emergencyType: emergencyType || "",
    timestamp: new Date().toISOString(),
  };

  db.requests.push(newRequest);
  writeDB(db);

  io.emit("newRequest", newRequest);
  io.to(availableDriver.id.toString()).emit("assigned", { request: newRequest });
  io.to(`req:${newRequest.id}`).emit("statusUpdate", { requestId: newRequest.id, status: "assigned" });
  res.status(200).json({ request: newRequest });

  // auto-complete after 5 minutes to free driver
  if (requestTimers[newRequest.id]) clearTimeout(requestTimers[newRequest.id]);
  requestTimers[newRequest.id] = setTimeout(() => {
    const db2 = readDB();
    const req = db2.requests.find(r => r.id === newRequest.id);
    if (!req || req.status !== "assigned") return;
    
    // Update request status to completed
    req.status = "completed";
    
    // Find and update the driver's status to available
    const driver = db2.drivers.find(d => d.id == req.driverId);
    if (driver) {
      driver.status = "available";
      console.log(`Driver ${driver.name} (${driver.vehicleNo}) is now available`);
    }
    
    writeDB(db2);
    
    // Notify all connected clients about the status update
    io.to(`req:${req.id}`).emit("statusUpdate", { 
      requestId: req.id, 
      status: "completed",
      message: "Service completed. Driver is now available for new requests."
    });
    
    console.log(`Request ${req.id} marked as completed. Driver ${driver?.id || 'unknown'} is now available.`);
  }, 5 * 60 * 1000); // 5 minutes
});

// ---------- SOCKET ----------
io.on("connection", (socket) => {
  socket.on("identify", (data) => {
    const { token } = data || {};
    const session = sessions[token];
    if (!session) return;
    socket.session = session;
    if (session.role === "driver") socket.join(session.id.toString());
  });
  socket.on("joinRequest", (data) => {
    const { requestId } = data || {};
    if (!requestId) return;
    socket.join(`req:${requestId}`);
  });
  socket.on("driverLocation", (data) => {
    const { token, lat, lng } = data || {};
    const session = sessions[token];
    if (!session || session.role !== "driver") return;
    const db = readDB();
    const reqs = db.requests.filter((r) => r.driverId == session.id && r.status === "assigned");
    const req = reqs.sort((a,b)=>b.id-a.id)[0];
    if (!req) return;
    req.driverLat = lat;
    req.driverLng = lng;
    writeDB(db);
    const driver = db.drivers.find((d)=>d.id == session.id);
    io.to(`req:${req.id}`).emit("locationUpdate", {
      driverId: session.id,
      driverName: driver ? driver.name : session.username,
      lat,
      lng,
      vehicleType: req.vehicleType,
    });
  });
});

// ---------- Serve static files ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- Start ----------
server.listen(PORT, () =>
  console.log(`✅ Backend + socket running at http://localhost:${PORT}`)
);

// ---------- Driver Endpoints ----------
app.get("/driver/requests", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice("Bearer ".length);
  const session = sessions[token];
  if (!session || session.role !== "driver") return res.status(403).json({ error: "Forbidden" });
  const db = readDB();
  const list = db.requests.filter((r) => r.driverId == session.id && r.status === "assigned");
  res.json(list);
});

app.post("/driver/update-location", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice("Bearer ".length);
  const session = sessions[token];
  if (!session || session.role !== "driver") return res.status(403).json({ error: "Forbidden" });
  const { lat, lng } = req.body || {};
  if (typeof lat !== "number" || typeof lng !== "number") return res.status(400).json({ error: "Invalid coordinates" });
  const db = readDB();
  const reqs = db.requests.filter((r) => r.driverId == session.id && r.status === "assigned");
  const r = reqs.sort((a,b)=>b.id-a.id)[0];
  if (!r) return res.status(404).json({ error: "No active request" });
  r.driverLat = lat;
  r.driverLng = lng;
  writeDB(db);
  const driver = db.drivers.find((d)=>d.id == session.id);
  io.to(`req:${r.id}`).emit("locationUpdate", {
    driverId: session.id,
    driverName: driver ? driver.name : session.username,
    lat,
    lng,
    vehicleType: r.vehicleType,
  });
  res.json({ ok: true });
});

// ---------- Complete/Cancel Request ----------
app.post("/requests/:id/complete", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const r = db.requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.status = "completed";
  const d = db.drivers.find(dd => dd.id == r.driverId);
  if (d) d.status = "available";
  writeDB(db);
  if (requestTimers[id]) { clearTimeout(requestTimers[id]); delete requestTimers[id]; }
  io.to(`req:${id}`).emit("statusUpdate", { requestId: id, status: "completed" });
  res.json({ ok: true });
});

app.post("/requests/:id/cancel", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const r = db.requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.status = "cancelled";
  const d = db.drivers.find(dd => dd.id == r.driverId);
  if (d) d.status = "available";
  writeDB(db);
  if (requestTimers[id]) { clearTimeout(requestTimers[id]); delete requestTimers[id]; }
  io.to(`req:${id}`).emit("statusUpdate", { requestId: id, status: "cancelled" });
  res.json({ ok: true });
});