export function mergeScopeSpaces(projectSpaces = [], draftSpaces = []) {
  const byId = new Map();
  for (const space of [...projectSpaces, ...draftSpaces]) {
    byId.set(space.id, { ...byId.get(space.id), ...space });
  }
  return [...byId.values()];
}

export function scopeItemsForSpace(items, spaceId, spaces) {
  return items.flatMap((item, index) => {
    const matches = spaceId === null
      ? !spaces.some((space) => space.id === item.project_space_id)
      : item.project_space_id === spaceId;
    return matches ? [{ item, index }] : [];
  });
}
