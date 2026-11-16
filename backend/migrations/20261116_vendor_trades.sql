-- Shared vendor trade catalogue. Seed once without replacing user-created trades.
CREATE TABLE IF NOT EXISTS vendor_trades (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1000,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_vendor_trade_name (normalized_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vendor_trades (id, name, normalized_name, sort_order, created_at, updated_at) VALUES
(UUID(), 'Site Preparation', 'site preparation', 1, NOW(), NOW()),
(UUID(), 'Civil Works', 'civil works', 2, NOW(), NOW()),
(UUID(), 'Adhesive', 'adhesive', 3, NOW(), NOW()),
(UUID(), 'Flooring & Stone', 'flooring & stone', 4, NOW(), NOW()),
(UUID(), 'Flooring & Stone Labour', 'flooring & stone labour', 5, NOW(), NOW()),
(UUID(), 'False Ceiling', 'false ceiling', 6, NOW(), NOW()),
(UUID(), 'Carpentry', 'carpentry', 7, NOW(), NOW()),
(UUID(), 'Glass & WINDOW Upvc', 'glass & window upvc', 8, NOW(), NOW()),
(UUID(), 'Glass & WINDOW', 'glass & window', 9, NOW(), NOW()),
(UUID(), 'Electrical', 'electrical', 10, NOW(), NOW()),
(UUID(), 'Electrical Labour', 'electrical labour', 11, NOW(), NOW()),
(UUID(), 'Plumbing', 'plumbing', 12, NOW(), NOW()),
(UUID(), 'Plumbing labour', 'plumbing labour', 13, NOW(), NOW()),
(UUID(), 'HVAC', 'hvac', 14, NOW(), NOW()),
(UUID(), 'Metal Work', 'metal work', 15, NOW(), NOW()),
(UUID(), 'Painting Labour', 'painting labour', 16, NOW(), NOW()),
(UUID(), 'Texture Paints', 'texture paints', 17, NOW(), NOW()),
(UUID(), 'Site Overheads', 'site overheads', 18, NOW(), NOW()),
(UUID(), 'SANITARY', 'sanitary', 19, NOW(), NOW()),
(UUID(), 'Kitchen & Wardobe (2)', 'kitchen & wardobe', 20, NOW(), NOW()),
(UUID(), 'dresser & Console etc', 'dresser & console etc', 21, NOW(), NOW()),
(UUID(), 'Tv Panel', 'tv panel', 22, NOW(), NOW()),
(UUID(), 'Vanity & Others', 'vanity & others', 23, NOW(), NOW()),
(UUID(), 'Doors', 'doors', 24, NOW(), NOW()),
(UUID(), 'Lighting', 'lighting', 25, NOW(), NOW()),
(UUID(), 'Ac', 'ac', 26, NOW(), NOW())
ON DUPLICATE KEY UPDATE normalized_name = VALUES(normalized_name);
