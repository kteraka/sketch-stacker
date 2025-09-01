const Modal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={handleBackdropClick}>
      <img src={imageUrl} alt="preview" />
    </div>
  );
};

export default Modal;