import { registerAs } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

export default registerAs(
  'database',
  (): SequelizeModuleOptions => ({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'spsyn8lm_rippotai_erp',
    autoLoadModels: true,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    define: {
      timestamps: true,
      underscored: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 3000, // release connections well before the host's 10s wait_timeout
      evict: 1000, // check for idle connections every second
    },
    dialectOptions: {
      connectTimeout: 20000,
    },
    retry: {
      max: 3,
      match: [
        /PROTOCOL_CONNECTION_LOST/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
      ],
    },
  }),
);
