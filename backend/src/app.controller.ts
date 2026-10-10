import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Public } from '@/common/decorator/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * API root
   */
  @RequirePermission('system:read')
  @Get()
  getHello() {
    return this.appService.getHello();
  }

  /**
   * General application health
   */
  @RequirePermission('system:read')
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
  @RequirePermission('system:read')
  @Public()
  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  /**
   * Readiness check.
   *
   * Indicates whether the API is ready to receive traffic.
   */
  @RequirePermission('system:read')
  @Public()
  @Get('health/ready')
  getReadiness() {
    return this.appService.getReadiness();
  }

  /**
   * Runtime / system information
   */
  @RequirePermission('system:read')
  @Get('system/info')
  getSystemInfo() {
    return this.appService.getSystemInfo();
  }

  /**
   * ERP module monitoring
   */
  @RequirePermission('system:read')
  @Get('system/modules')
  getModules() {
    return this.appService.getModules();
  }

  /**
   * Complete monitoring summary
   */
  @RequirePermission('system:read')
  @Get('system/summary')
  getSystemSummary() {
    return this.appService.getSystemSummary();
  }
}
