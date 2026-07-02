# Engagement Module (Activity Logs & Notifications)

Two related concerns bundled into one NestJS module: an audit trail (`activity-logs`) and user-facing notifications delivered in real time over WebSockets.

Base paths: `/api/v1/activity-logs`, `/api/v1/notifications`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/activity-logs` | `log` | — |
| GET | `/api/v1/activity-logs` | `findAll` | — |
| POST | `/api/v1/notifications` | `create` | — |
| DELETE | `/api/v1/notifications/:id` | `remove` | — |
| PATCH | `/api/v1/notifications/:id/read` | `markAsRead` | — |
| GET | `/api/v1/notifications/user/:userId` | `findAllForUser` | — |
| PATCH | `/api/v1/notifications/user/:userId/read-all` | `markAllAsRead` | — |

## Activity logs

Append-only audit trail. `POST /activity-logs` ("log") records an `ActivityAction` (huge enum — auth events, CRUD on every entity, file operations, finance events reserved for future modules, security events like `unauthorized_access_attempt`). `GET /activity-logs` lists them (page is `adminOnly` on the frontend).

## Notifications

- Standard CRUD-ish REST endpoints (`create`, list-for-user, mark read / read-all, delete) back the notification bell/list UI.
- **Real-time delivery** happens outside this controller, via `common/gateway/notification.gateway.ts` (Socket.IO) and `NotificationBroadcastService` — when a notification-worthy event happens elsewhere in the backend (e.g. a quotation is approved), that service pushes the event live to the relevant connected user(s) over the `/notifications` socket namespace. The frontend connects via `lib/socket.js` (`io(`${API_URL}/notifications`, { auth: { userId } })`).

## Data models

#### `ActivityLog` (table: `activity_logs`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `user_id` | `user_id` | DataType.CHAR(36) | yes | — | FK |
| `user_email` | `user_email` | DataType.STRING(255) | no | — | — |
| `user_role` | `user_role` | DataType.STRING(50) | no | — | — |
| `action` | `action` | DataType.ENUM(...Object.values(ActivityAction) | no | — | — |
| `entity_type` | `entity_type` | DataType.STRING(50) | yes | — | — |
| `entity_id` | `entity_id` | DataType.CHAR(36) | yes | — | — |
| `entity_label` | `entity_label` | DataType.STRING(255) | yes | — | — |
| `changes` | `changes` | DataType.JSON | yes | — | — |
| `ip_address` | `ip_address` | DataType.STRING(45) | yes | — | — |
| `user_agent` | `user_agent` | DataType.TEXT | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `user` | BelongsTo | `User` |

#### `Notification` (table: `notifications`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `user_id` | `user_id` | DataType.CHAR(36) | no | — | FK |
| `type` | `type` | DataType.ENUM(...Object.values(NotificationType) | no | — | — |
| `title` | `title` | DataType.STRING(255) | no | — | — |
| `message` | `message` | DataType.TEXT | no | — | — |
| `entity_type` | `entity_type` | DataType.STRING(50) | yes | — | — |
| `entity_id` | `entity_id` | DataType.CHAR(36) | yes | — | — |
| `is_read` | `is_read` | DataType.TINYINT | no | 0 | — |
| `read_at` | `read_at` | DataType.DATE | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `user` | BelongsTo | `User` |


## Enums

- `NotificationType`: mirrors most of `ActivityAction` but scoped to what's user-facing (quotation/project/vendor/user/purchase-order lifecycle events, plus generic `system`, `reminder`, `announcement`).
- `ActivityAction`: much larger — includes reserved-for-future finance actions (`invoice_created`, `payment_received`, etc.), suggesting the ERP is scoped to grow beyond vendor quotes.
