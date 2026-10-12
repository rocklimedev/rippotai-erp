# Connect local Tasks and Calendar to Zoho

Local tasks and calendar events remain the source. Enabled connections send changes to Zoho every minute while the backend is running. Changes made in Zoho are not imported.

## Setup

1. Open Tasks and click **Connect Zoho** (or **Set up Zoho sync**).
2. Approve the Zoho consent screen. Return to the app and click **Refresh connection**.
3. Choose your Zoho portal, project and your active Zoho user. Optionally enter a task list ID. Choose whether to include tasks without due dates.
4. Check **Automatic sync**, save settings, then click **Sync now** for the first sync.
5. Open Calendar and use its Zoho sync button. Reconnect to approve calendar permissions if required, refresh, select a personal Zoho calendar and reminder interval, then enable and save.

Tasks sync when assigned to you, or when unassigned and created by you. Calendar sync includes events you created. Each signed-in person configures their own connection. You need the corresponding local app's update permission to manage sync.

## Day-to-day use

Create, edit, complete or remove work in the local apps. Tasks sync to Zoho Projects and events to Zoho Calendar. Task detail shows sync state and offers **Sync this item**. The Calendar event details show sync state. Task deadlines use the Tasks connection; generated feed entries such as payment dues and milestones are excluded from the Calendar connection.

New task setups include undated tasks by default. Existing connections retain their previous due-date-only selection until changed. Undated tasks have no due-date reminder. Crucial Work references and reasons appear in Zoho task descriptions. Keep the Zoho project timezone aligned with your selected timezone.

Use the sync panel to review failures or retry. If creation is uncertain after a timeout, inspect Zoho and link the existing remote ID using the reconciliation form to prevent duplicates. Pausing sync leaves existing remote items in place. A destination with mapped remote items cannot be changed directly.

## Deployment and validation

The existing reminder tables require `backend/migrations/20261005_zoho_reminder_sync.sql` if it has not already been applied. This enhancement adds no schema migration. OAuth client configuration must already be configured for the deployment. Account consent and live synchronization require a real Zoho account; automated tests do not perform them.

Project-user discovery uses the [Zoho Projects users API](https://www.zoho.com/projects/help/rest-api/users-api.html). Updating an undated task uses the date-clearing field documented in the [Zoho Projects tasks API](https://www.zoho.com/projects/help/rest-api/tasks-api.html).
