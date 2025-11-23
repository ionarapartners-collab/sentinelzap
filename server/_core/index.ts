import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebhooks } from "../webhooks";
import restApiRouter from "../rest-api";
import { initializeScheduler } from "../scheduler";
import { restoreSessions } from "../restore-sessions";

const app = express();
const server = createServer(app);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// REST API for Make.com integration
app.use("/api/v1", restApiRouter);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// development mode uses Vite, production mode uses static files
if (process.env.NODE_ENV === "development") {
  // NOTE: This part is for local development only and will be ignored by Vercel
  // when deploying as a serverless function.
  setupVite(app, server).then(() => {
    const preferredPort = parseInt(process.env.PORT || "3000");
    findAvailablePort(preferredPort).then(port => {
      if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
      }
      server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/`);
        initializeWebhooks();
        initializeScheduler();
        setTimeout(() => {
          console.log('[Server] 🔄 Starting session restore...');
          restoreSessions().catch(console.error);
        }, 5000);
      });
    });
  });
} else {
  // Production: Serve static files from the client build
  serveStatic(app);
}

// Export the Express app handler for Vercel Serverless Function
// This is the CRITICAL change to make it work on Vercel
export default app;

// Helper functions for local development only
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
