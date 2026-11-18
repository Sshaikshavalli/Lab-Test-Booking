/** Pure cart logic – shared cart interface. State = array of unique test ids. */
export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': return state.includes(action.id) ? state : [...state, action.id];
    case 'remove': return state.filter((id) => id !== action.id);
    case 'toggle': return state.includes(action.id) ? state.filter((id) => id !== action.id) : [...state, action.id];
    case 'clear': return [];
    case 'hydrate': {
      const next = Array.isArray(action.ids) ? [...new Set(action.ids.filter((i) => typeof i === 'string'))] : [];
      // Keep the same reference when nothing changed so cross-tab sync never causes extra renders.
      return next.length === state.length && next.every((id, i) => id === state[i]) ? state : next;
    }
    default: return state;
  }
}
