export const driveThumbnail = (id: string) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`;
export const driveFallback = (id: string) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1000`;
export const driveLink = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
