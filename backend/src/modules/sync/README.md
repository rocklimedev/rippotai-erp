# Zoho reminder mirror

The ERP database owns tasks and calendar events. Zoho Projects and Zoho Calendar deliver reminders. Remote edits are not imported. Enable each mirror from its native frontend page after connecting Zoho.

Apply `backend/migrations/20261005_zoho_reminder_sync.sql` before starting the backend. Schema synchronization is disabled. Required OAuth permissions: ZohoProjects.tasks.ALL, ZohoProjects.portals.READ, ZohoProjects.projects.READ, ZohoCalendar.calendar.READ, ZohoCalendar.event.ALL. Reconnect if the stored token lacks these scopes.

Tasks with due dates are mirrored for their assignee, or creator when unassigned. Supply that person's Zoho Projects user ID; local UUIDs are not Zoho IDs. Task reminders use the selected time on their due date, in the Zoho project timezone (keep this aligned with the selected timezone). Calendar mirrors include events created by the connected user, with email and popup reminders. Generated calendar-feed items such as payment dues and milestones are not persisted calendar events and are excluded.

Automatic sync checks once per minute while the backend is running; failed records are retried on subsequent checks. Database leases prevent simultaneous runs for the same owner and entity type. Changes are fingerprinted. Local deletion, task reassignment or removal of a due date removes only the previously mapped remote reminder. Disabling sync pauses updates and leaves existing remote reminders active. Destinations cannot change while remote reminders or uncertain creations exist; definitively rejected creates can use a corrected destination.

Calendar settings select a personal calendar from `GET /api/v1/sync/calendar/destinations`, using Zoho's `uid` field (not `id` or the account/user ID). The backend checks that the selected UID belongs to the connected account before saving or syncing. Save the corrected calendar then retry failed records; their destination is updated without changing local events.

Create attempts are marked uncertain before making the remote call. A timeout or process failure cannot cause a blind duplicate creation on the next run. Inspect Zoho and link the existing remote ID using the frontend reconciliation form. If the request never reached Zoho, create the corresponding reminder in Zoho and link it. A mapped reminder confirmed missing with HTTP 404 is recreated on the next run. No live account verification or migration execution is performed by the implementation tests.

Endpoints under `/api/v1/sync`: `GET|PUT :kind/settings`, `GET :kind/status`, `POST :kind/push`, `POST :kind/full`, `POST :kind/reconcile/:localId`. Kind is `tasks` or `calendar`. `full` retains local-to-Zoho direction. `pull` rejects requests explicitly. All endpoints use the authenticated user; no client owner ID is accepted.
