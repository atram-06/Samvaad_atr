import React, { useRef, useEffect, useState } from 'react';
import { FiX, FiCamera } from 'react-icons/fi';
import './CameraModal.css';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have granted permission.");
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageUrl = canvas.toDataURL('image/jpeg');
            onCapture(imageUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-modal-overlay">
            <div className="camera-modal">
                <div className="camera-header">
                    <h3>Take Photo</h3>
                    <button onClick={onClose} className="close-btn"><FiX /></button>
                </div>
                <div className="camera-view">
                    <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
                <div className="camera-controls">
                    <button onClick={capturePhoto} className="capture-btn">
                        <div className="capture-inner"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
