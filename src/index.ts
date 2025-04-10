import express, { Application, urlencoded } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import routes from "./routes";
import { responseInterceptor } from "./utils/response-interceptor";

class Server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT ?? "9001";
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(urlencoded({ extended: true }));
    this.app.use(responseInterceptor);
  }

  private initializeRoutes(): void {
    this.app.use("/", routes);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.listen();
