import http from "http";
import app from "./app.js";
import { initializeSocket } from "./websocket/socket.js";
import { startOverdueTaskJob } from "./jobs/overdueTasks.js";
const PORT = 5000;

const httpServer = http.createServer(app);

initializeSocket(httpServer);
startOverdueTaskJob();

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});