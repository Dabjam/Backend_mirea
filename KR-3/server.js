const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");
const webpush = require("web-push");
const cors = require("cors");

const vapidKeys = {
  publicKey: "BP2rHjeu-yUsBQt9htelxUENKK6ls5Xkhoj5VZa3SwsLLQAqcDWrBgVwDjkG0tvoFm5vBICte7hZlfKvoblTd9s",
  privateKey: "ruFolUvw4ANvQfrRQx6LLlKwTAGAAhro64pnoUv6JAk"
};

webpush.setVapidDetails(
  "mailto:student@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "./")));

const subscriptions = new Map();
const reminders = new Map();

const pfxPath = path.join(__dirname, "localhost.pfx");
const pfxPassphrasePath = path.join(__dirname, "localhost-passphrase.txt");
const certPath = path.join(__dirname, "localhost.pem");
const keyPath = path.join(__dirname, "localhost-key.pem");
const usePfx = fs.existsSync(pfxPath);
const usePem = fs.existsSync(certPath) && fs.existsSync(keyPath);
const useHttps = usePfx || usePem;

const server = useHttps
  ? https.createServer(
      usePfx
        ? {
            pfx: fs.readFileSync(pfxPath),
            passphrase: fs.existsSync(pfxPassphrasePath)
              ? fs.readFileSync(pfxPassphrasePath, "utf8").trim()
              : undefined
          }
        : {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
          },
      app
    )
  : http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

function normalizeText(value) {
  return String(value || "").trim();
}

function sendPush(payload) {
  for (const [endpoint, subscription] of subscriptions.entries()) {
    webpush.sendNotification(subscription, JSON.stringify(payload)).catch((err) => {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        subscriptions.delete(endpoint);
      }
      console.error("Push error:", err?.message || err);
    });
  }
}

function scheduleReminder(id, text, reminderTime) {
  const delay = reminderTime - Date.now();
  if (delay <= 0) return false;

  const existingReminder = reminders.get(id);
  if (existingReminder) {
    clearTimeout(existingReminder.timeoutId);
  }

  const timeoutId = setTimeout(() => {
    io.emit("reminderDue", { id, text, reminderTime });
    sendPush({ title: "Напоминание", body: text, reminderId: id });
    reminders.delete(id);
  }, delay);

  reminders.set(id, { timeoutId, text, reminderTime });
  return true;
}

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("newTask", (task) => {
    const text = normalizeText(task?.text);
    if (!text) return;

    const payload = {
      text,
      timestamp: Number(task?.timestamp) || Date.now(),
      senderId: normalizeText(task?.senderId) || null
    };
    io.emit("taskAdded", payload);
    sendPush({ title: "Новая задача", body: text });
  });

  socket.on("newReminder", (reminder) => {
    const id = Number(reminder?.id);
    const text = normalizeText(reminder?.text);
    const reminderTime = Number(reminder?.reminderTime);

    if (!id || !text || !reminderTime) return;
    scheduleReminder(id, text, reminderTime);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    protocol: useHttps ? "https" : "http",
    subscriptions: subscriptions.size,
    reminders: reminders.size
  });
});

app.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/reminders", (req, res) => {
  const id = Number(req.body?.id);
  const text = normalizeText(req.body?.text);
  const reminderTime = Number(req.body?.reminderTime);

  if (!id || !text || !reminderTime) {
    return res.status(400).json({ error: "Reminder id, text and reminderTime are required" });
  }

  const scheduled = scheduleReminder(id, text, reminderTime);
  if (!scheduled) {
    return res.status(400).json({ error: "Reminder time must be in the future" });
  }

  return res.status(201).json({ message: "Reminder scheduled" });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  const endpoint = subscription?.endpoint;

  if (!endpoint) {
    return res.status(400).json({ error: "Subscription endpoint is required" });
  }

  subscriptions.set(endpoint, subscription);
  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ error: "Subscription endpoint is required" });
  }

  subscriptions.delete(endpoint);
  res.status(200).json({ message: "Подписка удалена" });
});

app.post("/snooze", (req, res) => {
  const reminderId = Number(req.query.reminderId);
  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  scheduleReminder(reminderId, reminder.text, Date.now() + newDelay);

  return res.status(200).json({ message: "Reminder snoozed for 5 minutes" });
});

const DEFAULT_PORT = Number(process.env.PORT) || 3001;
const MAX_PORT_ATTEMPTS = 10;

function startServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
  server.removeAllListeners("error");
  server.removeAllListeners("listening");

  server
    .once("error", (error) => {
      if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        startServer(port + 1, attemptsLeft - 1);
        return;
      }

      console.error("Server failed to start:", error);
      process.exit(1);
    })
    .once("listening", () => {
      const protocol = useHttps ? "https" : "http";
      console.log(`Server started at ${protocol}://localhost:${port}`);
    })
    .listen(port);
}

startServer(DEFAULT_PORT);
