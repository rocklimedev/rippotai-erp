import { baseApi } from "../../store/baseApi";

// ============================================================
// OWNER KEY
// ============================================================

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

// ============================================================
// URL HELPERS
// ============================================================

const getOwnerUrl = (path = "") => {
  const ownerKey = getOwnerKey();

  if (!ownerKey) {
    return null;
  }

  return `/zoho/projects/${encodeURIComponent(ownerKey)}${path}`;
};

const invalidOwnerUrl = "/zoho/projects/invalid-owner";

// ============================================================
// SAFE RESPONSE HELPERS
// ============================================================

const extractRecords = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  const keys = [
    "data",
    "portals",
    "projects",
    "tasklists",
    "tasks",
    "subtasks",
    "items",
    "results",
    "records",
  ];

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    for (const key of keys) {
      if (Array.isArray(response.data?.[key])) {
        return response.data[key];
      }
    }
  }

  return [];
};

const extractSingle = (response, keys = []) => {
  if (!response) {
    return null;
  }

  for (const key of keys) {
    if (response?.[key]) {
      return response[key];
    }
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    for (const key of keys) {
      if (response.data?.[key]) {
        return response.data[key];
      }
    }
  }

  return response?.data ?? response;
};

// ============================================================
// FIELD HELPERS
// ============================================================

/**
 * V3 returns status as a nested object:
 *   { id, name: "Open", color: "#...", is_closed_type: false }
 * V2 returned a flat string (status_name/statusName).
 * This normalizes either shape down to a plain string.
 */
const extractStatusName = (rawStatus, fallback) => {
  if (rawStatus && typeof rawStatus === "object") {
    return rawStatus.name ?? fallback;
  }

  return rawStatus ?? fallback;
};

// ============================================================
// NORMALIZERS
// ============================================================

const normalizePortal = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  const id =
    record.id ?? record.portal_id ?? record.portalId ?? `portal-${index}`;

  const name =
    record.name ??
    record.portal_name ??
    record.portalName ??
    record.title ??
    `Portal ${index + 1}`;

  return {
    ...record,
    id: String(id),
    name: String(name),
  };
};

const normalizeProject = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  // Prefer id_string: numeric id is unsafe above MAX_SAFE_INTEGER
  const id =
    record.id_string ??
    record.project_id ??
    record.projectId ??
    (typeof record.id === "string" ? record.id : null) ??
    `project-${index}`;

  const name =
    record.name ??
    record.project_name ??
    record.projectName ??
    record.title ??
    "Untitled Project";

  return {
    ...record,
    id: String(id),
    name: String(name),
    title: String(record.title ?? name),
  };
};

const normalizeTasklist = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  const id =
    record.id ?? record.tasklist_id ?? record.tasklistId ?? `tasklist-${index}`;

  const name =
    record.name ??
    record.tasklist_name ??
    record.tasklistName ??
    record.title ??
    "Untitled Tasklist";

  return {
    ...record,
    id: String(id),
    name: String(name),
    title: String(record.title ?? name),
  };
};

const normalizeTask = (record = {}, index = 0) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  const id = record.id ?? record.task_id ?? record.taskId ?? `task-${index}`;

  const title =
    record.title ??
    record.task_name ??
    record.taskName ??
    record.name ??
    "Untitled Task";

  // V3: record.status may be { id, name, color, is_closed_type }.
  // V2: record.status / status_name / statusName were flat strings.
  const status = extractStatusName(
    record.status ?? record.status_name ?? record.statusName,
    "todo",
  );

  const priority =
    record.priority ?? record.priority_name ?? record.priorityName ?? "medium";

  const dueDate =
    record.due_date ??
    record.dueDate ??
    record.due_time ??
    record.dueTime ??
    record.due ??
    null;

  const project =
    record.project ?? record.project_details ?? record.projectDetails ?? null;

  const tasklist =
    record.tasklist ?? record.task_list ?? record.taskList ?? null;

  const projectId =
    project?.id ?? record.project_id ?? record.projectId ?? null;

  const projectName =
    project?.name ??
    project?.title ??
    record.project_name ??
    record.projectName ??
    "General";

  const tasklistId =
    tasklist?.id ?? record.tasklist_id ?? record.tasklistId ?? null;

  const tasklistName =
    tasklist?.name ??
    tasklist?.title ??
    record.tasklist_name ??
    record.tasklistName ??
    null;

  const orderIndex =
    Number(
      record.order_index ??
        record.orderIndex ??
        record.sort_order ??
        record.sortOrder ??
        0,
    ) || 0;

  return {
    ...record,

    id: String(id),
    title: String(title),
    status: String(status),
    priority: String(priority),

    due_date: dueDate,
    dueDate,

    project: project
      ? {
          ...project,
          id: project.id ? String(project.id) : project.id,
          name: projectName,
        }
      : projectId
        ? {
            id: String(projectId),
            name: String(projectName),
          }
        : null,

    project_id: projectId ? String(projectId) : null,
    project_name: String(projectName),

    tasklist: tasklist
      ? {
          ...tasklist,
          id: tasklist.id ? String(tasklist.id) : tasklist.id,
          name: tasklistName,
        }
      : tasklistId
        ? {
            id: String(tasklistId),
            name: String(tasklistName ?? ""),
          }
        : null,

    tasklist_id: tasklistId ? String(tasklistId) : null,
    tasklist_name: tasklistName,

    order_index: orderIndex,
  };
};

