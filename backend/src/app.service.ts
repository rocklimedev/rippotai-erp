import { Injectable } from '@nestjs/common';
import * as os from 'os';

export interface ModuleStatus {
  name: string;
  key: string;
  category: string;
  status: 'active';
}

@Injectable()
export class AppService {
  /**
   * ---------------------------------------------------------
   * API ROOT
   * ---------------------------------------------------------
   */
  getHello() {
    return {
      success: true,
      message: 'Rippotai ERP API is running',
      service: 'rippotai-erp-api',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ---------------------------------------------------------
   * GENERAL HEALTH
   * ---------------------------------------------------------
   */
  getHealth() {
    const memory = process.memoryUsage();

    return {
      status: 'ok',

      service: {
        name: 'rippotai-erp-api',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },

      timestamp: new Date().toISOString(),

      uptime: {
        seconds: Math.floor(process.uptime()),
        human: this.formatUptime(process.uptime()),
      },

      process: {
        pid: process.pid,
        nodeVersion: process.version,
      },

      system: {
        platform: process.platform,
        architecture: process.arch,
        hostname: os.hostname(),
        cpuCount: os.cpus().length,
      },

      memory: {
        rss: this.formatBytes(memory.rss),
        heapUsed: this.formatBytes(memory.heapUsed),
        heapTotal: this.formatBytes(memory.heapTotal),
        external: this.formatBytes(memory.external),
      },
    };
  }

  /**
   * ---------------------------------------------------------
   * LIVENESS
   * ---------------------------------------------------------
   *
   * Keep this endpoint extremely lightweight.
   */
  getLiveness() {
    return {
      status: 'alive',
      service: 'rippotai-erp-api',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ---------------------------------------------------------
   * READINESS
   * ---------------------------------------------------------
   *
   * This can later be extended to check:
   *
   * - MySQL
   * - Redis
   * - Elasticsearch
   * - Other required infrastructure
   */
  getReadiness() {
    return {
      status: 'ready',
      service: 'rippotai-erp-api',
      timestamp: new Date().toISOString(),

      dependencies: {
        database: 'configured',
        redis: 'configured',
        elasticsearch: 'configured',
      },
    };
  }

  /**
   * ---------------------------------------------------------
   * SYSTEM INFORMATION
   * ---------------------------------------------------------
   */
  getSystemInfo() {
    return {
      service: 'rippotai-erp-api',

      version: process.env.APP_VERSION || '1.0.0',

      environment: process.env.NODE_ENV || 'development',

      node: {
        version: process.version,
        pid: process.pid,
      },

      system: {
        platform: process.platform,
        architecture: process.arch,
        hostname: os.hostname(),
        cpuCount: os.cpus().length,
      },

      uptime: {
        seconds: Math.floor(process.uptime()),
        human: this.formatUptime(process.uptime()),
      },

      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ---------------------------------------------------------
   * ERP MODULE MONITORING
   * ---------------------------------------------------------
   *
   * This represents modules registered in the application.
   *
   * IMPORTANT:
   * "active" means the module is part of the application.
   * It does NOT yet mean its external dependencies are healthy.
   */
  getModules(): ModuleStatus[] {
    return [
      // Authentication / RBAC
      {
        name: 'Authentication',
        key: 'auth',
        category: 'security',
        status: 'active',
      },
      {
        name: 'Roles & Permissions',
        key: 'rbac',
        category: 'security',
        status: 'active',
      },
      {
        name: 'Applications',
        key: 'apps',
        category: 'security',
        status: 'active',
      },

      // Core
      {
        name: 'Users',
        key: 'users',
        category: 'core',
        status: 'active',
      },
      {
        name: 'Settings',
        key: 'settings',
        category: 'core',
        status: 'active',
      },
      {
        name: 'Projects',
        key: 'projects',
        category: 'core',
        status: 'active',
      },
      {
        name: 'Clients',
        key: 'clients',
        category: 'core',
        status: 'active',
      },
      {
        name: 'Vendors',
        key: 'vendors',
        category: 'core',
        status: 'active',
      },

      // Engagement
      {
        name: 'Activity Logs',
        key: 'activity-logs',
        category: 'engagement',
        status: 'active',
      },
      {
        name: 'Notifications',
        key: 'notifications',
        category: 'engagement',
        status: 'active',
      },

      // BOQ / Quotations
      {
        name: 'Quotations',
        key: 'quotations',
        category: 'commercial',
        status: 'active',
      },
      {
        name: 'Estimates',
        key: 'estimates',
        category: 'commercial',
        status: 'active',
      },
      {
        name: 'BOQ',
        key: 'boq',
        category: 'commercial',
        status: 'active',
      },

      // Meta
      {
        name: 'Units',
        key: 'units',
        category: 'meta',
        status: 'active',
      },
      {
        name: 'Terms',
        key: 'terms',
        category: 'meta',
        status: 'active',
      },

      // Documents
      {
        name: 'Documents',
        key: 'documents',
        category: 'documents',
        status: 'active',
      },
      {
        name: 'Drawings',
        key: 'drawings',
        category: 'documents',
        status: 'active',
      },

      // Project / Site
      {
        name: 'Brief',
        key: 'brief',
        category: 'project',
        status: 'active',
      },
      {
        name: 'Site Recce',
        key: 'site-recce',
        category: 'site',
        status: 'active',
      },
      {
        name: 'Tasks',
        key: 'tasks',
        category: 'project',
        status: 'active',
      },
      {
        name: 'Calendar',
        key: 'calendar',
        category: 'project',
        status: 'active',
      },
      {
        name: 'Dashboards',
        key: 'dashboards',
        category: 'project',
        status: 'active',
      },
      {
        name: 'Leads',
        key: 'leads',
        category: 'crm',
        status: 'active',
      },

      // Procurement / Inventory
      {
        name: 'Purchase Orders',
        key: 'purchase-orders',
        category: 'procurement',
        status: 'active',
      },
      {
        name: 'Site Inventory',
        key: 'site-inventory',
        category: 'inventory',
        status: 'active',
      },
      {
        name: 'Sample Boards',
        key: 'sample-boards',
        category: 'materials',
        status: 'active',
      },
      {
        name: 'Materials',
        key: 'materials',
        category: 'materials',
        status: 'active',
      },

      // Quality
      {
        name: 'Quality Check',
        key: 'quality-check',
        category: 'quality',
        status: 'active',
      },
      {
        name: 'Handover',
        key: 'handover',
        category: 'project',
        status: 'active',
      },

      // Infrastructure
      {
        name: 'CDN',
        key: 'cdn',
        category: 'infrastructure',
        status: 'active',
      },
      {
        name: 'Search',
        key: 'search',
        category: 'infrastructure',
        status: 'active',
      },
      {
        name: 'Process',
        key: 'process',
        category: 'infrastructure',
        status: 'active',
      },

      // Reporting
      {
        name: 'Reports',
        key: 'reports',
        category: 'reporting',
        status: 'active',
      },
    ];
  }

  /**
   * ---------------------------------------------------------
   * SYSTEM SUMMARY
   * ---------------------------------------------------------
   *
   * Useful for dashboards / monitoring services.
   */
  getSystemSummary() {
    const memory = process.memoryUsage();
    const modules = this.getModules();

    const moduleCategories = modules.reduce(
      (result, module) => {
        result[module.category] = (result[module.category] || 0) + 1;

        return result;
      },
      {} as Record<string, number>,
    );

    return {
      status: 'ok',

      service: {
        name: 'rippotai-erp-api',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },

      timestamp: new Date().toISOString(),

      uptime: {
        seconds: Math.floor(process.uptime()),
        human: this.formatUptime(process.uptime()),
      },

      system: {
        hostname: os.hostname(),
        platform: process.platform,
        architecture: process.arch,
        cpuCount: os.cpus().length,
      },

      memory: {
        rss: this.formatBytes(memory.rss),
        heapUsed: this.formatBytes(memory.heapUsed),
        heapTotal: this.formatBytes(memory.heapTotal),
        external: this.formatBytes(memory.external),
      },

      modules: {
        total: modules.length,
        active: modules.filter((module) => module.status === 'active').length,
        categories: moduleCategories,
      },
    };
  }

  /**
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;

    return `${mb.toFixed(2)} MB`;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}
