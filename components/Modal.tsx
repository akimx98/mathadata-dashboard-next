import React, { CSSProperties, MouseEvent } from "react";

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback function when the modal should be closed */
  onClose: () => void;
  /** Title text displayed in the modal header */
  title: string;
  /** Optional subtitle text displayed below the title */
  subtitle?: string;
  /** Content to be rendered inside the modal */
  children: React.ReactNode;
  /** Maximum width of the modal (default: "800px") */
  maxWidth?: string;
  /** Optional z-index for the modal (default: 1000) */
  zIndex?: number;
}

/**
 * Reusable modal component with backdrop and close functionality
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="My Modal"
 *   subtitle="Additional info"
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = "800px",
  zIndex = 1000
}) => {
  if (!isOpen) return null;
  
  const backdropStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex,
    padding: "20px"
  };
  
  const modalStyle: CSSProperties = {
    maxWidth,
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto"
  };
  
  const headerStyle: CSSProperties = {
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "start", 
    marginBottom: "16px"
  };
  
  const titleContainerStyle: CSSProperties = {
    flex: 1
  };
  
  const titleStyle: CSSProperties = {
    marginBottom: subtitle ? "4px" : "0"
  };
  
  const subtitleStyle: CSSProperties = {
    marginTop: 0
  };
  
  const closeButtonStyle: CSSProperties = {
    fontSize: "1.5rem",
    padding: "4px 12px",
    lineHeight: 1,
    cursor: "pointer"
  };
  
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleModalClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  
  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div className="card" style={modalStyle} onClick={handleModalClick}>
        <div style={headerStyle}>
          <div style={titleContainerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            {subtitle && <p className="muted" style={subtitleStyle}>{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
