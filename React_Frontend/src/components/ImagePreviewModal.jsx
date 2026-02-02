
const ImagePreviewModal = ({ src, onClose }) => {
    // If no src is provided, don't render the modal
    if (!src) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4" // Increased z-index
            onClick={onClose} // Click outside closes the modal
        >
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <img
                    src={src}
                    alt="Preview"
                    className="max-w-full max-h-screen object-contain"
                />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white text-4xl font-bold bg-gray-800 bg-opacity-50 hover:bg-opacity-75 transition-all duration-200 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer"
                    aria-label="Close image preview"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;