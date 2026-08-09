import React, { useState, useRef } from 'react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.min.css'
import { motion } from 'framer-motion'
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react'

const ImageCropModal = ({ imageSrc, aspectRatio, onCropComplete, onCancel }) => {
  const cropperRef = useRef(null)
  
  // States for transform
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [dragMode, setDragMode] = useState('crop') // 'crop' or 'move'

  const handleCrop = () => {
    const imageElement = cropperRef?.current
    const cropper = imageElement?.cropper

    if (cropper) {
      // Get the cropped canvas
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty')
          return
        }
        
        // Create a File from the blob
        const croppedFile = new File([blob], 'cropped_image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        
        onCropComplete(croppedFile)
      }, 'image/jpeg', 0.9) // 0.9 quality
    }
  }

  const rotate = (degree) => {
    cropperRef.current?.cropper.rotate(degree)
  }

  const zoom = (ratio) => {
    cropperRef.current?.cropper.zoom(ratio)
  }

  const toggleFlipHorizontal = () => {
    const newScaleX = scaleX === 1 ? -1 : 1
    cropperRef.current?.cropper.scaleX(newScaleX)
    setScaleX(newScaleX)
  }

  const toggleFlipVertical = () => {
    const newScaleY = scaleY === 1 ? -1 : 1
    cropperRef.current?.cropper.scaleY(newScaleY)
    setScaleY(newScaleY)
  }

  const toggleDragMode = () => {
    const newMode = dragMode === 'crop' ? 'move' : 'crop'
    cropperRef.current?.cropper.setDragMode(newMode)
    setDragMode(newMode)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/20">
          <h3 className="font-bold text-foreground text-lg">Edit Photo</h3>
          <button 
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="bg-black/5 p-4 sm:p-6">
          <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-border/50 bg-black/10 shadow-inner">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: '100%', width: '100%' }}
              aspectRatio={aspectRatio}
              guides={true}
              viewMode={1}
              dragMode={dragMode}
              background={false}
              responsive={true}
              autoCropArea={0.8}
              checkOrientation={false} // Disable auto orientation to allow manual rotation/flip
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 sm:p-6 bg-card border-t border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border/40">
              <button onClick={() => rotate(-90)} title="Rotate Left" className="p-2 rounded-lg hover:bg-background text-foreground transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => rotate(90)} title="Rotate Right" className="p-2 rounded-lg hover:bg-background text-foreground transition-colors">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border/40">
              <button onClick={toggleFlipHorizontal} title="Mirror Horizontal" className={`p-2 rounded-lg transition-colors ${scaleX === -1 ? 'bg-primary/20 text-primary' : 'hover:bg-background text-foreground'}`}>
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button onClick={toggleFlipVertical} title="Mirror Vertical" className={`p-2 rounded-lg transition-colors ${scaleY === -1 ? 'bg-primary/20 text-primary' : 'hover:bg-background text-foreground'}`}>
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border/40">
              <button onClick={() => zoom(0.1)} title="Zoom In" className="p-2 rounded-lg hover:bg-background text-foreground transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => zoom(-0.1)} title="Zoom Out" className="p-2 rounded-lg hover:bg-background text-foreground transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border/40">
              <button onClick={toggleDragMode} title={dragMode === 'crop' ? 'Move Mode' : 'Crop Mode'} className={`p-2 rounded-lg transition-colors ${dragMode === 'move' ? 'bg-primary/20 text-primary' : 'hover:bg-background text-foreground'}`}>
                <Move className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onCancel}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCrop}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Apply
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}

export default ImageCropModal
