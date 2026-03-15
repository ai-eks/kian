import { create } from 'zustand';

interface UIState {
  leftPaneWidth: number;
  setLeftPaneWidth: (value: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPaneWidth: 70,
  setLeftPaneWidth: (leftPaneWidth) => set({ leftPaneWidth })
}));