const normalizeRecords = (response, normalizer) => {
  return extractRecords(response)
    .map((record, index) => normalizer(record, index))
    .filter(Boolean);
};

// ============================================================
// API
// ============================================================

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================
    // PORTALS
    // GET /zoho/projects/:ownerKey/portals
    // ========================================================

    getZohoPortals: builder.query({
      query: () => {
        const url = getOwnerUrl("/portals");

        return {
          url: url || `${invalidOwnerUrl}/portals`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizePortal);
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map((portal) => ({
                type: "ZohoPortals",
                id: portal.id,
              })),
              {
                type: "ZohoPortals",
                id: "LIST",
              },
            ]
          : [
              {
                type: "ZohoPortals",
                id: "LIST",
              },
            ],
    }),

    // ========================================================
    // PROJECTS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects
    // ========================================================

    getZohoProjects: builder.query({
      query: ({ portalId, ...params }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(portalId)}/projects`,
        );

        return {
          url: url || `${invalidOwnerUrl}/portals/projects`,
          method: "GET",
          params,
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizeProject);
      },

      providesTags: (result, error, { portalId }) =>
        result
          ? [
              ...result.map((project) => ({
                type: "ZohoProjects",
                id: project.id,
              })),
              {
                type: "ZohoProjects",
                id: `PORTAL_${portalId}`,
              },
            ]
          : [
              {
                type: "ZohoProjects",
                id: `PORTAL_${portalId}`,
              },
            ],
    }),

    // ========================================================
    // SINGLE PROJECT
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
    // ========================================================

    getZohoProject: builder.query({
      query: ({ portalId, projectId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/projects/invalid`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return normalizeProject(extractSingle(response, ["project"]));
      },

      providesTags: (result, error, { projectId }) => [
        {
          type: "ZohoProjects",
          id: projectId,
        },
      ],
    }),

    // ========================================================
    // CREATE PROJECT
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects
    // ========================================================

    createZohoProject: builder.mutation({
      query: ({ portalId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(portalId)}/projects`,
        );

        return {
          url: url || `${invalidOwnerUrl}/projects`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { portalId }) => [
        {
          type: "ZohoProjects",
          id: `PORTAL_${portalId}`,
        },
      ],
    }),

    // ========================================================
    // UPDATE PROJECT
    // PATCH /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
    // (was PUT — matches controller's switch to @Patch for partial updates)
    // ========================================================

    updateZohoProject: builder.mutation({
      query: ({ portalId, projectId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/projects/invalid`,
          method: "PATCH",
          body,
        };
      },

      invalidatesTags: (result, error, { portalId, projectId }) => [
        {
          type: "ZohoProjects",
          id: projectId,
        },
        {
          type: "ZohoProjects",
          id: `PORTAL_${portalId}`,
        },
      ],
    }),

    // ========================================================
    // DELETE PROJECT
    // DELETE /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId
    // ========================================================

    deleteZohoProject: builder.mutation({
      query: ({ portalId, projectId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/projects/invalid`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, { portalId, projectId }) => [
        {
          type: "ZohoProjects",
          id: projectId,
        },
        {
          type: "ZohoProjects",
          id: `PORTAL_${portalId}`,
        },
      ],
    }),

    // ========================================================
    // TASKLISTS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists
    // ========================================================

    getZohoTasklists: builder.query({
      query: ({ portalId, projectId, ...params }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasklists`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasklists`,
          method: "GET",
          params,
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizeTasklist);
      },

      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result.map((tasklist) => ({
                type: "ZohoTasklists",
                id: tasklist.id,
              })),
              {
                type: "ZohoTasklists",
                id: `PROJECT_${projectId}`,
              },
            ]
          : [
              {
                type: "ZohoTasklists",
                id: `PROJECT_${projectId}`,
              },
            ],
    }),

    // ========================================================
    // CREATE TASKLIST
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists
    // ========================================================

    createZohoTasklist: builder.mutation({
      query: ({ portalId, projectId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasklists`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasklists`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "ZohoTasklists",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // UPDATE TASKLIST
    // PATCH /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId
    // (was PUT)
    // ========================================================

    updateZohoTasklist: builder.mutation({
      query: ({ portalId, projectId, tasklistId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasklists/${encodeURIComponent(tasklistId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasklists/invalid`,
          method: "PATCH",
          body,
        };
      },

      invalidatesTags: (result, error, { projectId, tasklistId }) => [
        {
          type: "ZohoTasklists",
          id: tasklistId,
        },
        {
          type: "ZohoTasklists",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // DELETE TASKLIST
    // DELETE /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId
    // ========================================================

    deleteZohoTasklist: builder.mutation({
      query: ({ portalId, projectId, tasklistId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasklists/${encodeURIComponent(tasklistId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasklists/invalid`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, { projectId, tasklistId }) => [
        {
          type: "ZohoTasklists",
          id: tasklistId,
        },
        {
          type: "ZohoTasklists",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // TASKLIST TASKS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklists/:tasklistId/tasks
    // ========================================================

    getZohoTasklistTasks: builder.query({
      query: ({ portalId, projectId, tasklistId, ...params }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasklists/${encodeURIComponent(tasklistId)}/tasks`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks`,
          method: "GET",
          params,
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizeTask);
      },

      providesTags: (result, error, { tasklistId }) =>
        result
          ? [
              ...result.map((task) => ({
                type: "ZohoTasks",
                id: task.id,
              })),
              {
                type: "ZohoTasklistTasks",
                id: tasklistId,
              },
            ]
          : [
              {
                type: "ZohoTasklistTasks",
                id: tasklistId,
              },
            ],
    }),

    // ========================================================
    // ALL PROJECT TASKS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks
    // ========================================================

    getZohoTasks: builder.query({
      query: ({ portalId, projectId, ...params }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasks`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks`,
          method: "GET",
          params,
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizeTask);
      },

      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result.map((task) => ({
                type: "ZohoTasks",
                id: task.id,
              })),
              {
                type: "ZohoTasks",
                id: `PROJECT_${projectId}`,
              },
            ]
          : [
              {
                type: "ZohoTasks",
                id: `PROJECT_${projectId}`,
              },
            ],
    }),

    // ========================================================
    // SINGLE TASK
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
    // ========================================================

    getZohoTask: builder.query({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return normalizeTask(extractSingle(response, ["task"]));
      },

      providesTags: (result, error, { taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
      ],
    }),

    // ========================================================
    // CREATE TASK
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks
    // ========================================================

    createZohoTask: builder.mutation({
      query: ({ portalId, projectId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasks`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { projectId }) => [
        {
          type: "ZohoTasks",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // UPDATE TASK
    // PATCH /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
    // (was PUT — V3's Zoho-side task update endpoint is PATCH, and this
    // route now matches that verb through to the controller)
    // ========================================================

    updateZohoTask: builder.mutation({
      query: ({ portalId, projectId, taskId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid`,
          method: "PATCH",
          body,
        };
      },

      invalidatesTags: (result, error, { projectId, taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
        {
          type: "ZohoTasks",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // DELETE TASK
    // DELETE /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId
    // ========================================================

    deleteZohoTask: builder.mutation({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, { projectId, taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
        {
          type: "ZohoTasks",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // REORDER TASK
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/reorder
    // ⚠️ Not confirmed against V3 docs — see zoho-tasks.service.ts caveat.
    // ========================================================

    reorderZohoTask: builder.mutation({
      query: ({ portalId, projectId, taskId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/reorder`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid/reorder`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { projectId, taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
        {
          type: "ZohoTasks",
          id: `PROJECT_${projectId}`,
        },
      ],
    }),

    // ========================================================
    // TASK ACTIVITIES
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/activities
    // ⚠️ Not confirmed against V3 docs.
    // ========================================================

    getZohoTaskActivities: builder.query({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/activities`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid/activities`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return extractRecords(response);
      },

      providesTags: (result, error, { taskId }) => [
        {
          type: "ZohoTaskActivities",
          id: taskId,
        },
      ],
    }),

    // ========================================================
    // FOLLOW TASK
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/follow
    // ⚠️ Not confirmed against V3 docs.
    // ========================================================

    followZohoTask: builder.mutation({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/follow`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid/follow`,
          method: "POST",
          body: {},
        };
      },

      invalidatesTags: (result, error, { taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
      ],
    }),

    // ========================================================
    // UNFOLLOW TASK
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/unfollow
    // ⚠️ Not confirmed against V3 docs.
    // ========================================================

    unfollowZohoTask: builder.mutation({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/unfollow`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks/invalid/unfollow`,
          method: "POST",
          body: {},
        };
      },

      invalidatesTags: (result, error, { taskId }) => [
        {
          type: "ZohoTasks",
          id: taskId,
        },
      ],
    }),

    // ========================================================
    // SUBTASKS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks
    // ========================================================

    getZohoSubtasks: builder.query({
      query: ({ portalId, projectId, taskId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/subtasks`,
        );

        return {
          url: url || `${invalidOwnerUrl}/subtasks`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return normalizeRecords(response, normalizeTask);
      },

      providesTags: (result, error, { taskId }) =>
        result
          ? [
              ...result.map((task) => ({
                type: "ZohoTasks",
                id: task.id,
              })),
              {
                type: "ZohoSubtasks",
                id: taskId,
              },
            ]
          : [
              {
                type: "ZohoSubtasks",
                id: taskId,
              },
            ],
    }),

    // ========================================================
    // CREATE SUBTASK
    // POST /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks/:taskId/subtasks
    // ========================================================

    createZohoSubtask: builder.mutation({
      query: ({ portalId, projectId, taskId, ...body }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(
            projectId,
          )}/tasks/${encodeURIComponent(taskId)}/subtasks`,
        );

        return {
          url: url || `${invalidOwnerUrl}/subtasks`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { taskId }) => [
        {
          type: "ZohoSubtasks",
          id: taskId,
        },
        {
          type: "ZohoTasks",
          id: taskId,
        },
      ],
    }),

    // ========================================================
    // TASK LAYOUTS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasklayouts
    // ⚠️ Not confirmed against V3 docs.
    // ========================================================

    getZohoTaskLayouts: builder.query({
      query: ({ portalId, projectId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasklayouts`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasklayouts`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return extractRecords(response);
      },

      providesTags: (result, error, { projectId }) => [
        {
          type: "ZohoTaskLayouts",
          id: projectId,
        },
      ],
    }),

    // ========================================================
    // TASK VIEWS
    // GET /zoho/projects/:ownerKey/portals/:portalId/projects/:projectId/tasks-views
    // ⚠️ Not confirmed against V3 docs.
    // ========================================================

    getZohoTaskViews: builder.query({
      query: ({ portalId, projectId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(
            portalId,
          )}/projects/${encodeURIComponent(projectId)}/tasks-views`,
        );

        return {
          url: url || `${invalidOwnerUrl}/tasks-views`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return extractRecords(response);
      },

      providesTags: (result, error, { projectId }) => [
        {
          type: "ZohoTaskViews",
          id: projectId,
        },
      ],
    }),

    // ========================================================
    // MY TASK VIEWS
    // GET /zoho/projects/:ownerKey/portals/:portalId/mytasks-views
    // ⚠️ V3 confirms GET /api/v3/portal/{portal_id}/mytasks exists;
    // "mytasks-views" specifically wasn't confirmed — verify service mapping.
    // ========================================================

    getZohoMyTasksViews: builder.query({
      query: ({ portalId }) => {
        const url = getOwnerUrl(
          `/portals/${encodeURIComponent(portalId)}/mytasks-views`,
        );

        return {
          url: url || `${invalidOwnerUrl}/mytasks-views`,
          method: "GET",
        };
      },

      transformResponse: (response) => {
        return extractRecords(response);
      },

      providesTags: (result, error, { portalId }) => [
        {
          type: "ZohoMyTaskViews",
          id: portalId,
        },
      ],
    }),
  }),

  overrideExisting: true,
});

// ============================================================
// HOOKS
// ============================================================

export const {
  // Portals
  useGetZohoPortalsQuery,

  // Projects
  useGetZohoProjectsQuery,
  useGetZohoProjectQuery,
  useCreateZohoProjectMutation,
  useUpdateZohoProjectMutation,
  useDeleteZohoProjectMutation,

  // Tasklists
  useGetZohoTasklistsQuery,
  useCreateZohoTasklistMutation,
  useUpdateZohoTasklistMutation,
  useDeleteZohoTasklistMutation,
  useGetZohoTasklistTasksQuery,

  // Tasks
  useGetZohoTasksQuery,
  useGetZohoTaskQuery,
  useCreateZohoTaskMutation,
  useUpdateZohoTaskMutation,
  useDeleteZohoTaskMutation,
  useReorderZohoTaskMutation,
  useGetZohoTaskActivitiesQuery,
  useFollowZohoTaskMutation,
  useUnfollowZohoTaskMutation,

  // Subtasks
  useGetZohoSubtasksQuery,
  useCreateZohoSubtaskMutation,

  // Layouts / Views
  useGetZohoTaskLayoutsQuery,
  useGetZohoTaskViewsQuery,
  useGetZohoMyTasksViewsQuery,
} = tasksApi;
