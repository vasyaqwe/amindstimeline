import { create } from "zustand"

const dialogs = {
   imagePreview: false,
}

export type Dialog = keyof typeof dialogs

type StoreState = {
   dialogs: typeof dialogs
   showDialog: (dialog: Dialog) => void
   closeDialog: (dialog: Dialog) => void
   previewImageSrc: string
}

export const useGlobalStore = create<StoreState>()((set) => ({
   dialogs,
   previewImageSrc: "",
   showDialog: (dialog) =>
      set((state) => ({ dialogs: { ...state.dialogs, [dialog]: true } })),
   closeDialog: (dialog) =>
      set((state) => {
         return {
            dialogs: { ...state.dialogs, [dialog]: false },
         }
      }),
}))
