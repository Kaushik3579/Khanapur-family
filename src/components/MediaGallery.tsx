import React from 'react';

interface Props {
  mediaUrls: string[];
}

const MediaGallery: React.FC<Props> = ({ mediaUrls }) => (
  <div className="grid grid-cols-2 gap-2">
    {mediaUrls.map((url, idx) => (
      url.match(/\.(mp4|webm|ogg)$/i) ? (
        <video key={idx} src={url} controls className="w-full h-40 object-cover rounded" />
      ) : (
        <img key={idx} src={url} alt="media" className="w-full h-40 object-cover rounded" />
      )
    ))}
  </div>
);

export default MediaGallery;
