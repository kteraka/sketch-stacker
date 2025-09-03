import { useState, useEffect } from 'react';
import ImageItem from './ImageItem';
import Modal from './Modal';
import ContributionCalendar from './ContributionCalendar';
import Masonry from 'react-masonry-css';

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
  const JSON_URL = "https://d3a21s3joww9j4.cloudfront.net/viewer/images.json";
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

  const handleLoadMore = () => {
    const currentCount = displayedImages.length;
    const nextBatch = images.slice(currentCount, currentCount + INITIAL_COUNT);
    setDisplayedImages([...displayedImages, ...nextBatch]);
    
    if (currentCount + INITIAL_COUNT >= images.length) {
      setShowAll(true);
    }
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

  const breakpointColumns = {
    default: 6,
    1200: 5,
    900: 4,
    700: 3,
    500: 2,
    350: 1
  };

  return (
    <>
      {/* Contribution Calendar */}
      <ContributionCalendar images={images} />
      
      <Masonry
        breakpointCols={breakpointColumns}
        className="gallery"
        columnClassName="gallery-column"
      >
        {displayedImages.map((imageName, index) => (
          <ImageItem
            key={`${imageName}-${index}`}
            imageName={imageName}
            baseUrl={BASE_URL}
            onImageClick={handleImageClick}
          />
        ))}
      </Masonry>
      
      {hasMoreImages && (
        <button 
          className="load-more" 
          onClick={handleLoadMore}
        >
          Load More ({Math.min(INITIAL_COUNT, images.length - displayedImages.length)} more)
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