import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security: Validation Schemas
const EscalationSchema = z.object({
  issueId: z.string().min(1),
  summary: z.string().min(5),
  authorityName: z.string().min(1),
});

const NotifyMonitorSchema = z.object({
  userName: z.string().min(1),
  location: z.string().optional(),
  action: z.string().min(1),
});

const NotifySubmissionSchema = z.object({
  title: z.string().min(1),
  userName: z.string().min(1),
  category: z.string().optional(),
  zipCode: z.string().length(6).regex(/^\d+$/),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middleware
  app.use(express.json({ limit: '10kb' })); 
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Mock Rate Limiting
  const rateLimitMap = new Map<string, { count: number, reset: number }>();
  app.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const limitData = rateLimitMap.get(ip);
    
    if (limitData && now < limitData.reset) {
      if (limitData.count > 100) return res.status(429).json({ error: "Too many requests" });
      limitData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, reset: now + 60000 });
    }
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Simulation for Escalation (Feature 3)
  app.post("/api/escalate", (req, res) => {
    try {
      const { issueId, summary, authorityName } = EscalationSchema.parse(req.body);
      const targetEmail = "studylucky4@gmail.com";
      console.log(`\n--- NEW EMAIL OUTBOUND ---`);
      console.log(`To: ${targetEmail}`);
      console.log(`Subject: Escalation for Issue #${issueId}`);
      console.log(`Body: Hello ${authorityName}, the community has supported this issue. Summary: ${summary}`);
      console.log(`--------------------------\n`);
      res.json({ success: true, timestamp: new Date().toISOString(), sentTo: targetEmail, type: 'ESCALATION' });
    } catch (error) {
      res.status(400).json({ error: "Invalid request payload" });
    }
  });

  // Chatbot Notification Endpoint
  app.post("/api/notify-monitor", (req, res) => {
    try {
      const { userName, location, action } = NotifyMonitorSchema.parse(req.body);
      const targetEmail = "studylucky4@gmail.com";
      console.log(`\n--- NEW EMAIL OUTBOUND ---`);
      console.log(`To: ${targetEmail}`);
      console.log(`Subject: Activity Alert: ${userName}`);
      console.log(`Body: User ${userName} from ${location} performed ${action}`);
      console.log(`--------------------------\n`);
      res.json({ success: true, sentTo: targetEmail, type: 'CHATBOT' });
    } catch (error) {
      res.status(400).json({ error: "Invalid request payload" });
    }
  });

  // New Issue Submission Notification
  app.post("/api/notify-submission", (req, res) => {
    try {
      const { title, userName, zipCode } = NotifySubmissionSchema.parse(req.body);
      const targetEmail = "studylucky4@gmail.com";
      console.log(`\n--- NEW EMAIL OUTBOUND ---`);
      console.log(`To: ${targetEmail}`);
      console.log(`Subject: New Report Submission`);
      console.log(`Body: ${userName} reported "${title}" in ${zipCode}`);
      console.log(`--------------------------\n`);
      res.json({ success: true, sentTo: targetEmail, type: 'SUBMISSION' });
    } catch (error) {
      res.status(400).json({ error: "Invalid request payload" });
    }
  });

  // Security: Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
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
