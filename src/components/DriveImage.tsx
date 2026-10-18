import { useState } from 'react';
import { driveFallback, driveThumbnail } from '../lib/drive';

function ImageWithFallback({ fileId, alt, className }: { fileId: string; alt: string; className?: string }) {
  const [stage, setStage] = useState(0);
  if (stage > 1) return null;
  return <img src={stage === 0 ? driveThumbnail(fileId) : driveFallback(fileId)} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setStage(value => value + 1)} />;
}
export function DriveImage(props: { fileId: string; alt: string; className?: string }) { return <ImageWithFallback key={props.fileId} {...props} />; }
