import express, { Express, Request, Response } from 'express';
import cors from "cors";
import hpp from "hpp";
import helmet from "helmet";
import { xss } from "express-xss-sanitizer";
import "./database/Models/relations"
import "./src/events/accounting.listeners";
import "./src/events/notification.listeners";
import { bootstrap } from './src/modules/bootstrap';
import { dataBase, sequelize } from './database/db.connection';
import { errorHandling } from './src/middleware/globalErrorHandler';
import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_KEY) {
    console.error("❌ CRITICAL ERROR: JWT_KEY is not defined in .env file");
    process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL is not defined in .env file");
    process.exit(1);
}
const app: Express = express();
const PORT = Number(process.env.PORT) || 5000;

// Middlewares
app.use(express.json());
app.use(cors()); 
app.use(hpp());
app.use(helmet());
app.use(xss());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  const health: Record<string, any> = {
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    await sequelize.authenticate();
    health.services.database = { status: "UP" };
  } catch (err) {
    health.services.database = { status: "DOWN", error: String(err) };
    health.status = "DEGRADED";
  }

  health.services.email = {
    status:
      process.env.EMAIL_USER && process.env.EMAIL_PASS
        ? "CONFIGURED"
        : "NOT_CONFIGURED",
  };

  const httpStatus = health.status === "UP" ? 200 : 503;
  return res.status(httpStatus).json(health);
});

const startListening = (app: Express, port: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.log(`🔄 [Server] Attempting to listen on port ${port}...`);
        const server = app.listen(port, () => {
            console.log(`🚀 [Server] Server is running and listening on port ${port}`);
            resolve();
        });
        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                console.warn(`⚠️ [Server] Port ${port} is occupied.`);
                const nextPort = port + 1;
                console.log(`🔄 [Server] Retrying on fallback port ${nextPort}...`);
                startListening(app, nextPort).then(resolve).catch(reject);
            } else {
                console.error(`❌ [Server] Server error on port ${port}:`, error);
                reject(error);
            }
        });
    });
};

const startServer = async () => {
    try {
        console.log("🔄 [Startup] Starting server initialization sequence...");

        // 1. Database Connection
        console.log("🔄 [Startup] Connecting to database...");
        await dataBase.connectionDB(); 
        console.log("✅ [Startup] Database connection and sync completed.");

        // 2. Bootstrap (Routes registration)
        console.log("🔄 [Startup] Registering bootstrap routes...");
        bootstrap.mainBootstrap(app);
        console.log("✅ [Startup] Bootstrap routes registered successfully.");

        // 3. Error Handler Registration
        console.log("🔄 [Startup] Registering global error handler middleware...");
        app.use(errorHandling.handleError);
        console.log("✅ [Startup] Global error handler registered.");

        // 4. App Listen (with Port Occupied Fallback)
        console.log("🔄 [Startup] Starting HTTP listener...");
        await startListening(app, PORT as number);
        console.log("🚀 [Startup] Application started successfully!");

    } catch (error) {
        console.error('❌ [Startup] Failed to start server:', error);
        process.exit(1);
    }
};

startServer();