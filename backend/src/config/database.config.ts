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
  }),
);
