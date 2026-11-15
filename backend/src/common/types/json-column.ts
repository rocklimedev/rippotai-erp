import { DataType } from 'sequelize-typescript';

// MariaDB stores JSON as LONGTEXT and returns it as a string through mysql2.
// Column options for a JSON attribute that is parsed on read.
export function jsonColumn(name: string, allowNull = false) {
  return {
    type: DataType.JSON,
    allowNull,
    get(this: { getDataValue(key: string): unknown }): any {
      const value = this.getDataValue(name);
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
  };
}
