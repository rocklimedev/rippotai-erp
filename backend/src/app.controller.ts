import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * API root
   */
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  /**
   * General application health
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  /**
   * Lightweight liveness check.
   *
   * Used by Docker, Kubernetes, load balancers,
   * uptime monitoring, etc.
   */
  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  /**
   * Readiness check.
   *
   * Indicates whether the API is ready to receive traffic.
   */
  @Get('health/ready')
  getReadiness() {
    return this.appService.getReadiness();
  }

  /**
   * Runtime / system information
   */
  @Get('system/info')
  getSystemInfo() {
    return this.appService.getSystemInfo();
  }

  /**
   * ERP module monitoring
   */
  @Get('system/modules')
  getModules() {
    return this.appService.getModules();
  }

  /**
   * Complete monitoring summary
   */
  @Get('system/summary')
  getSystemSummary() {
    return this.appService.getSystemSummary();
  }
}
