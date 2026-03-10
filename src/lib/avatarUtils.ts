/**
 * Utility functions for avatar handling
 */

/**
 * Get initials from a name or username
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Get avatar display data (either image URL or fallback initials)
 */
export const getAvatarDisplay = (
  name?: string | null,
  avatarUrl?: string | null
): { image?: string; initials: string } => {
  return {
    image: avatarUrl || undefined,
    initials: getInitials(name),
  };
};
