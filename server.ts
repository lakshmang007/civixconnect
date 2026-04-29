import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Simulation for Escalation (Feature 3)
  app.post("/api/escalate", (req, res) => {
    const { issueId, summary, authorityName } = req.body;
    const targetEmail = "studylucky4@gmail.com";
    console.log(`\n--- NEW EMAIL OUTBOUND ---`);
    console.log(`To: ${targetEmail}`);
    console.log(`Subject: Escalation for Issue #${issueId}`);
    console.log(`Body: Hello ${authorityName}, the community has supported this issue. Summary: ${summary}`);
    console.log(`--------------------------\n`);
    res.json({ success: true, timestamp: new Date().toISOString(), sentTo: targetEmail, type: 'ESCALATION' });
  });

  // Chatbot Notification Endpoint
  app.post("/api/notify-monitor", (req, res) => {
    const { userName, location, action } = req.body;
    const targetEmail = "studylucky4@gmail.com";
    console.log(`\n--- NEW EMAIL OUTBOUND ---`);
    console.log(`To: ${targetEmail}`);
    console.log(`Subject: Activity Alert: ${userName}`);
    console.log(`Body: User ${userName} from ${location} performed ${action}`);
    console.log(`--------------------------\n`);
    res.json({ success: true, sentTo: targetEmail, type: 'CHATBOT' });
  });

  // New Issue Submission Notification
  app.post("/api/notify-submission", (req, res) => {
    const { title, userName, category, zipCode } = req.body;
    const targetEmail = "studylucky4@gmail.com";
    console.log(`\n--- NEW EMAIL OUTBOUND ---`);
    console.log(`To: ${targetEmail}`);
    console.log(`Subject: New Report Submission`);
    console.log(`Body: ${userName} reported "${title}" in ${zipCode}`);
    console.log(`--------------------------\n`);
    res.json({ success: true, sentTo: targetEmail, type: 'SUBMISSION' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
