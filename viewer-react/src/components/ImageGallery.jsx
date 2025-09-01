import { useState, useEffect } from 'react';
import ImageItem from './ImageItem';
import Modal from './Modal';

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 設定
  const BASE_URL = "https://d3a21s3joww9j4.cloudfront.net/";
  const JSON_URL = import.meta.env.DEV 
    ? "/test-images.json"  // 開発：テストデータ 
    : "https://d3a21s3joww9j4.cloudfront.net/viewer/images.json";  // 本番：直接CloudFront
  const EXCLUDE = ["viewer/", "viewer/index.html", "viewer/images.json"];
  const INITIAL_COUNT = 20;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(JSON_URL, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const files = await response.json();
      
      // フィルタリングとソート
      const filteredFiles = files
        .filter(name => !EXCLUDE.includes(name))
        .sort((a, b) => b.localeCompare(a)); // 降順（新しい順）
      
      setImages(filteredFiles);
      setDisplayedImages(filteredFiles.slice(0, INITIAL_COUNT));
    } catch (err) {
      console.error("画像リスト取得失敗", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAll = () => {
    setDisplayedImages(images);
    setShowAll(true);
  };

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalImageUrl('');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const hasMoreImages = !showAll && images.length > INITIAL_COUNT;

  return (
    <>
      <div className="gallery">
        {displayedImages.map((imageName, index) => (
          <ImageItem
            key={`${imageName}-${index}`}
            imageName={imageName}
            baseUrl={BASE_URL}
            onImageClick={handleImageClick}
          />
        ))}
      </div>
      
      {hasMoreImages && (
        <button 
          className="show-all" 
          onClick={handleShowAll}
        >
          Show All
        </button>
      )}
      
      <Modal
        isOpen={modalOpen}
        imageUrl={modalImageUrl}
        onClose={handleModalClose}
      />
    </>
  );
};

export default ImageGallery;