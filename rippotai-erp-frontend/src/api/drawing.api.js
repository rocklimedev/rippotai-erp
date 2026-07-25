import { baseApi } from "../store/baseApi";

export const drawingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDrawings: builder.query({
      query: () => "/drawings",
      providesTags: ["Drawing"],
    }),

    // single-drawing detail query backing DrawingsView.jsx
    getDrawingById: builder.query({
      query: (id) => `/drawings/${id}`,
      providesTags: (result, error, id) => [{ type: "Drawing", id }],
    }),

    uploadDrawing: builder.mutation({
      query: ({ data, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: "/drawings",
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: ["Drawing"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDrawingsQuery,
  useGetDrawingByIdQuery,
  useUploadDrawingMutation,
} = drawingApi;
