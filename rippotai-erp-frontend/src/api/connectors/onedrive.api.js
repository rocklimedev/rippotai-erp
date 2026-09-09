import { baseApi } from "../../store/baseApi";

export const onedriveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // ONEDRIVE
    // =========================

    getOneDrive: builder.query({
      query: () => ({
        url: "/onedrive",
      }),
      providesTags: ["OneDrive"],
    }),

    // =========================
    // FILES / FOLDERS
    // =========================

    getOneDriveFiles: builder.query({
      query: (folderPath = "root") => ({
        url: "/onedrive/files",
        params: {
          folderPath,
        },
      }),
      providesTags: ["OneDriveFiles"],
    }),

    // =========================
    // FILE / FOLDER METADATA
    // =========================

    getOneDriveFileMetadata: builder.query({
      query: (itemId) => ({
        url: `/onedrive/files/${itemId}`,
      }),
      providesTags: ["OneDriveFiles"],
    }),

    // =========================
    // DOWNLOAD FILE
    // =========================

    downloadOneDriveFile: builder.query({
      query: (itemId) => ({
        url: `/onedrive/files/${itemId}/download`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error("Failed to download file");
          }

          return response.blob();
        },
      }),
    }),

    // =========================
    // UPLOAD SMALL FILE
    // =========================

    uploadOneDriveFile: builder.mutation({
      query: ({ file, folderPath = "root" }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: "/onedrive/upload",
          method: "POST",
          params: {
            folderPath,
          },
          body: formData,
        };
      },
      invalidatesTags: ["OneDriveFiles", "OneDrive"],
    }),

    // =========================
    // UPLOAD LARGE FILE
    // =========================

    uploadLargeOneDriveFile: builder.mutation({
      query: ({ file, folderPath = "root" }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: "/onedrive/upload-large",
          method: "POST",
          params: {
            folderPath,
          },
          body: formData,
        };
      },
      invalidatesTags: ["OneDriveFiles", "OneDrive"],
    }),

    // =========================
    // CREATE FOLDER
    // =========================

    createOneDriveFolder: builder.mutation({
      query: ({ folderName, parentPath = "root" }) => ({
        url: "/onedrive/folders",
        method: "POST",
        params: {
          parentPath,
          folderName,
        },
      }),
      invalidatesTags: ["OneDriveFiles", "OneDrive"],
    }),

    // =========================
    // DELETE FILE / FOLDER
    // =========================

    deleteOneDriveFile: builder.mutation({
      query: (itemId) => ({
        url: `/onedrive/files/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OneDriveFiles", "OneDrive"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // =========================
  // ONEDRIVE
  // =========================

  useGetOneDriveQuery,
  useLazyGetOneDriveQuery,

  // =========================
  // FILES / FOLDERS
  // =========================

  useGetOneDriveFilesQuery,
  useLazyGetOneDriveFilesQuery,

  // =========================
  // METADATA
  // =========================

  useGetOneDriveFileMetadataQuery,
  useLazyGetOneDriveFileMetadataQuery,

  // =========================
  // DOWNLOAD
  // =========================

  useLazyDownloadOneDriveFileQuery,

  // =========================
  // UPLOAD
  // =========================

  useUploadOneDriveFileMutation,
  useUploadLargeOneDriveFileMutation,

  // =========================
  // FOLDER
  // =========================

  useCreateOneDriveFolderMutation,

  // =========================
  // DELETE
  // =========================

  useDeleteOneDriveFileMutation,
} = onedriveApi;
